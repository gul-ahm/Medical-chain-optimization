import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from infrastructure.jwt_service import RBACGuard, JWTService
from application.approval_engine import ApprovalEngine

def test_rbac_guard_hierarchy():
    # True assertions
    assert RBACGuard.has_permission("super_admin", "operations_admin") == True
    assert RBACGuard.has_permission("operations_admin", "operations_admin") == True
    assert RBACGuard.has_permission("warehouse_manager", "viewer") == True
    
    # False assertions
    assert RBACGuard.has_permission("viewer", "operations_admin") == False
    assert RBACGuard.has_permission("analyst", "planner") == False

@pytest.mark.asyncio
async def test_approval_engine_thresholds():
    mock_producer = AsyncMock()
    engine = ApprovalEngine(mock_producer)
    
    # Payload UNDER threshold (50) -> Should auto-approve
    await engine.evaluate_transfer({"payload": {"sku": "A", "recommended_transfer_qty": 50}})
    
    # Payload OVER threshold (500) -> Should queue for approval
    await engine.evaluate_transfer({"payload": {"sku": "B", "recommended_transfer_qty": 500}})
    
    assert mock_producer.publish.call_count == 2
    
    # First call should be TransferApprovedForExecution
    topic1, env1 = mock_producer.publish.call_args_list[0][0]
    assert env1.metadata.event_type == "TransferApprovedForExecution"
    
    # Second call should be ApprovalRequested
    topic2, env2 = mock_producer.publish.call_args_list[1][0]
    assert env2.metadata.event_type == "ApprovalRequested"
    assert env2.payload["required_role"] == "operations_admin"

def test_jwt_generation():
    token = JWTService.create_access_token({"sub": "admin@sc.com", "role": "super_admin"})
    assert isinstance(token, str)
    
    decoded = JWTService.decode_token(token)
    assert decoded["sub"] == "admin@sc.com"
    assert decoded["role"] == "super_admin"
