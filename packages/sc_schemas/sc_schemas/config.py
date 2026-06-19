import os
from pathlib import Path

class ConfigRegistry:
    # Use environment variables with sensible defaults
    PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))))
    
    DATA_ROOT = PROJECT_ROOT / os.getenv("DATA_DIR", "NorthwindData")
    METADATA_ROOT = PROJECT_ROOT / os.getenv("METADATA_DIR", "packages/sc_schemas/sc_schemas/metadata")
    REPORT_ROOT = PROJECT_ROOT / os.getenv("REPORT_DIR", "audit_report")
    MODEL_ROOT = PROJECT_ROOT / os.getenv("MODEL_DIR", "models")
    
    # Validation
    @classmethod
    def validate(cls):
        for attr in ["DATA_ROOT", "METADATA_ROOT", "REPORT_ROOT"]:
            path = getattr(cls, attr)
            if not path.exists():
                print(f"[WARNING]: Config path {attr} does not exist: {path}")

# Auto-validate on import
ConfigRegistry.validate()
