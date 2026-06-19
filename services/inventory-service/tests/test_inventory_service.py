import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

# Adjust sys.path or run via pytest from root if needed
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from application.services import InventoryApplicationService
from domain.models import WarehouseStock

@pytest.mark.asyncio
async def test_reserve_stock_insufficient():
    # Mocks
    mock_session = AsyncMock()
    mock_redis = MagicMock()
    mock_redis.acquire_lock.return_value = AsyncMock() # context manager mock
    mock_producer = AsyncMock()

    # Mock DB Stock state
    mock_stock = WarehouseStock(sku="SKU-1", warehouse_id="WH-1", quantity_on_hand=5, quantity_reserved=0)
    mock_result = MagicMock()
    mock_result.scalars().first.return_value = mock_stock
    mock_session.execute.return_value = mock_result

    service = InventoryApplicationService(mock_session, mock_redis, mock_producer)

    # Attempt to reserve 10 when only 5 exist
    with pytest.raises(Exception, match="Insufficient available stock"):
        await service.reserve_stock(sku="SKU-1", warehouse_id="WH-1", quantity=10, correlation_id="test-corr")

@pytest.mark.asyncio
async def test_reserve_stock_success():
    # Mocks
    mock_session = AsyncMock()
    
    # Advanced async context manager mock
    class AsyncContextManagerMock:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            pass
            
    mock_redis = MagicMock()
    mock_redis.acquire_lock.return_value = AsyncContextManagerMock()
    
    mock_producer = AsyncMock()

    # Mock DB Stock state
    mock_stock = WarehouseStock(sku="SKU-1", warehouse_id="WH-1", quantity_on_hand=20, quantity_reserved=0)
    mock_result = MagicMock()
    mock_result.scalars().first.return_value = mock_stock
    mock_session.execute.return_value = mock_result

    service = InventoryApplicationService(mock_session, mock_redis, mock_producer)

    # Attempt to reserve 5
    result = await service.reserve_stock(sku="SKU-1", warehouse_id="WH-1", quantity=5, correlation_id="test-corr")

    assert result["status"] == "RESERVED"
    assert mock_stock.quantity_reserved == 5
    mock_producer.publish.assert_called_once()
