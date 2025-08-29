"""
Telemetry Worker - Event ingestion and analytics processing
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import hashlib
from user_agents import parse as parse_user_agent

from shared.database import get_clickhouse_client, get_redis_client
from shared.message_bus import subscribe_to_topic, publish_message, TOPICS
from shared.config import get_settings

logger = logging.getLogger(__name__)

class TelemetryWorker:
    def __init__(self):
        self.settings = get_settings()
        self.is_running = False
        self.processed_count = 0
        self.error_count = 0
        
        # Event types
        self.event_types = {
            'email_sent', 'email_opened', 'email_clicked', 'email_reported',
            'sms_sent', 'sms_clicked', 'sms_reported',
            'voice_answered', 'voice_completed', 'voice_reported',
            'chat_sent', 'chat_clicked', 'chat_reported',
            'landing_visited', 'landing_form_submitted', 'landing_reported',
            'training_started', 'training_completed', 'quiz_submitted'
        }
        
        # Bot detection patterns
        self.bot_patterns = [
            'bot', 'crawler', 'spider', 'scraper', 'scanner',
            'monitor', 'check', 'test', 'probe'
        ]

    async def start(self):
        """Start the telemetry worker"""
        self.is_running = True
        await subscribe_to_topic(TOPICS['event_ingest'], self.handle_event_ingestion, 'telemetry_workers')
        logger.info("Telemetry worker started")

    async def stop(self):
        """Stop the telemetry worker"""
        self.is_running = False
        logger.info("Telemetry worker stopped")

    async def handle_event_ingestion(self, data: Dict[str, Any], msg):
        """Handle event ingestion request"""
        try:
            event_type = data.get('event_type')
            
            if event_type not in self.event_types:
                raise ValueError(f"Unknown event type: {event_type}")
            
            # Process and validate event
            processed_event = await self.process_event(data)
            
            # Check for bot/automated traffic
            if await self._is_bot_traffic(processed_event):
                logger.info(f"Bot traffic detected, filtering event: {event_type}")
                return
            
            # Deduplicate event
            if await self._is_duplicate_event(processed_event):
                logger.info(f"Duplicate event detected, skipping: {event_type}")
                return
            
            # Store in ClickHouse
            await self._store_event(processed_event)
            
            # Update real-time metrics in Redis
            await self._update_realtime_metrics(processed_event)
            
            # Trigger coaching if applicable
            if self._should_trigger_coaching(processed_event):
                await self._trigger_coaching(processed_event)
            
            # Send response if reply_to is provided
            if msg.reply:
                await msg.respond({
                    'success': True,
                    'event_id': processed_event['id']
                })
            
            self.processed_count += 1
            
        except Exception as e:
            logger.error(f"Error handling event ingestion: {e}")
            self.error_count += 1
            
            if msg.reply:
                await msg.respond({
                    'success': False,
                    'error': str(e)
                })

    async def process_event(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and enrich event data"""
        event = {
            'id': self._generate_event_id(data),
            'event_type': data.get('event_type'),
            'campaign_id': data.get('campaign_id'),
            'user_id': data.get('user_id'),
            'org_id': data.get('org_id'),
            'timestamp': datetime.utcnow(),
            'ip_address': data.get('ip_address'),
            'user_agent': data.get('user_agent', ''),
            'properties': data.get('properties', {}),
            'created_at': datetime.utcnow()
        }
        
        # Enrich with user agent parsing
        if event['user_agent']:
            ua = parse_user_agent(event['user_agent'])
            event['properties'].update({
                'browser': ua.browser.family,
                'browser_version': ua.browser.version_string,
                'os': ua.os.family,
                'os_version': ua.os.version_string,
                'device': ua.device.family,
                'is_mobile': ua.is_mobile,
                'is_tablet': ua.is_tablet,
                'is_pc': ua.is_pc
            })
        
        # Add geolocation if IP is available
        if event['ip_address']:
            geo_data = await self._get_geolocation(event['ip_address'])
            if geo_data:
                event['properties'].update(geo_data)
        
        return event

    def _generate_event_id(self, data: Dict[str, Any]) -> str:
        """Generate unique event ID"""
        key_data = f"{data.get('event_type')}_{data.get('campaign_id')}_{data.get('user_id')}_{datetime.utcnow().isoformat()}"
        return hashlib.sha256(key_data.encode()).hexdigest()[:16]

    async def _is_bot_traffic(self, event: Dict[str, Any]) -> bool:
        """Detect bot/automated traffic"""
        user_agent = event.get('user_agent', '').lower()
        
        # Check for bot patterns in user agent
        for pattern in self.bot_patterns:
            if pattern in user_agent:
                return True
        
        # Check for suspicious timing patterns
        if await self._has_suspicious_timing(event):
            return True
        
        # Check for known bot IPs
        if await self._is_known_bot_ip(event.get('ip_address')):
            return True
        
        return False

    async def _has_suspicious_timing(self, event: Dict[str, Any]) -> bool:
        """Check for suspicious timing patterns"""
        redis = await get_redis_client()
        
        # Check for rapid-fire events from same user
        user_key = f"user_events:{event['user_id']}"
        recent_events = await redis.lrange(user_key, 0, 10)
        
        if len(recent_events) > 5:
            # More than 5 events in recent history, check timing
            timestamps = [float(ts) for ts in recent_events]
            if len(timestamps) > 1:
                time_diffs = [timestamps[i] - timestamps[i+1] for i in range(len(timestamps)-1)]
                avg_diff = sum(time_diffs) / len(time_diffs)
                
                # If average time between events is less than 1 second, likely bot
                if avg_diff < 1.0:
                    return True
        
        # Add current event timestamp
        await redis.lpush(user_key, event['timestamp'].timestamp())
        await redis.ltrim(user_key, 0, 10)  # Keep only recent 10 events
        await redis.expire(user_key, 3600)  # 1 hour TTL
        
        return False

    async def _is_known_bot_ip(self, ip_address: str) -> bool:
        """Check if IP is from known bot/scanner"""
        if not ip_address:
            return False
        
        # Check against known bot IP ranges
        # This would be implemented with actual bot IP databases
        bot_ip_ranges = [
            '127.0.0.1',  # localhost
            '0.0.0.0'     # invalid
        ]
        
        return ip_address in bot_ip_ranges

    async def _is_duplicate_event(self, event: Dict[str, Any]) -> bool:
        """Check for duplicate events"""
        redis = await get_redis_client()
        
        # Create deduplication key
        dedup_key = f"event_dedup:{event['id']}"
        
        # Check if event already exists
        exists = await redis.exists(dedup_key)
        if exists:
            return True
        
        # Mark event as seen
        await redis.setex(dedup_key, 3600, "1")  # 1 hour TTL
        return False

    async def _store_event(self, event: Dict[str, Any]):
        """Store event in ClickHouse"""
        clickhouse = get_clickhouse_client()
        
        try:
            # Prepare data for ClickHouse
            ch_data = {
                'id': event['id'],
                'event_type': event['event_type'],
                'campaign_id': event['campaign_id'] or '',
                'user_id': event['user_id'] or '',
                'org_id': event['org_id'] or '',
                'timestamp': event['timestamp'],
                'properties': json.dumps(event['properties']),
                'user_agent': event['user_agent'],
                'ip_address': event['ip_address'] or '0.0.0.0',
                'created_at': event['created_at']
            }
            
            # Insert into events table
            clickhouse.execute(
                """
                INSERT INTO ai_defense_events.events 
                (id, event_type, campaign_id, user_id, org_id, timestamp, properties, user_agent, ip_address, created_at)
                VALUES
                """,
                [ch_data]
            )
            
            logger.debug(f"Event stored in ClickHouse: {event['id']}")
            
        except Exception as e:
            logger.error(f"Failed to store event in ClickHouse: {e}")
            raise

    async def _update_realtime_metrics(self, event: Dict[str, Any]):
        """Update real-time metrics in Redis"""
        redis = await get_redis_client()
        
        try:
            # Campaign-level metrics
            campaign_key = f"metrics:campaign:{event['campaign_id']}"
            await redis.hincrby(campaign_key, f"total_{event['event_type']}", 1)
            await redis.expire(campaign_key, 86400)  # 24 hours TTL
            
            # Organization-level metrics
            org_key = f"metrics:org:{event['org_id']}"
            await redis.hincrby(org_key, f"total_{event['event_type']}", 1)
            await redis.expire(org_key, 86400)
            
            # User-level metrics
            user_key = f"metrics:user:{event['user_id']}"
            await redis.hincrby(user_key, f"total_{event['event_type']}", 1)
            await redis.expire(user_key, 86400)
            
            # Global metrics
            global_key = "metrics:global"
            await redis.hincrby(global_key, f"total_{event['event_type']}", 1)
            await redis.expire(global_key, 86400)
            
        except Exception as e:
            logger.error(f"Failed to update real-time metrics: {e}")

    def _should_trigger_coaching(self, event: Dict[str, Any]) -> bool:
        """Determine if coaching should be triggered for this event"""
        coaching_triggers = {
            'email_clicked', 'sms_clicked', 'landing_visited', 
            'landing_form_submitted', 'chat_clicked'
        }
        
        return event['event_type'] in coaching_triggers

    async def _trigger_coaching(self, event: Dict[str, Any]):
        """Trigger just-in-time coaching"""
        coaching_data = {
            'type': 'trigger_coaching',
            'event_id': event['id'],
            'event_type': event['event_type'],
            'user_id': event['user_id'],
            'campaign_id': event['campaign_id'],
            'org_id': event['org_id'],
            'context': event['properties']
        }
        
        await publish_message(TOPICS['coach_send'], coaching_data)
        logger.info(f"Coaching triggered for event: {event['id']}")

    async def _get_geolocation(self, ip_address: str) -> Optional[Dict[str, Any]]:
        """Get geolocation data for IP address"""
        # This would integrate with a geolocation service
        # For now, return mock data for localhost
        if ip_address in ['127.0.0.1', 'localhost']:
            return {
                'country': 'US',
                'region': 'CA',
                'city': 'San Francisco',
                'latitude': 37.7749,
                'longitude': -122.4194,
                'timezone': 'America/Los_Angeles'
            }
        
        return None

    async def get_campaign_metrics(self, campaign_id: str) -> Dict[str, Any]:
        """Get real-time metrics for a campaign"""
        redis = await get_redis_client()
        
        campaign_key = f"metrics:campaign:{campaign_id}"
        metrics = await redis.hgetall(campaign_key)
        
        return {
            'campaign_id': campaign_id,
            'metrics': metrics,
            'last_updated': datetime.utcnow().isoformat()
        }

    async def get_user_metrics(self, user_id: str) -> Dict[str, Any]:
        """Get real-time metrics for a user"""
        redis = await get_redis_client()
        
        user_key = f"metrics:user:{user_id}"
        metrics = await redis.hgetall(user_key)
        
        return {
            'user_id': user_id,
            'metrics': metrics,
            'last_updated': datetime.utcnow().isoformat()
        }
