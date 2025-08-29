"""
NATS message bus integration
"""

import asyncio
import json
import logging
from typing import Dict, Any, Callable, Optional
import nats
from nats.aio.client import Client as NATSClient

from .config import get_settings

logger = logging.getLogger(__name__)

# Global NATS client
nats_client: Optional[NATSClient] = None

# Topic definitions
TOPICS = {
    'campaign_schedule': 'campaign.schedule',
    'content_make': 'content.make',
    'deliver_send': 'deliver.send',
    'event_ingest': 'event.ingest',
    'coach_send': 'coach.send',
    'risk_update': 'risk.update',
    'export_make': 'export.make'
}

async def init_message_bus():
    """Initialize NATS message bus"""
    global nats_client
    
    settings = get_settings()
    
    try:
        nats_client = await nats.connect(settings.nats_url)
        logger.info("NATS connection initialized")
    except Exception as e:
        logger.error(f"Failed to initialize NATS connection: {e}")
        raise

async def publish_message(topic: str, data: Dict[str, Any], reply_to: Optional[str] = None):
    """Publish message to NATS topic"""
    if not nats_client:
        raise RuntimeError("NATS client not initialized")
    
    try:
        message = json.dumps(data).encode()
        await nats_client.publish(topic, message, reply=reply_to)
        logger.debug(f"Published message to {topic}: {data}")
    except Exception as e:
        logger.error(f"Failed to publish message to {topic}: {e}")
        raise

async def subscribe_to_topic(topic: str, handler: Callable, queue_group: Optional[str] = None):
    """Subscribe to NATS topic with handler"""
    if not nats_client:
        raise RuntimeError("NATS client not initialized")
    
    async def message_handler(msg):
        try:
            data = json.loads(msg.data.decode())
            await handler(data, msg)
        except Exception as e:
            logger.error(f"Error handling message from {topic}: {e}")
    
    try:
        if queue_group:
            await nats_client.subscribe(topic, queue=queue_group, cb=message_handler)
        else:
            await nats_client.subscribe(topic, cb=message_handler)
        logger.info(f"Subscribed to topic {topic}")
    except Exception as e:
        logger.error(f"Failed to subscribe to {topic}: {e}")
        raise

async def request_response(topic: str, data: Dict[str, Any], timeout: float = 5.0) -> Dict[str, Any]:
    """Send request and wait for response"""
    if not nats_client:
        raise RuntimeError("NATS client not initialized")
    
    try:
        message = json.dumps(data).encode()
        response = await nats_client.request(topic, message, timeout=timeout)
        return json.loads(response.data.decode())
    except Exception as e:
        logger.error(f"Failed to get response from {topic}: {e}")
        raise

async def close_message_bus():
    """Close NATS connection"""
    global nats_client
    
    if nats_client:
        await nats_client.close()
        logger.info("NATS connection closed")
