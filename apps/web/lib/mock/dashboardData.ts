// ── Shared Types ──
export interface KpiMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  source: string;
  time: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  agent: string;
  time: string;
  type: 'auto' | 'approval' | 'success' | 'escalation' | 'alert';
}

export interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: string;
  uptime: string;
}

export interface AiRecommendation {
  id: string;
  title: string;
  confidence: number;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  agent: string;
}

// ── Executive Dashboard ──
export interface ExecutiveKpiRow extends KpiMetric {
  icon: string;
}

export const EXECUTIVE_KPIS: ExecutiveKpiRow[] = [
  { label: 'Total Revenue', value: '$12.4M', change: '+8.2%', trend: 'up', icon: 'DollarSign' },
  { label: 'Inventory Value', value: '$48.2M', change: '+3.1%', trend: 'up', icon: 'Package' },
  { label: 'Forecast Accuracy', value: '95.8%', change: '+1.2%', trend: 'up', icon: 'Target' },
  { label: 'Stockout Risk', value: '2.4%', change: '-0.6%', trend: 'down', icon: 'AlertTriangle' },
  { label: 'Warehouse Utilization', value: '87.3%', change: '+2.8%', trend: 'up', icon: 'Warehouse' },
  { label: 'AI Confidence', value: '92.1%', change: '+0.4%', trend: 'up', icon: 'BrainCircuit' },
];

export const EXECUTIVE_ALERTS: AlertItem[] = [
  { id: '1', severity: 'critical', message: 'SKU-7823 projected stockout in 48h at WH-04', source: 'Inventory Agent', time: '3 min ago' },
  { id: '2', severity: 'warning', message: 'Forecast drift exceeds 8% threshold for Region NW', source: 'Forecasting Agent', time: '12 min ago' },
  { id: '3', severity: 'warning', message: 'WH-09 approaching 95% capacity', source: 'Optimization Agent', time: '18 min ago' },
  { id: '4', severity: 'info', message: 'Model v3.2 retrain completed successfully', source: 'ML Pipeline', time: '42 min ago' },
];

export const EXECUTIVE_ACTIVITY: ActivityItem[] = [
  { id: '1', action: 'Auto-reorder executed', entity: 'SKU-4412 · 500 units · WH-01', agent: 'Inventory Agent', time: '2 min ago', type: 'auto' },
  { id: '2', action: 'Transfer approved', entity: 'WH-04 → WH-12 · 800 units', agent: 'Optimization Agent', time: '8 min ago', type: 'approval' },
  { id: '3', action: 'SAGA workflow completed', entity: 'WF-9912 · 4 steps · 12.3s', agent: 'Orchestrator', time: '15 min ago', type: 'success' },
  { id: '4', action: 'Governance escalation raised', entity: 'Policy #44 · Threshold exceeded', agent: 'Governance Agent', time: '22 min ago', type: 'escalation' },
  { id: '5', action: 'Demand forecast updated', entity: 'Region SE · 7-day horizon', agent: 'Forecasting Agent', time: '31 min ago', type: 'auto' },
];

export const EXECUTIVE_SYSTEM_HEALTH: SystemService[] = [
  { name: 'Kafka Event Bus', status: 'operational', latency: '12ms', uptime: '99.98%' },
  { name: 'ML Inference Engine', status: 'operational', latency: '45ms', uptime: '99.94%' },
  { name: 'OR-Tools Solver', status: 'operational', latency: '230ms', uptime: '99.91%' },
  { name: 'Redis Cache', status: 'operational', latency: '2ms', uptime: '99.99%' },
  { name: 'PostgreSQL', status: 'degraded', latency: '180ms', uptime: '99.82%' },
  { name: 'Agent Director', status: 'operational', latency: '8ms', uptime: '99.97%' },
];

export const EXECUTIVE_AI_RECOMMENDATIONS: AiRecommendation[] = [
  { id: '1', title: 'Redistribute 1,200 units from WH-09 to WH-07', confidence: 94, impact: '$28K savings', priority: 'high', agent: 'Optimization' },
  { id: '2', title: 'Increase safety stock for Electronics category', confidence: 91, impact: 'Risk -34%', priority: 'high', agent: 'Inventory' },
  { id: '3', title: 'Switch to ensemble model for Region NW', confidence: 87, impact: 'MAPE -1.8%', priority: 'medium', agent: 'Forecasting' },
];

