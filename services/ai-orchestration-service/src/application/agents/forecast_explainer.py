import logging
from typing import Dict, Any, List
from infrastructure.ollama_client import OllamaClient
from application.rag_service import OperationalRAGService

logger = logging.getLogger(__name__)

class ForecastExplainerAgent:
    """
    TASK 11: Forecast Realism Improvement.
    Translates statistical signals into grounded operational meanings, 
    accounting for lag, seasonality, and confidence degradation.
    """
    
    def __init__(self, ollama: OllamaClient, rag: OperationalRAGService):
        self.ollama = ollama
        self.rag = rag
        self.model = "llama3:8b"

    async def explain_forecast(self, sku: str, forecast_data: Dict[str, Any]) -> str:
        """
        Explains forecast reality, focusing on operational lag, 
        medicine criticality, and downstream consequences.
        """
        # 1. Gather clinical and seasonality grounding
        grounding = await self.rag.query(f"Operational lag, seasonality, and demand modifiers for {sku}.")
        
        # 2. Build Advanced Reasoning Prompt
        system_prompt = (
            "You are a Senior Operational Decision Intelligence Specialist. "
            "Your goal is to provide TRUTH in forecasting. Explain statistical signals "
            "through the lens of operational reality (Lead Times, Expiry Pressure, Demand Spikes). "
            "Account for Confidence Degradation over longer horizons."
        )
        
        user_prompt = (
            f"MEDICATION: {sku}\n"
            f"FORECAST DATA (RAW): {forecast_data}\n\n"
            f"GROUNDING (LOGISTICS REALITY): {grounding}\n\n"
            "EXPLANATION REQUIREMENTS:\n"
            "1. OPERATIONAL MEANING: What does this demand change actually mean for the warehouse?\n"
            "2. LAG AWARENESS: How long is the operational lag window before stock actually arrives?\n"
            "3. CONFIDENCE DEGRADATION: Explain why the forecast confidence drops beyond the 30-day window.\n"
            "4. EXPIRY PRESSURE: If demand drops, how does that increase the risk of batch expiry?\n"
            "5. DOWNSTREAM CONSEQUENCES: What happens to clinical readiness if this forecast is ignored?\n"
            "\n"
            "DO NOT invent numbers. FOCUS on operational narrative and risk mitigation."
        )

        try:
            response = await self.ollama.generate(
                model=self.model,
                prompt=user_prompt,
                system=system_prompt,
                stream=False
            )
            return response.get("response", "Operational narrative generation failed.")
        except Exception as e:
            logger.error(f"Forecast explanation failed: {e}")
            return f"Operational Explainability Error: {str(e)}"
