import logging
from typing import Dict, Any, List, Optional
from infrastructure.ollama_client import OllamaClient
from application.context_engine import OperationalContextEngine
from application.rag_service import OperationalRAGService
from infrastructure.memory_service import AIMemoryService

logger = logging.getLogger(__name__)

class ExecutiveCopilotAgent:
    def __init__(self, ollama: OllamaClient, context_engine: OperationalContextEngine, rag: OperationalRAGService):
        self.ollama = ollama
        self.context_engine = context_engine
        self.rag = rag
        self.memory = AIMemoryService()
        self.model = "llama3:8b"

    async def chat(self, user_query: str, warehouse_id: Optional[str] = None) -> str:
        """Executive-level chat assistance for operational decision support."""
        # 1. Fetch historical context
        history = self.memory.get_context(warehouse_id or "global", "copilot_agent")
        
        # 2. Fetch RAG grounding for the query
        grounding = await self.rag.query(user_query)
        
        # 3. Fetch Operational Context if a warehouse is specified or implied
        context = ""
        if warehouse_id:
            context = await self.context_engine.assemble_context_packet(warehouse_id)
            
        # 4. Build Prompt
        system_prompt = (
            "You are the Executive Operational Copilot for a Medical Supply Intelligence Platform. "
            "You help hospital administrators and logistics managers make data-driven decisions. "
            "Always be precise, medically-aware, and prioritize patient safety. "
            "Ground your answers in the provided context, history, and guidelines."
        )
        
        user_message = f"USER QUERY: {user_query}\n\n"
        user_message += f"CONVERSATION HISTORY:\n{history}\n\n"
        if context:
            user_message += f"OPERATIONAL CONTEXT:\n{context}\n\n"
        user_message += f"CLINICAL GUIDELINES:\n{grounding}\n\n"
        user_message += "Please provide a concise, executive-level response."

        try:
            response = await self.ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            )
            response_content = response.get("message", {}).get("content", "I encountered an issue processing your request.")
            
            # 5. Store in Memory
            self.memory.store_interaction(warehouse_id or "global", "copilot_agent", {
                "summary": f"User: {user_query[:50]}... | AI: {response_content[:50]}...",
                "query": user_query,
                "response": response_content
            })
            
            return response_content
        except Exception as e:
            logger.error(f"Copilot chat failed: {e}")
            return f"Error: {str(e)}"