// ── Inventory Dashboard ──
export interface WarehouseInventory {
  id: string;
  name: string;
  capacity: number;
  used: number;
  skus: number;
  status: 'optimal' | 'near-capacity' | 'underutilized';
}

export interface StockMovement {
  id: string;
  type: 'inbound' | 'outbound' | 'transfer';
  sku: string;
  qty: number;
  warehouse: string;
  time: string;
  value: number;
}

export interface BatchLot {
  lot: string;
  sku: string;
  qty: number;
  received: string;
  expiry: string;
  status: 'active' | 'expiring' | 'expired';
}

export const INVENTORY_KPIS: KpiMetric[] = [
  { label: 'Total Inventory', value: '142,830', change: '+2.4%', trend: 'up' },
  { label: 'Available Stock', value: '118,420', change: '+1.8%', trend: 'up' },
  { label: 'Reserved Stock', value: '24,410', change: '+5.2%', trend: 'up' },
  { label: 'Stockout Risk', value: '3.1%', change: '-0.4%', trend: 'down' },
  { label: 'Overstock Risk', value: '7.8%', change: '+1.2%', trend: 'up' },
  { label: 'Inventory Turnover', value: '8.4x', change: '+0.3x', trend: 'up' },
];

export const WAREHOUSES: WarehouseInventory[] = [
  { id: 'WH-01', name: 'Northeast Hub', capacity: 50000, used: 46000, skus: 4280, status: 'near-capacity' },
  { id: 'WH-04', name: 'Southeast Center', capacity: 40000, used: 35200, skus: 3150, status: 'optimal' },
  { id: 'WH-07', name: 'Midwest Depot', capacity: 45000, used: 34200, skus: 2890, status: 'underutilized' },
  { id: 'WH-09', name: 'West Coast Port', capacity: 55000, used: 52250, skus: 5120, status: 'near-capacity' },
  { id: 'WH-12', name: 'Central Logistics', capacity: 42000, used: 34860, skus: 3640, status: 'optimal' },
  { id: 'WH-15', name: 'Gulf Distribution', capacity: 38000, used: 26980, skus: 2340, status: 'underutilized' },
];

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: '1', type: 'inbound', sku: 'SKU-4412', qty: 500, warehouse: 'WH-01', time: '4 min ago', value: 24500 },
  { id: '2', type: 'outbound', sku: 'SKU-7823', qty: 120, warehouse: 'WH-04', time: '8 min ago', value: 9600 },
  { id: '3', type: 'transfer', sku: 'SKU-1190', qty: 300, warehouse: 'WH-07→WH-12', time: '14 min ago', value: 15000 },
  { id: '4', type: 'inbound', sku: 'SKU-3301', qty: 800, warehouse: 'WH-09', time: '21 min ago', value: 40000 },
  { id: '5', type: 'outbound', sku: 'SKU-5567', qty: 45, warehouse: 'WH-01', time: '29 min ago', value: 2250 },
];

export const BATCH_LOTS: BatchLot[] = [
  { lot: 'LOT-2024-0418', sku: 'SKU-4412', qty: 2400, received: '2024-04-18', expiry: '2025-04-18', status: 'active' },
  { lot: 'LOT-2024-0312', sku: 'SKU-8890', qty: 800, received: '2024-03-12', expiry: '2024-06-12', status: 'expiring' },
  { lot: 'LOT-2024-0501', sku: 'SKU-3301', qty: 1600, received: '2024-05-01', expiry: '2026-05-01', status: 'active' },
  { lot: 'LOT-2024-0220', sku: 'SKU-1190', qty: 350, received: '2024-02-20', expiry: '2024-08-20', status: 'active' },
  { lot: 'LOT-2024-0115', sku: 'SKU-6672', qty: 120, received: '2024-01-15', expiry: '2024-04-15', status: 'expired' },
];

// ── Forecasting Dashboard ──
export interface ForecastAccuracyRow {
  category: string;
  current: number;
  previous: number;
  delta: number;
}

