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
    const warehouseId = searchParams.get('warehouse');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!fs.existsSync(CACHE_PATH)) {
      throw new Error(`Authoritative cache file missing: ${CACHE_PATH}`);
    }
    const rawData = fs.readFileSync(CACHE_PATH, 'utf-8');
    const fullData = JSON.parse(rawData);
    
    // Default to the inventory section
    let data = fullData.inventory;

    if (section) {
      switch (section) {
        case 'kpis':
          data = {
            kpis: data.kpis,
            summary: data.summary,
          };
          break;
        case 'warehouses': {
          const whs = warehouseId
            ? data.warehouses.filter((w: any) => w.id === warehouseId)
            : data.warehouses;
          data = {
            warehouses: whs,
            total: whs.length,
            nearCapacity: whs.filter((w: any) => w.status === 'near-capacity').length,
            underutilized: whs.filter((w: any) => w.status === 'underutilized').length,
            optimal: whs.filter((w: any) => w.status === 'optimal').length,
            totalCapacity: whs.reduce((acc: number, w: any) => acc + w.capacity, 0),
            totalUsed: whs.reduce((acc: number, w: any) => acc + w.used, 0),
          };
          break;
        }
        case 'movements': {
          const mvts = type
            ? data.movements.filter((m: any) => m.type === type)
            : data.movements;
          data = {
            movements: mvts.slice(0, limit),
            total: data.movements.length,
            inbound: data.movements.filter((m: any) => m.type === 'inbound').length,
            outbound: data.movements.filter((m: any) => m.type === 'outbound').length,
            transfers: data.movements.filter((m: any) => m.type === 'transfer').length,
          };
          break;
        }
        case 'aging':
          data = data.aging;
          break;
        case 'stockout':
          data = data.stockout;
          break;
        case 'overstock':
          data = data.overstock;
          break;
        case 'batches':
          data = data.batches;
          break;
        case 'alerts':
          data = {
            alerts: fullData.executive.alerts,
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
        error: { message, code: 'INVENTORY_FETCH_FAILED' },
        meta: buildMeta(req, start),
      },
      { status: 500 }
    );
  }
}
