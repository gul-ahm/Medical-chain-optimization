import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_PATH = 'D:/power bi/generated_medical_datasets/dashboard_precalculated.json';

function generateCorrelationId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function buildMeta(req: NextRequest, start: number) {
  return {
    correlationId: req.headers.get('x-correlation-id') || generateCorrelationId(),
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - start,
    version: '1.0.0',
    source: 'grounded-operational-datasets',
  };
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section');

    if (!fs.existsSync(CACHE_PATH)) {
      throw new Error(`Authoritative cache file missing: ${CACHE_PATH}`);
    }
    const rawData = fs.readFileSync(CACHE_PATH, 'utf-8');
    const fullData = JSON.parse(rawData);
    
    // Default to forecasting section
    let data = fullData.forecasting;

    if (section) {
      switch (section) {
        case 'kpis':
          data = {
            kpis: data.kpis,
            summary: {
              accuracy: parseFloat(data.kpis[0].value),
              confidence: parseFloat(data.kpis[1].value),
              demandVariance: parseFloat(data.kpis[2].value),
              driftRisk: data.kpis[3].value.toLowerCase(),
              retrainingStatus: 'idle',
              stability: 0.97,
              activeModel: 'LSTM_SupplyNet',
              modelVersion: 'v4.1',
            },
          };
          break;
        case 'demand':
          data = {
            series: data.demand.series,
            horizon: data.demand.horizon,
            confidenceBands: { lower: 'P10', median: 'P50', upper: 'P90' },
            metadata: {
              generatedAt: new Date().toISOString(),
              model: 'LSTM_SupplyNet',
              forecastHorizonDays: 30,
            },
          };
          break;
        case 'accuracy':
          data = data.accuracy;
          break;
        case 'drift':
          data = data.drift;
          break;
        case 'features':
          data = {
            features: data.features,
            staleCount: data.features.filter((f: any) => f.status === 'stale').length,
            freshCount: data.features.filter((f: any) => f.status === 'fresh').length,
            totalCount: data.features.length,
          };
          break;
        case 'retraining':
          data = {
            logs: data.retraining.logs,
            activeModels: [
              { id: 'model-001', name: 'LSTM_SupplyNet', type: 'Neural Network', status: 'active', mape: 3.8, version: 'v4.1', deployedAt: data.retraining.nextScheduled }
            ],
            total: data.retraining.logs.length,
            success: data.retraining.logs.filter((r: any) => r.status === 'success').length,
            degraded: 0,
            failed: 0,
            nextScheduled: data.retraining.nextScheduled,
          };
          break;
        case 'anomalies':
          data = {
            anomalies: data.anomalies,
            total: data.anomalies.length,
            highConfidence: data.anomalies.filter((a: any) => a.confidence >= 90).length,
          };
          break;
        default:
          break;
      }
    }

    return NextResponse.json(
      { success: true, data, meta: buildMeta(req, start) },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      {
        success: false,
        error: { message, code: 'FORECAST_FETCH_FAILED' },
        meta: buildMeta(req, start),
      },
      { status: 500 }
    );
  }
}
