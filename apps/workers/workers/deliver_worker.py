"""
Delivery Worker - Multi-channel message delivery with throttling and compliance
"""

import asyncio
import logging
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import aiohttp
from twilio.rest import Client as TwilioClient

from shared.database import get_async_session, get_redis_client
from shared.message_bus import subscribe_to_topic, publish_message, TOPICS
from shared.config import get_settings

logger = logging.getLogger(__name__)

class DeliveryError(Exception):
    """Raised when delivery fails"""
    pass

class DeliverWorker:
    def __init__(self):
        self.settings = get_settings()
        self.is_running = False
        self.processed_count = 0
        self.error_count = 0
        
        # Initialize service clients
        if self.settings.twilio_account_sid and self.settings.twilio_auth_token:
            self.twilio_client = TwilioClient(
                self.settings.twilio_account_sid,
                self.settings.twilio_auth_token
            )
        else:
            self.twilio_client = None
        
        # Rate limiting
        self.rate_limiter = {}

    async def start(self):
        """Start the delivery worker"""
        self.is_running = True
        await subscribe_to_topic(TOPICS['deliver_send'], self.handle_delivery_request, 'deliver_workers')
        logger.info("Delivery worker started")

    async def stop(self):
        """Stop the delivery worker"""
        self.is_running = False
        logger.info("Delivery worker stopped")

    async def handle_delivery_request(self, data: Dict[str, Any], msg):
        """Handle delivery request"""
        try:
            delivery_type = data.get('type')
            
            if delivery_type == 'email':
                result = await self.deliver_email(data)
            elif delivery_type == 'sms':
                result = await self.deliver_sms(data)
            elif delivery_type == 'voice':
                result = await self.deliver_voice(data)
            elif delivery_type == 'chat':
                result = await self.deliver_chat(data)
            else:
                raise ValueError(f"Unknown delivery type: {delivery_type}")
            
            # Log delivery attempt
            await self._log_delivery_attempt(data, result)
            
            # Send response if reply_to is provided
            if msg.reply:
                await msg.respond(result)
            
            self.processed_count += 1
            
        except Exception as e:
            logger.error(f"Error handling delivery request: {e}")
            self.error_count += 1
            
            if msg.reply:
                await msg.respond({
                    'success': False,
                    'error': str(e)
                })

    async def deliver_email(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Deliver email simulation"""
        recipient = data.get('recipient')
        subject = data.get('subject')
        content = data.get('content')
        sender = data.get('sender', 'training@ai-defense-trainer.com')
        campaign_id = data.get('campaign_id')
        
        # Validate inputs
        if not all([recipient, subject, content]):
            raise DeliveryError("Missing required email fields")
        
        # Check rate limiting
        await self._check_rate_limit('email', recipient)
        
        # Add tracking parameters
        tracking_id = f"{campaign_id}_{recipient}_{datetime.utcnow().timestamp()}"
        tracked_content = await self._add_email_tracking(content, tracking_id)
        
        # Deliver via configured method
        if self.settings.sendgrid_api_key:
            result = await self._deliver_via_sendgrid(recipient, subject, tracked_content, sender)
        elif self.settings.smtp_host:
            result = await self._deliver_via_smtp(recipient, subject, tracked_content, sender)
        else:
            # Simulation mode - don't actually send
            result = await self._simulate_email_delivery(recipient, subject, tracked_content)
        
        return {
            'success': True,
            'delivery_id': tracking_id,
            'recipient': recipient,
            'delivered_at': datetime.utcnow().isoformat(),
            'method': result.get('method', 'simulation')
        }

    async def _deliver_via_sendgrid(self, recipient: str, subject: str, content: str, sender: str) -> Dict[str, Any]:
        """Deliver email via SendGrid"""
        import sendgrid
        from sendgrid.helpers.mail import Mail
        
        sg = sendgrid.SendGridAPIClient(api_key=self.settings.sendgrid_api_key)
        
        # Add safety watermark to subject
        safe_subject = f"[TRAINING SIMULATION] {subject}"
        
        message = Mail(
            from_email=sender,
            to_emails=recipient,
            subject=safe_subject,
            html_content=content
        )
        
        try:
            response = sg.send(message)
            return {
                'method': 'sendgrid',
                'status_code': response.status_code,
                'message_id': response.headers.get('X-Message-Id')
            }
        except Exception as e:
            raise DeliveryError(f"SendGrid delivery failed: {e}")

    async def _deliver_via_smtp(self, recipient: str, subject: str, content: str, sender: str) -> Dict[str, Any]:
        """Deliver email via SMTP"""
        # Add safety watermark to subject
        safe_subject = f"[TRAINING SIMULATION] {subject}"
        
        msg = MimeMultipart('alternative')
        msg['Subject'] = safe_subject
        msg['From'] = sender
        msg['To'] = recipient
        
        html_part = MimeText(content, 'html')
        msg.attach(html_part)
        
        try:
            with smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port) as server:
                if self.settings.smtp_username and self.settings.smtp_password:
                    server.starttls()
                    server.login(self.settings.smtp_username, self.settings.smtp_password)
                
                server.send_message(msg)
            
            return {
                'method': 'smtp',
                'status': 'sent'
            }
        except Exception as e:
            raise DeliveryError(f"SMTP delivery failed: {e}")

    async def _simulate_email_delivery(self, recipient: str, subject: str, content: str) -> Dict[str, Any]:
        """Simulate email delivery for testing"""
        logger.info(f"SIMULATED EMAIL DELIVERY to {recipient}: {subject}")
        
        # Store in Redis for testing/debugging
        redis = await get_redis_client()
        simulation_key = f"simulated_email:{recipient}:{datetime.utcnow().timestamp()}"
        await redis.setex(
            simulation_key,
            3600,  # 1 hour TTL
            f"Subject: {subject}\nContent: {content[:200]}..."
        )
        
        return {
            'method': 'simulation',
            'simulation_key': simulation_key
        }

    async def deliver_sms(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Deliver SMS simulation"""
        recipient = data.get('recipient')
        content = data.get('content')
        campaign_id = data.get('campaign_id')
        
        if not all([recipient, content]):
            raise DeliveryError("Missing required SMS fields")
        
        # Check rate limiting
        await self._check_rate_limit('sms', recipient)
        
        # Add safety prefix
        safe_content = f"[TRAINING SIM] {content}"
        
        # Deliver via configured method
        if self.twilio_client:
            result = await self._deliver_via_twilio(recipient, safe_content)
        else:
            result = await self._simulate_sms_delivery(recipient, safe_content)
        
        tracking_id = f"{campaign_id}_{recipient}_{datetime.utcnow().timestamp()}"
        
        return {
            'success': True,
            'delivery_id': tracking_id,
            'recipient': recipient,
            'delivered_at': datetime.utcnow().isoformat(),
            'method': result.get('method', 'simulation')
        }

    async def _deliver_via_twilio(self, recipient: str, content: str) -> Dict[str, Any]:
        """Deliver SMS via Twilio"""
        try:
            message = self.twilio_client.messages.create(
                body=content,
                from_='+1234567890',  # Configure your Twilio number
                to=recipient
            )
            
            return {
                'method': 'twilio',
                'message_sid': message.sid,
                'status': message.status
            }
        except Exception as e:
            raise DeliveryError(f"Twilio delivery failed: {e}")

    async def _simulate_sms_delivery(self, recipient: str, content: str) -> Dict[str, Any]:
        """Simulate SMS delivery for testing"""
        logger.info(f"SIMULATED SMS DELIVERY to {recipient}: {content}")
        
        redis = await get_redis_client()
        simulation_key = f"simulated_sms:{recipient}:{datetime.utcnow().timestamp()}"
        await redis.setex(simulation_key, 3600, content)
        
        return {
            'method': 'simulation',
            'simulation_key': simulation_key
        }

    async def deliver_voice(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Deliver voice simulation (TTS script)"""
        recipient = data.get('recipient')
        script = data.get('script')
        campaign_id = data.get('campaign_id')
        
        if not all([recipient, script]):
            raise DeliveryError("Missing required voice fields")
        
        # For now, simulate voice delivery
        # In production, this would integrate with voice services
        logger.info(f"SIMULATED VOICE DELIVERY to {recipient}")
        
        tracking_id = f"{campaign_id}_{recipient}_{datetime.utcnow().timestamp()}"
        
        return {
            'success': True,
            'delivery_id': tracking_id,
            'recipient': recipient,
            'delivered_at': datetime.utcnow().isoformat(),
            'method': 'simulation'
        }

    async def deliver_chat(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Deliver chat message simulation"""
        recipient = data.get('recipient')
        content = data.get('content')
        platform = data.get('platform', 'slack')
        campaign_id = data.get('campaign_id')
        
        if not all([recipient, content]):
            raise DeliveryError("Missing required chat fields")
        
        # Add safety prefix
        safe_content = f"🚨 [TRAINING SIMULATION] {content}"
        
        if platform == 'slack':
            result = await self._deliver_via_slack(recipient, safe_content)
        elif platform == 'teams':
            result = await self._deliver_via_teams(recipient, safe_content)
        else:
            result = await self._simulate_chat_delivery(recipient, safe_content, platform)
        
        tracking_id = f"{campaign_id}_{recipient}_{datetime.utcnow().timestamp()}"
        
        return {
            'success': True,
            'delivery_id': tracking_id,
            'recipient': recipient,
            'delivered_at': datetime.utcnow().isoformat(),
            'method': result.get('method', 'simulation'),
            'platform': platform
        }

    async def _deliver_via_slack(self, recipient: str, content: str) -> Dict[str, Any]:
        """Deliver message via Slack"""
        if not self.settings.slack_bot_token:
            return await self._simulate_chat_delivery(recipient, content, 'slack')
        
        # Slack API integration would go here
        logger.info(f"SIMULATED SLACK DELIVERY to {recipient}: {content}")
        return {'method': 'simulation'}

    async def _deliver_via_teams(self, recipient: str, content: str) -> Dict[str, Any]:
        """Deliver message via Microsoft Teams"""
        if not self.settings.teams_webhook_url:
            return await self._simulate_chat_delivery(recipient, content, 'teams')
        
        # Teams webhook integration would go here
        logger.info(f"SIMULATED TEAMS DELIVERY to {recipient}: {content}")
        return {'method': 'simulation'}

    async def _simulate_chat_delivery(self, recipient: str, content: str, platform: str) -> Dict[str, Any]:
        """Simulate chat delivery for testing"""
        logger.info(f"SIMULATED {platform.upper()} DELIVERY to {recipient}: {content}")
        
        redis = await get_redis_client()
        simulation_key = f"simulated_chat:{platform}:{recipient}:{datetime.utcnow().timestamp()}"
        await redis.setex(simulation_key, 3600, content)
        
        return {
            'method': 'simulation',
            'simulation_key': simulation_key
        }

    async def _add_email_tracking(self, content: str, tracking_id: str) -> str:
        """Add tracking pixels and links to email content"""
        tracking_pixel = f'<img src="http://localhost:3001/api/v1/track/open/{tracking_id}" width="1" height="1" style="display:none;">'
        
        # Add tracking to links
        import re
        link_pattern = r'<a\s+href="([^"]+)"([^>]*)>'
        
        def add_tracking_to_link(match):
            url = match.group(1)
            attrs = match.group(2)
            tracked_url = f"http://localhost:3001/api/v1/track/click/{tracking_id}?url={url}"
            return f'<a href="{tracked_url}"{attrs}>'
        
        tracked_content = re.sub(link_pattern, add_tracking_to_link, content)
        tracked_content += tracking_pixel
        
        return tracked_content

    async def _check_rate_limit(self, delivery_type: str, recipient: str):
        """Check and enforce rate limiting"""
        redis = await get_redis_client()
        
        # Rate limit key
        rate_key = f"rate_limit:{delivery_type}:{recipient}"
        current_count = await redis.get(rate_key)
        
        if current_count and int(current_count) >= self.settings.delivery_rate_limit:
            raise DeliveryError(f"Rate limit exceeded for {recipient}")
        
        # Increment counter
        await redis.incr(rate_key)
        await redis.expire(rate_key, 60)  # 1 minute window

    async def _log_delivery_attempt(self, data: Dict[str, Any], result: Dict[str, Any]):
        """Log delivery attempt to database"""
        try:
            session = await get_async_session()
            
            # Log to delivery_attempts table
            # This would be implemented with actual database schema
            logger.info(f"Delivery attempt logged: {data.get('type')} to {data.get('recipient')}")
            
            await session.close()
        except Exception as e:
            logger.error(f"Failed to log delivery attempt: {e}")
