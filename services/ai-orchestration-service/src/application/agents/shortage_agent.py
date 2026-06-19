import logging
import json
from typing import Dict, Any, List
from infrastructure.ollama_client import OllamaClient
from application.context_engine import OperationalContextEngine
from application.rag_service import OperationalRAGService

logger = logging.getLogger(__name__)

class ShortageAnalysisAgent:
    def __init__(self, ollama: OllamaClient, context_engine: OperationalContextEngine, rag: OperationalRAGService):
        self.ollama = ollama
        self.context_engine = context_engine
        self.rag = rag
        self.primary_model = "llama3:8b"
        self.fallback_model = "mistral:7b"

    async def analyze_shortage(self, sku: str, warehouse_id: str) -> Dict[str, Any]:
        """AI-driven root cause analysis for emerging shortages."""
        # 1. Gather context specific to the SKU
        context = await self.context_engine.assemble_context_packet(warehouse_id, focus_skus=[sku])
        
        # 2. Gather clinical grounding
        grounding = await self.rag.query(f"What are the critical supply rules for {sku}?")
        
        # 3. Build Prompt
        system_prompt = (
            "You are a Clinical Supply Chain Forensic Analyst. "
            "Analyze the root cause of the reported shortage for the specified medication. "
            "Consider delivery delays, expiry waves, buffer violations, and regional demand spikes. "
            "Output MUST be in valid JSON format."
        )
        
        user_prompt = (
            f"MEDICATION: {sku}\n"
            f"WAREHOUSE: {warehouse_id}\n\n"
            f"CLINICAL GROUNDING:\n{grounding}\n\n"
            f"OPERATIONAL STATE:\n{context}\n\n"
            "INSTRUCTIONS:\n"
            "1. Explain the root cause of the shortage (e.g., 'A wave of 4 batches expiring simultaneously').\n"
            "2. Assess the risk to clinical operations (High/Medium/Low).\n"
            "3. Propose immediate mitigation steps (e.g., 'Emergency redistribution from WH-NORTH').\n"
            "4. Return a JSON object with 'root_cause', 'risk_assessment', and 'mitigation_plan'."
        )

        try:
            response = await self.ollama.chat(
                model=self.primary_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
        except Exception as e:
            logger.warning(f"Primary model {self.primary_model} failed for shortage analysis, falling back: {e}")
            response = await self.ollama.chat(
                model=self.fallback_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )

        try:
            content = response.get("message", {}).get("content", "{}").strip()
            # 1. Try parsing direct raw content
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                pass

            # 2. Try extracting from markdown ```json block
            if "```json" in content:
                block = content.split("```json")[1].split("```")[0].strip()
                try:
                    return json.loads(block)
                except json.JSONDecodeError:
                    pass
            
            # 3. Try extracting from generic ``` block
            if "```" in content:
                block = content.split("```")[1].split("```")[0].strip()
                try:
                    return json.loads(block)
                except json.JSONDecodeError:
                    pass

            # 4. Fallback to locating first { and last }
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1:
                block = content[start:end+1].strip()
                try:
                    return json.loads(block)
                except json.JSONDecodeError:
                    pass

            raise ValueError("No valid JSON structure found in LLM response")
        except Exception as e:
            logger.error(f"Shortage analysis parsing failed: {e}")
            return {"error": str(e)}
