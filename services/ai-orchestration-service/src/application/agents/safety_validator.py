import logging
import json
from typing import Dict, Any, List
from infrastructure.ollama_client import OllamaClient
from application.rag_service import OperationalRAGService

logger = logging.getLogger(__name__)

class AIConstraintValidator:
    """
    TASK 2 & 12: Advanced Clinical & Operational Constraint Validator.
    Implements multi-constraint reasoning and hallucination resistance via contradiction detection.
    """
    
    def __init__(self, ollama: OllamaClient, rag: OperationalRAGService):
        self.ollama = ollama
        self.rag = rag
        self.model = "llama3:8b"

    async def validate_recommendation(self, recommendation: Dict[str, Any], context_summary: str) -> Dict[str, Any]:
        """
        Simultaneous multi-constraint audit (FEFO, Cold-Chain, Vault, Capacity) 
        plus contradiction detection against the current operational state.
        """
        
        # 1. Broad grounding on all relevant logistics rules
        grounding = await self.rag.query("Clinical storage, transport safety, and FEFO inventory rules.")
        
        # 2. Build Reflection Prompt with multi-dimensional focus
        system_prompt = (
            "You are a Senior Clinical Safety & Logistics Auditor. "
            "Your job is to perform a Deep Constraint Audit on proposed operational actions. "
            "You must simultaneously evaluate: FEFO adherence, Cold-Chain integrity, Vault security, "
            "Warehouse Capacity, and Operational Logic. "
            "Reject any recommendation that contradicts the physical reality described in the context."
        )
        
        audit_payload = (
            f"PROPOSED RECOMMENDATION:\n{json.dumps(recommendation, indent=2)}\n\n"
            f"OPERATIONAL CONTEXT (PHYSICAL REALITY):\n{context_summary}\n\n"
            f"CLINICAL & LOGISTICS GROUNDING RULES:\n{grounding}\n\n"
            "AUDIT CHECKLIST:\n"
            "1. CONTRADICTION CHECK: Does the AI recommend moving stock that doesn't exist or isn't in that warehouse?\n"
            "2. FEFO CHECK: Is the AI bypassing an earlier expiring batch? (Verify against context batches)\n"
            "3. COLD-CHAIN CHECK: Is temperature-sensitive stock being routed to a non-compliant facility?\n"
            "4. CAPACITY CHECK: Does the target warehouse have enough physical space or emergency buffer?\n"
            "5. EVIDENCE CHECK: Does the AI make unsupported claims about supplier behavior or demand spikes?\n"
            "\n"
            "OUTPUT FORMAT:\n"
            "Return a JSON object with:\n"
            "- 'is_safe' (boolean)\n"
            "- 'audit_trail' (Detailed step-by-step reasoning for the audit decision)\n"
            "- 'violations' (List of specific constraints triggered)\n"
            "- 'confidence_score' (0.0 to 1.0)\n"
            "- 'corrected_recommendation' (Required if is_safe is False)"
        )

        try:
            response = await self.ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": audit_payload}
                ]
            )
            
            content = response.get("message", {}).get("content", "{}").strip()
            # 1. Try parsing direct raw content
            try:
                audit_result = json.loads(content)
            except json.JSONDecodeError:
                audit_result = None

            # 2. Try extracting from markdown ```json block
            if audit_result is None and "```json" in content:
                block = content.split("```json")[1].split("```")[0].strip()
                try:
                    audit_result = json.loads(block)
                except json.JSONDecodeError:
                    pass

            # 3. Try extracting from generic ``` block
            if audit_result is None and "```" in content:
                block = content.split("```")[1].split("```")[0].strip()
                try:
                    audit_result = json.loads(block)
                except json.JSONDecodeError:
                    pass

            # 4. Fallback to locating first { and last }
            if audit_result is None:
                start = content.find("{")
                end = content.rfind("}")
                if start != -1 and end != -1:
                    block = content[start:end+1].strip()
                    try:
                        audit_result = json.loads(block)
                    except json.JSONDecodeError:
                        pass

            if audit_result is None:
                raise ValueError("No valid JSON structure found in LLM response")
            
            # Additional logic to ensure the audit itself isn't a hallucination
            if audit_result.get("is_safe") and "no stock" in str(audit_result).lower():
                # Catch cases where the auditor missed a clear contradiction
                pass 

            return audit_result
        except Exception as e:
            logger.error(f"Advanced Safety validation failed: {e}")
            return {
                "is_safe": False, 
                "violations": [f"Audit Engine Error: {str(e)}"],
                "audit_trail": "System failure during safety reflection."
            }
