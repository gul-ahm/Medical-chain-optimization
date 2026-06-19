import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from application.orchestrator import TwinOrchestrator
from infrastructure.solver import MILPSolver
from infrastructure.state_cache import StateCache

@pytest.mark.asyncio
async def test_milp_solver_recommendation():
    solver = MILPSolver()
    
    # Mock states
    inventory_state = {"WH-CENTRAL": 1000, "WH-EAST": 10}
    forecast = {"sku": "SKU-99", "warehouse_id": "WH-EAST", "predicted_demand": 80}
    
    recs = await solver.calculate_optimal_transfers(inventory_state, forecast)
    
    # Since predicted demand > 50, it should trigger our heuristic stub
    assert len(recs) == 1
    assert recs[0]["source_warehouse"] == "WH-CENTRAL"
    assert recs[0]["destination_warehouse"] == "WH-EAST"
    assert recs[0]["recommended_transfer_qty"] == 64  # 80 * 0.8

@pytest.mark.asyncio
async def test_twin_orchestrator_publishes_events():
    mock_producer = AsyncMock()
    mock_cache = AsyncMock()
    mock_cache.get_global_stock.return_value = {"WH-CENTRAL": 1000}
    
    solver = MILPSolver()
    orchestrator = TwinOrchestrator(solver, mock_cache, mock_producer)
    
    forecast_payload = {"sku": "SKU-99", "warehouse_id": "WH-EAST", "predicted_demand": 100}
    
    await orchestrator.run_optimization_cycle(forecast_payload)
    
    # Should publish TransferRecommended and OptimizationGenerated
    assert mock_producer.publish.call_count == 2
