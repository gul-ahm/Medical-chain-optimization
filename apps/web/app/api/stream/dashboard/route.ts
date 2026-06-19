import { NextRequest } from 'next/server';

/**
 * Enterprise SSE Proxy
 * Redirects the frontend to the real backend event stream.
 * Resolves internal network addresses for the browser.
 */
export async function GET(req: NextRequest) {
  // In a real production environment, this would aggregate from multiple services
  // For now, we proxy to the main Inventory Service event stream
  const backendUrl = process.env.INTERNAL_API_URL || 'http://localhost:8001';
  const streamUrl = `${backendUrl}/api/v1/inventory/stream`;

  try {
    const response = await fetch(streamUrl, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      // Important: don't buffer the response
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend stream returned ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[SSE Proxy Error]:', error);
    return new Response(JSON.stringify({ error: 'Failed to connect to event stream' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
