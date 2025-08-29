"""
AI Social Engineering Defense Trainer - Workers
Main entry point for Python worker processes
"""

import asyncio
import logging
import os
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from workers.content_worker import ContentWorker
from workers.deliver_worker import DeliverWorker
from workers.telemetry_worker import TelemetryWorker
from workers.coach_worker import CoachWorker
from workers.risk_worker import RiskWorker
from workers.export_worker import ExportWorker
from shared.database import init_database
from shared.message_bus import init_message_bus
from shared.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global worker instances
workers: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    settings = get_settings()
    
    # Initialize database connections
    await init_database()
    
    # Initialize message bus
    await init_message_bus()
    
    # Initialize workers
    workers['content'] = ContentWorker()
    workers['deliver'] = DeliverWorker()
    workers['telemetry'] = TelemetryWorker()
    workers['coach'] = CoachWorker()
    workers['risk'] = RiskWorker()
    workers['export'] = ExportWorker()
    
    # Start workers
    for name, worker in workers.items():
        logger.info(f"Starting {name} worker...")
        await worker.start()
    
    yield
    
    # Cleanup
    for name, worker in workers.items():
        logger.info(f"Stopping {name} worker...")
        await worker.stop()

# Create FastAPI app
app = FastAPI(
    title="AI Defense Trainer - Workers",
    description="Python worker processes for content generation, delivery, telemetry, and coaching",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "workers": {name: "running" for name in workers.keys()},
        "timestamp": asyncio.get_event_loop().time()
    }

@app.get("/workers/status")
async def workers_status():
    """Get status of all workers"""
    status = {}
    for name, worker in workers.items():
        status[name] = {
            "status": "running" if worker.is_running else "stopped",
            "processed_count": getattr(worker, 'processed_count', 0),
            "error_count": getattr(worker, 'error_count', 0)
        }
    return status

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("WORKERS_PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("NODE_ENV") == "development" else False
    )
