import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ── Types ──
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  domain: string;
  timestamp: string;
}

export interface Activity {
  id: string;
  action: string;
  entity: string;
  agent: string;
  timestamp: string;
  type: string;
}

export interface DashboardKpis {
  executive: Record<string, any>;
  inventory: Record<string, any>;
  forecast: Record<string, any>;
  optimization: Record<string, any>;
  orchestration: Record<string, any>;
}

export interface DashboardState {
  // Connection
  connection: {
    status: ConnectionStatus;
    retryCount: number;
    lastHeartbeat: string | null;
  };

  // KPIs
  kpis: DashboardKpis;

  // Domain Activities & Alerts
  alerts: Alert[];
  activities: Record<string, Activity[]>;

  // UI States
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setRetryCount: (count: number) => void;
  updateHeartbeat: () => void;
  
  updateKpis: (domain: keyof DashboardKpis, updates: Partial<Record<string, any>>) => void;
  
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  
  addActivity: (domain: string, activity: Activity) => void;
  
  setLoading: (key: string, isLoading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  
  resetStore: () => void;
}

// ── Initial State ──
const initialState = {
  connection: {
    status: 'disconnected' as ConnectionStatus,
    retryCount: 0,
    lastHeartbeat: null,
  },
  kpis: {
    executive: {},
    inventory: {},
    forecast: {},
    optimization: {},
    orchestration: {},
  },
  alerts: [],
  activities: {
    executive: [],
    inventory: [],
    forecast: [],
    optimization: [],
    orchestration: [],
  },
  loading: {},
  errors: {},
};

// ── Store ──
export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      ...initialState,

      setConnectionStatus: (status) =>
        set((state) => ({
          connection: { ...state.connection, status },
        }), false, 'dashboard/setConnectionStatus'),

      setRetryCount: (retryCount) =>
        set((state) => ({
          connection: { ...state.connection, retryCount },
        }), false, 'dashboard/setRetryCount'),

      updateHeartbeat: () =>
        set((state) => ({
          connection: { ...state.connection, lastHeartbeat: new Date().toISOString() },
        }), false, 'dashboard/updateHeartbeat'),

      updateKpis: (domain, updates) =>
        set((state) => ({
          kpis: {
            ...state.kpis,
            [domain]: { ...state.kpis[domain], ...updates },
          },
        }), false, `dashboard/updateKpis/${domain}`),

      addAlert: (alert) =>
        set((state) => {
          // Event deduplication
          if (state.alerts.some((a) => a.id === alert.id)) return state;
          
          // Timestamp-safe sync: keep alerts sorted by time
          const newAlerts = [alert, ...state.alerts]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50); // Keep last 50 alerts
            
          return { alerts: newAlerts };
        }, false, 'dashboard/addAlert'),

      removeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        }), false, 'dashboard/removeAlert'),

      addActivity: (domain, activity) =>
        set((state) => {
          const domainActivities = state.activities[domain] || [];
          
          // Event deduplication
          if (domainActivities.some((a) => a.id === activity.id)) return state;

          const newActivities = [activity, ...domainActivities]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 30); // Keep last 30 activities per domain

          return {
            activities: {
              ...state.activities,
              [domain]: newActivities,
            },
          };
        }, false, `dashboard/addActivity/${domain}`),

      setLoading: (key, isLoading) =>
        set((state) => ({
          loading: { ...state.loading, [key]: isLoading },
        }), false, 'dashboard/setLoading'),

      setError: (key, error) =>
        set((state) => ({
          errors: { ...state.errors, [key]: error },
        }), false, 'dashboard/setError'),

      resetStore: () => set(initialState, false, 'dashboard/reset'),
    }),
    { name: 'DashboardStore' }
  )
);
