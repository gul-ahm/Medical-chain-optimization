from pydantic import BaseModel
from typing import Optional, Dict, Any

class ProblemDetails(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: Optional[str] = None
    instance: Optional[str] = None
    extensions: Optional[Dict[str, Any]] = None