export interface RetrainLog {
  id: string;
  model: string;
  version: string;
  trigger: string;
  duration: string;
  mape_before: string;
  mape_after: string;
  status: 'success' | 'degraded' | 'failed';
  timestamp: string;
}

export interface FeatureStatus {
  name: string;
  freshness: string;
  status: 'fresh' | 'stale';
  lag: string;
}

export interface ForecastAnomaly {
  id: string;
  region: string;
  category: string;
  deviation: string;
  confidence: number;
  cause: string;
}

export const FORECAST_KPIS: KpiMetric[] = [
  { label: 'Forecast Accuracy', value: '95.8%', change: '+1.2%', trend: 'up' },
  { label: 'Prediction Confidence', value: '92.1%', change: '+0.4%', trend: 'up' },
  { label: 'Demand Variance', value: '4.2%', change: '-0.8%', trend: 'down' },
  { label: 'Drift Risk', value: 'Low', change: '-2.1%', trend: 'down' },
  { label: 'Retraining Status', value: 'Idle', change: 'v3.2', trend: 'neutral' },
  { label: 'Forecast Stability', value: '0.97', change: '+0.02', trend: 'up' },
];

export const FORECAST_ACCURACY_BY_CATEGORY: ForecastAccuracyRow[] = [
  { category: 'Electronics', current: 96.2, previous: 94.1, delta: 2.1 },
  { category: 'Apparel', current: 94.8, previous: 93.2, delta: 1.6 },
  { category: 'FMCG', current: 95.1, previous: 94.6, delta: 0.5 },
  { category: 'Industrial', current: 93.4, previous: 91.8, delta: 1.6 },
  { category: 'Pharma', current: 97.1, previous: 95.9, delta: 1.2 },
];

export const RETRAIN_LOGS: RetrainLog[] = [
  { id: '1', model: 'DemandNet-v3.2', version: 'v3.2', trigger: 'Scheduled', duration: '4m 12s', mape_before: '5.0%', mape_after: '4.2%', status: 'success', timestamp: '2024-05-09T08:00:00Z' },
  { id: '2', model: 'DemandNet-v3.1', version: 'v3.1', trigger: 'Drift Alert', duration: '3m 48s', mape_before: '5.8%', mape_after: '5.0%', status: 'success', timestamp: '2024-05-08T14:30:00Z' },
  { id: '3', model: 'SeasonalLSTM', version: 'v2.4', trigger: 'Manual', duration: '6m 22s', mape_before: '6.1%', mape_after: '5.4%', status: 'success', timestamp: '2024-05-07T10:15:00Z' },
  { id: '4', model: 'EnsembleXGB', version: 'v1.8', trigger: 'Scheduled', duration: '2m 05s', mape_before: '4.9%', mape_after: '5.2%', status: 'degraded', timestamp: '2024-05-06T06:00:00Z' },
];

export const FEATURE_STATUSES: FeatureStatus[] = [
  { name: 'Sales Transactions', freshness: '2 min ago', status: 'fresh', lag: '< 5 min' },
  { name: 'Weather Data', freshness: '15 min ago', status: 'fresh', lag: '< 30 min' },
  { name: 'Promotion Calendar', freshness: '2 hours ago', status: 'stale', lag: '> 1 hour' },
  { name: 'Competitor Pricing', freshness: '45 min ago', status: 'fresh', lag: '< 1 hour' },
  { name: 'Macro Indicators', freshness: '1 day ago', status: 'stale', lag: '> 6 hours' },
];

export const FORECAST_ANOMALIES: ForecastAnomaly[] = [
  { id: '1', region: 'Northwest', category: 'Electronics', deviation: '+34%', confidence: 91, cause: 'Promotional spike detected' },
  { id: '2', region: 'Southeast', category: 'Apparel', deviation: '-18%', confidence: 87, cause: 'Seasonal pattern shift' },
  { id: '3', region: 'Midwest', category: 'FMCG', deviation: '+22%', confidence: 78, cause: 'Supply disruption signal' },
];

// ── Optimization Dashboard ──
export interface TransferRecommendation {
  id: string;
  from: string;
  to: string;
  sku: string;
  qty: number;
  savings: string;
  savingsRaw: number;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'executing';
}

