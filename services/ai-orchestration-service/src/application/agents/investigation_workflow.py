import logging
import json
from typing import Dict, Any, List, Optional
from infrastructure.ollama_client import OllamaClient
from application.context_engine import OperationalContextEngine
from application.rag_service import OperationalRAGService
from infrastructure.memory_service import AIMemoryService

logger = logging.getLogger(__name__)

class InvestigationWorkflowAgent:
    """
    TASK 6: AI-driven operational investigation workflows.
    Traces root causes, historical movements, and supplier behaviors to reconstruct timelines.
    """

    def __init__(self, ollama: OllamaClient, context_engine: OperationalContextEngine, rag: OperationalRAGService):
        self.ollama = ollama
        self.context_engine = context_engine
        self.rag = rag
        self.memory = AIMemoryService()
        self.model = "llama3:8b" # Use llama3 for deep logical investigation

    async def investigate_incident(self, query: str, warehouse_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Reconstructs an operational timeline and explains the root cause chain.
        """
        # 1. Gather historical movement context and current state
        context = await self.context_engine.assemble_context_packet(warehouse_id)
        
        # 2. Gather historical incident memory
        history = self.memory.get_context(warehouse_id or "global", "investigation")
        
        # 3. Grounding on supplier behavior and clinical rules
        grounding = await self.rag.query("Supplier lead times, logistics history, and clinical criticality.")

        system_prompt = (
            "You are a Forensic Medical Supply Chain Investigator. "
            "Your goal is to trace the 'Why' behind operational failures. "
            "You must reconstruct a timeline of events leading to the current state. "
            "Reason across: Historical Movements, Supplier Performance, FEFO Depletion, and Demand Surges. "
            "Output MUST be structured for a timeline view."
        )

        user_prompt = (
            f"USER QUERY: {query}\n\n"
            f"OPERATIONAL CONTEXT:\n{context}\n\n"
            f"HISTORICAL MEMORY:\n{history}\n\n"
            f"LOGISTICS GROUNDING:\n{grounding}\n\n"
            "INVESTIGATION TASKS:\n"
            "1. RECONSTRUCT TIMELINE: Identify the sequence of events (Stockout -> Demand Spike -> Supplier Delay).\n"
            "2. ANALYZE DRIVERS: What were the primary, secondary, and tertiary drivers of this incident?\n"
            "3. EVIDENCE CHAIN: Link every claim to a specific data point in the context or memory.\n"
            "4. RECOMMEND STABILIZATION: What is the immediate step to stop the bleeding?\n"
            "\n"
            "RETURN JSON with 'timeline' (list of events with timestamps), 'root_cause_analysis', and 'evidence_chain'."
        )

        try:
            response = await self.ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            content = response.get("message", {}).get("content", "{}")
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            investigation_result = json.loads(content)
            
            # Persist the investigation for long-term memory (Task 7)
            self.memory.store_interaction(warehouse_id or "global", "investigation", {
                "query": query,
                "summary": investigation_result.get("root_cause_analysis", "Unknown cause"),
                "timeline_count": len(investigation_result.get("timeline", []))
            })

            return investigation_result
        except Exception as e:
            logger.error(f"Investigation workflow failed: {e}")
            return {"error": str(e), "timeline": [], "root_cause_analysis": "Investigation failed due to engine error."}
