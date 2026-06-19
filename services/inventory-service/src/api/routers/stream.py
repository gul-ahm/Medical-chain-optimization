import asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from application.broadcaster import broadcaster

router = APIRouter(prefix="/api/v1/inventory", tags=["stream"])

async def sse_generator():
    """Generator that yields heartbeat and broadcasted events."""
    # Send initial connection success heartbeat
    yield "event: heartbeat\ndata: {\"status\": \"connected\"}\n\n"
    
    queue = asyncio.Queue()
    
    # Define a task that reads from the broadcaster and pushes into our queue
    async def listen_broadcaster():
        try:
            async for message in broadcaster.subscribe():
                await queue.put(("message", message))
        except Exception:
            pass
            
    # Define a task that pushes heartbeats periodically to keep connection alive
    async def send_heartbeats():
        try:
            while True:
                await asyncio.sleep(15)  # Send heartbeat every 15 seconds
                await queue.put(("heartbeat", "event: heartbeat\ndata: {\"status\": \"alive\"}\n\n"))
        except Exception:
            pass
            
    # Start both tasks
    listener_task = asyncio.create_task(listen_broadcaster())
    heartbeat_task = asyncio.create_task(send_heartbeats())
    
    try:
        while True:
            # Get the next message/heartbeat from the queue
            msg_type, content = await queue.get()
            yield content
    except asyncio.CancelledError:
        pass
    finally:
        # Clean up tasks
        listener_task.cancel()
        heartbeat_task.cancel()
        await asyncio.gather(listener_task, heartbeat_task, return_exceptions=True)

@router.get("/stream")
async def stream_events():
    """Realtime Server-Sent Events stream for inventory updates."""
    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no" # Disable Nginx buffering if present
        }
    )

