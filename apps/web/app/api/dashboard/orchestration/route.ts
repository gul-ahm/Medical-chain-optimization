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
    
    // Default to orchestration section
    let data = fullData.orchestration;

    if (section) {
      switch (section) {
        case 'kpis':
          data = {
            kpis: data.kpis,
            summary: {
              activeAgents: data.agents.length,
              workflowSuccess: parseFloat(data.kpis[1].value),
              retryCount: 0,
              slaCompliance: parseFloat(data.kpis[2].value),
              autonomousRate: 87.3,
              escalations: 0,
            },
          };
          break;
        case 'workflows':
          data = {
            workflows: data.workflows,
            total: data.workflows.length,
            running: data.workflows.filter((w: any) => w.status === 'running').length,
            completed: data.workflows.filter((w: any) => w.status === 'completed').length,
            failed: data.workflows.filter((w: any) => w.status === 'failed').length,
          };
          break;
        case 'agents':
          data = {
            agents: data.agents,
            healthy: data.agents.filter((a: any) => a.status === 'healthy').length,
            degraded: data.agents.filter((a: any) => a.status === 'degraded').length,
            down: data.agents.filter((a: any) => a.status === 'down').length,
          };
          break;
        case 'dag':
          data = data.dag;
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
        error: { message, code: 'ORCHESTRATION_FETCH_FAILED' },
        meta: buildMeta(req, start),
      },
      { status: 500 }
    );
  }
}
