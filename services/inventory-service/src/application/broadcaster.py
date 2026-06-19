import asyncio
import logging
from typing import Set, Dict, Any

logger = logging.getLogger(__name__)

class SSEBroadcaster:
    def __init__(self):
        self.clients: Set[asyncio.Queue] = set()

    async def subscribe(self):
        queue = asyncio.Queue()
        self.clients.add(queue)
        logger.info(f"SSE Client Connected. Total clients: {len(self.clients)}")
        try:
            while True:
                data = await queue.get()
                yield data
        except asyncio.CancelledError:
            pass
        finally:
            self.clients.remove(queue)
            logger.info(f"SSE Client Disconnected. Total clients: {len(self.clients)}")

    async def publish(self, event_type: str, payload: Dict[str, Any]):
        """Publish an event to all connected SSE clients."""
        if not self.clients:
            return
            
        import json
        # Format strictly according to SSE specification
        message = f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"
        
        for queue in list(self.clients):
            try:
                queue.put_nowait(message)
            except asyncio.QueueFull:
                logger.warning("Dropped message for slow SSE client")

# Global singleton for the inventory service
broadcaster = SSEBroadcaster()
