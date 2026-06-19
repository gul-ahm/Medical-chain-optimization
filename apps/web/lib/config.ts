/**
 * Centralized Configuration & Service Discovery
 * Provides dynamic endpoint resolution for cloud and local environments.
 */

export const config = {
  api: {
    inventoryUrl: process.env.NEXT_PUBLIC_INVENTORY_API_URL || 'http://localhost:8001/api/v1',
    forecastingUrl: process.env.NEXT_PUBLIC_FORECASTING_API_URL || 'http://localhost:8002/api/v1',
    optimizationUrl: process.env.NEXT_PUBLIC_OPTIMIZATION_API_URL || 'http://localhost:8003/api/v1',
    orchestrationUrl: process.env.NEXT_PUBLIC_ORCHESTRATION_API_URL || 'http://localhost:8004/api/v1',
    governanceUrl: process.env.NEXT_PUBLIC_GOVERNANCE_API_URL || 'http://localhost:8005/api/v1',
    aiUrl: process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8008/api/v1',
  },
  websocket: {
    inventoryStream: process.env.NEXT_PUBLIC_INVENTORY_WS_URL || 'http://localhost:8001/api/v1/inventory/stream',
    aiStream: process.env.NEXT_PUBLIC_AI_WS_URL || 'http://localhost:8008/api/v1/operational/stream',
    baseWsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
  },
  features: {
    enableChaosSimulator: process.env.NEXT_PUBLIC_ENABLE_CHAOS === 'true',
  }
};
