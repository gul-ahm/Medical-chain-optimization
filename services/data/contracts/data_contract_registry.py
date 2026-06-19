import structlog
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
from datetime import datetime

logger = structlog.get_logger(__name__)

class DataContract(BaseModel):
    """
    Represents a formal agreement between a data producer and consumers regarding schema and quality.
    """
    contract_id: str
    version: str
    schema_definition: Dict[str, Any]
    producer: str
    consumers: List[str]
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DataContractRegistry:
    """
    Enterprise Data Contract Registry.
    Manages the lifecycle, versioning, and validation of schemas across the supply chain data ecosystem.
    """
    def __init__(self):
        self.contracts: Dict[str, Dict[str, DataContract]] = {} # contract_id -> {version -> DataContract}

    def register_contract(self, contract: DataContract) -> bool:
        """
        Registers a new data contract or a new version of an existing contract.
        In production, this would perform backward compatibility checks.
        """
        logger.info("registering_data_contract", id=contract.contract_id, version=contract.version)
        
        if contract.contract_id not in self.contracts:
            self.contracts[contract.contract_id] = {}
            
        self.contracts[contract.contract_id][contract.version] = contract
        return True

    def validate_data(self, contract_id: str, version: str, payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Validates a payload against a registered data contract.
        """
        contract_set = self.contracts.get(contract_id)
        if not contract_set:
            return False, f"Contract {contract_id} not found."
            
        contract = contract_set.get(version)
        if not contract:
            return False, f"Version {version} of contract {contract_id} not found."

        # In production: utilize jsonschema.validate(payload, contract.schema_definition)
        # Simplified validation logic for architectural demo:
        required_fields = contract.schema_definition.get("required", [])
        for field in required_fields:
            if field not in payload:
                logger.error("data_contract_violation", field=field, contract=contract_id)
                return False, f"Missing required field: {field}"
                
        return True, None

    def get_latest_version(self, contract_id: str) -> Optional[DataContract]:
        """Retrieves the most recent version of a data contract."""
        contract_set = self.contracts.get(contract_id)
        if not contract_set: return None
        
        latest_version = sorted(contract_set.keys())[-1]
        return contract_set[latest_version]

# ── Singleton Instance ──
data_contract_registry = DataContractRegistry()
