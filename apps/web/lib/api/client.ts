import axios from 'axios';
import { config as appConfig } from '../config';

export const apiClient = axios.create({
  baseURL: appConfig.api.inventoryUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const inventoryApi = {
  getStock: (sku?: string) => apiClient.get('/inventory/stock', { params: { sku } }),
  getMovements: () => apiClient.get('/inventory/movements'),
  reserveStock: (data: { sku: string; quantity: number; location: string }) => 
    apiClient.post('/inventory/reserve', data),
};

export const forecastingApi = {
  getForecast: (sku: string) => axios.get(`${appConfig.api.forecastingUrl}/forecasting/forecast/${sku}`),
  getAccuracy: () => axios.get(`${appConfig.api.forecastingUrl}/forecasting/accuracy`),
};

export const optimizationApi = {
  getUtilization: () => axios.get(`${appConfig.api.optimizationUrl}/optimization/utilization`),
  getRecommendations: () => axios.get(`${appConfig.api.optimizationUrl}/optimization/recommendations`),
};

export const orchestrationApi = {
  getWorkflows: () => axios.get(`${appConfig.api.orchestrationUrl}/orchestration/workflows`),
  getWorkflowStatus: (id: string) => axios.get(`${appConfig.api.orchestrationUrl}/orchestration/workflows/${id}`),
};

export const governanceApi = {
  getApprovals: () => axios.get(`${appConfig.api.governanceUrl}/governance/approvals`),
  approve: (id: string) => axios.post(`${appConfig.api.governanceUrl}/governance/approvals/${id}/approve`),
  reject: (id: string) => axios.post(`${appConfig.api.governanceUrl}/governance/approvals/${id}/reject`),
};

const aiApiClient = axios.create({
  baseURL: `${appConfig.api.aiUrl}/ai`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiIntelligenceApi = {
  getRecommendations: (warehouseId: string, focusSkus?: string[]) => 
    aiApiClient.post('/recommendations', { warehouse_id: warehouseId, focus_skus: focusSkus }),
  getMitigationPlans: (warehouseId: string, focusSkus?: string[]) => 
    aiApiClient.post('/mitigation-planning', { warehouse_id: warehouseId, focus_skus: focusSkus }),
  analyzeShortage: (sku: string, warehouseId: string) => 
    aiApiClient.post('/shortage-analysis', { sku, warehouse_id: warehouseId }),
  investigateIncident: (query: string, warehouseId?: string) => 
    aiApiClient.post('/investigate', { query, warehouse_id: warehouseId }),
  explainForecast: (sku: string, forecastData: any) => 
    aiApiClient.post('/explain-forecast', { sku, forecast_data: forecastData }),
  copilotChat: (query: string, warehouseId?: string) => 
    aiApiClient.post('/copilot/chat', { query, warehouse_id: warehouseId }),
  recordDecision: (decisionId: string, status: string, operatorId: string, metadata?: any) => 
    aiApiClient.post('/decisions', { decision_id: decisionId, status, operator_id: operatorId, metadata }),
  executeStressTest: (scenario: string) => 
    aiApiClient.post('/stress-test', { scenario }),
  simulateFuture: (days?: number) => 
    aiApiClient.get('/digital-twin/simulate-future', { params: { days } }),
  getSecurityIncidents: () => 
    aiApiClient.get('/security/incidents'),
};