export interface OperationalConstraint {
  name: string;
  value: string;
  status: 'ok' | 'warning' | 'breach';
}

export const OPTIMIZATION_KPIS: KpiMetric[] = [
  { label: 'Optimization Efficiency', value: '94.2%', change: '+2.1%', trend: 'up' },
  { label: 'Warehouse Utilization', value: '87.3%', change: '+1.8%', trend: 'up' },
  { label: 'Transfer Success', value: '97.6%', change: '+0.4%', trend: 'up' },
  { label: 'Stockout Prevention', value: '96.1%', change: '+1.3%', trend: 'up' },
  { label: 'Overstock Reduction', value: '18.4%', change: '-3.2%', trend: 'down' },
  { label: 'AI Confidence', value: '91.8%', change: '+0.6%', trend: 'up' },
];

export const TRANSFER_RECOMMENDATIONS: TransferRecommendation[] = [
  { id: 'TR-001', from: 'WH-09', to: 'WH-07', sku: 'SKU-4412', qty: 1200, savings: '$28,400', savingsRaw: 28400, confidence: 94, status: 'pending' },
  { id: 'TR-002', from: 'WH-01', to: 'WH-12', sku: 'SKU-7823', qty: 800, savings: '$12,100', savingsRaw: 12100, confidence: 91, status: 'approved' },
  { id: 'TR-003', from: 'WH-09', to: 'WH-15', sku: 'SKU-3301', qty: 600, savings: '$8,900', savingsRaw: 8900, confidence: 87, status: 'pending' },
  { id: 'TR-004', from: 'WH-04', to: 'WH-07', sku: 'SKU-1190', qty: 450, savings: '$6,200', savingsRaw: 6200, confidence: 84, status: 'rejected' },
  { id: 'TR-005', from: 'WH-01', to: 'WH-07', sku: 'SKU-5567', qty: 300, savings: '$4,800', savingsRaw: 4800, confidence: 82, status: 'approved' },
];

export const OPERATIONAL_CONSTRAINTS: OperationalConstraint[] = [
  { name: 'Max Transfer Volume', value: '5,000 units/day', status: 'ok' },
  { name: 'Min Safety Days', value: '7 days', status: 'ok' },
  { name: 'Budget Cap', value: '$150K/month', status: 'warning' },
  { name: 'Carrier Capacity', value: '92% utilized', status: 'warning' },
  { name: 'Lead Time SLA', value: '48h max', status: 'ok' },
];

export const OPTIMIZATION_AI_RECOMMENDATIONS: AiRecommendation[] = [
  { id: '1', title: 'Consolidate WH-09 overflow to WH-07 and WH-15', confidence: 94, impact: '$37K savings', priority: 'high', agent: 'Optimization' },
  { id: '2', title: 'Reduce safety stock for slow-movers in Industrial', confidence: 89, impact: 'Capital -$42K', priority: 'medium', agent: 'Inventory' },
  { id: '3', title: 'Increase reorder frequency for FMCG at WH-01', confidence: 86, impact: 'Stockout risk -22%', priority: 'medium', agent: 'Forecasting' },
];

// ── Orchestration Dashboard ──
export interface WorkflowLog {
  id: string;
  workflow: string;
  saga: string;
  steps: number;
  duration: string;
  status: 'completed' | 'running' | 'escalated' | 'failed';
  agent: string;
  timestamp: string;
}

export interface AgentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  tasks: number;
  latency: string;
  lastHeartbeat: string;
}

