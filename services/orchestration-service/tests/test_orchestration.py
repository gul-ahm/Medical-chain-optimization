import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from application.sagas.transfer_saga import TransferSaga
from sc_events.envelope import EventEnvelope

@pytest.mark.asyncio
async def test_transfer_saga_start_emits_reserve_command():
    mock_producer = AsyncMock()
    mock_cache = AsyncMock()
    
    # Mock context manager for the lock
    class AsyncContextManagerMock:
        async def __aenter__(self): return self
        async def __aexit__(self, exc_type, exc, tb): pass
    mock_cache.acquire_workflow_lock.return_value = AsyncContextManagerMock()
    
    saga = TransferSaga(mock_cache, mock_producer)
    
    payload = {"sku": "SKU-99", "source_warehouse": "WH-A", "recommended_transfer_qty": 50}
    await saga.start_transfer("corr-123", payload)
    
    # Verify State Saved
    mock_cache.save_state.assert_called_once()
    saved_state = mock_cache.save_state.call_args[0][1]
    assert saved_state["status"] == "RUNNING"
    
    # Verify Reserve Command emitted
    mock_producer.publish.assert_called_once()
    topic, envelope = mock_producer.publish.call_args[0]
    assert topic == "cmd.inventory.reserve"
    assert envelope.payload["quantity"] == 50

@pytest.mark.asyncio
async def test_transfer_saga_compensation_rollback():
    mock_producer = AsyncMock()
    mock_cache = AsyncMock()
    
    class AsyncContextManagerMock:
        async def __aenter__(self): return self
        async def __aexit__(self, exc_type, exc, tb): pass
    mock_cache.acquire_workflow_lock.return_value = AsyncContextManagerMock()
    
    # Provide the initial state to the cache mock
    mock_cache.get_state.return_value = {
        "status": "RUNNING",
        "payload": {"sku": "SKU-99", "source_warehouse": "WH-A", "recommended_transfer_qty": 50}
    }
    
    saga = TransferSaga(mock_cache, mock_producer)
    
    # Trigger DLQ failure
    await saga.handle_inventory_failure("corr-123", reason="Insufficient target capacity")
    
    # Verify compensating transactions: state saved twice (COMPENSATING, COMPENSATED)
    assert mock_cache.save_state.call_count == 2
    
    # Verify Release command (Rollback) and Compensated event emitted
    assert mock_producer.publish.call_count == 2
    
    topic1, env1 = mock_producer.publish.call_args_list[0][0]
    topic2, env2 = mock_producer.publish.call_args_list[1][0]
    
    assert topic1 == "cmd.inventory.release"
    assert env1.payload["reason"] == "SAGA_ROLLBACK"
    
    assert topic2 == "evt.saga.compensated"
