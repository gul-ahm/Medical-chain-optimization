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
    
    // Default to executive section
    let data = fullData.executive;

    if (section) {
      switch (section) {
        case 'kpis':
          data = {
            kpis: data.kpis,
            summary: {
              totalRevenue: 12400000,
              inventoryValue: fullData.inventory.aging.totalValue,
              forecastAccuracy: parseFloat(fullData.forecasting.kpis[0].value),
              stockoutRisk: fullData.inventory.stockout.total,
              warehouseUtilization: parseFloat(fullData.optimization.kpis[1].value),
              aiConfidence: parseFloat(fullData.forecasting.kpis[1].value),
            },
          };
          break;
        case 'alerts':
          data = {
            alerts: data.alerts,
          };
          break;
        case 'activity':
          data = {
            activity: data.activity,
          };
          break;
        case 'system_health':
          data = {
            services: data.system_health,
          };
          break;
        case 'recommendations':
          data = {
            recommendations: data.recommendations,
          };
          break;
        case 'survivability':
          data = {
            regions: data.survivability,
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
        error: { message, code: 'EXECUTIVE_FETCH_FAILED' },
        meta: buildMeta(req, start),
      },
      { status: 500 }
    );
  }
}