export interface GovernanceEscalation {
  id: string;
  policy: string;
  trigger: string;
  agent: string;
  time: string;
  resolution: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const ORCHESTRATION_KPIS: KpiMetric[] = [
  { label: 'Active Agents', value: '12', change: '+2', trend: 'up' },
  { label: 'Workflow Success', value: '98.4%', change: '+0.3%', trend: 'up' },
  { label: 'Retry Count', value: '7', change: '-3', trend: 'down' },
  { label: 'SLA Compliance', value: '99.1%', change: '+0.1%', trend: 'up' },
  { label: 'Autonomous Rate', value: '87.3%', change: '+2.4%', trend: 'up' },
  { label: 'Escalations', value: '3', change: '-1', trend: 'down' },
];

export const WORKFLOW_LOGS: WorkflowLog[] = [
  { id: 'WF-9912', workflow: 'Rebalance WH-09', saga: 'SAGA-441', steps: 4, duration: '12.3s', status: 'completed', agent: 'Optimization', timestamp: '2024-05-09T14:52:00Z' },
  { id: 'WF-9908', workflow: 'Auto-Reorder SKU-4412', saga: 'SAGA-439', steps: 3, duration: '8.1s', status: 'completed', agent: 'Inventory', timestamp: '2024-05-09T14:44:00Z' },
  { id: 'WF-9905', workflow: 'Forecast Retrain', saga: 'SAGA-437', steps: 5, duration: '4m 12s', status: 'completed', agent: 'Forecasting', timestamp: '2024-05-09T14:10:00Z' },
  { id: 'WF-9901', workflow: 'Transfer WH-04→WH-12', saga: 'SAGA-435', steps: 6, duration: '34.7s', status: 'running', agent: 'Optimization', timestamp: '2024-05-09T14:18:00Z' },
  { id: 'WF-9898', workflow: 'Governance Escalation', saga: 'SAGA-432', steps: 3, duration: '2.1s', status: 'escalated', agent: 'Governance', timestamp: '2024-05-09T13:30:00Z' },
  { id: 'WF-9894', workflow: 'DLQ Retry Batch', saga: 'SAGA-428', steps: 2, duration: '1.4s', status: 'failed', agent: 'Orchestrator', timestamp: '2024-05-09T12:55:00Z' },
];

export const AGENT_HEALTH: AgentHealth[] = [
  { name: 'Inventory Agent', status: 'healthy', uptime: '99.98%', tasks: 142, latency: '8ms', lastHeartbeat: '12s ago' },
  { name: 'Forecasting Agent', status: 'healthy', uptime: '99.94%', tasks: 89, latency: '45ms', lastHeartbeat: '15s ago' },
  { name: 'Optimization Agent', status: 'healthy', uptime: '99.91%', tasks: 67, latency: '230ms', lastHeartbeat: '8s ago' },
  { name: 'Governance Agent', status: 'healthy', uptime: '99.99%', tasks: 23, latency: '3ms', lastHeartbeat: '5s ago' },
  { name: 'Orchestrator', status: 'degraded', uptime: '99.82%', tasks: 312, latency: '12ms', lastHeartbeat: '22s ago' },
  { name: 'Analytics Agent', status: 'healthy', uptime: '99.96%', tasks: 56, latency: '18ms', lastHeartbeat: '9s ago' },
];

export const GOVERNANCE_ESCALATIONS: GovernanceEscalation[] = [
  { id: '1', policy: 'Transfer > $50K', trigger: 'WF-9901', agent: 'Optimization', time: '8 min ago', resolution: 'Pending approval', status: 'pending' },
  { id: '2', policy: 'Confidence < 85%', trigger: 'WF-9894', agent: 'Orchestrator', time: '22 min ago', resolution: 'Auto-rejected', status: 'rejected' },
  { id: '3', policy: 'Cross-region transfer', trigger: 'WF-9888', agent: 'Governance', time: '1h ago', resolution: 'Approved by admin', status: 'approved' },
];

// ── Chart Series Helpers ──
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
export const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const;
export const WEEKS = ['W1','W2','W3','W4','W5','W6','W7','W8'] as const;

export const REVENUE_SERIES = [8.2,9.1,8.7,10.3,11.2,10.8,12.4,11.9,13.1,12.6,14.2,13.8];
export const FORECAST_SERIES = [8.0,8.8,9.0,10.0,10.9,11.0,12.0,12.2,12.8,13.0,13.9,14.1];

export const DEMAND_ACTUAL = [42,45,41,48,52,50,55,53,58,56,61,null];
export const DEMAND_P50 = [41,44,42,47,51,49,54,52,57,55,60,63];
export const DEMAND_P90 = [46,49,47,53,57,55,60,58,63,61,67,70];
export const DEMAND_P10 = [36,39,37,41,45,43,48,46,51,49,53,56];

export const DRIFT_SERIES = [2.1,2.4,3.0,2.8,4.1,5.3,6.8,8.2];
export const DRIFT_THRESHOLD = 8;
