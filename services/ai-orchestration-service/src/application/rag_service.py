import os
import json
import logging
from typing import List, Dict, Any
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

class OperationalRAGService:
    def __init__(self, persist_directory: str = "infrastructure/chroma_db_v2"):
        self.persist_directory = persist_directory
        self.embeddings = OllamaEmbeddings(model="nomic-embed-text")
        self.vector_store = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        self.dataset_root = os.getenv("DATASET_ROOT", r"d:\power bi\NorthwindData")

    async def initialize(self):
        """Initialize the vector store and index core guidelines and datasets."""
        try:
            if os.path.exists(self.persist_directory):
                self.vector_store = Chroma(
                    persist_directory=self.persist_directory,
                    embedding_function=self.embeddings
                )
                logger.info("Loaded existing RAG vector store.")
            else:
                logger.info("Initializing new RAG vector store...")
                await self.index_core_knowledge()
        except Exception as e:
            logger.warning(f"Failed to initialize Chroma vector store: {e}. Falling back to deterministic grounding.")

    async def index_core_knowledge(self):
        """Index medical guidelines, semantic models, and Northwind datasets for operational grounding."""
        try:
            texts = []
            metadatas = []
            
            # 1. Index Operational Guidelines
            guideline = (
                "CLINICAL GROUNDING GUIDELINES:\n"
                "1. Cold-Chain: Vaccines must be stored between +2C and +8C. Never route cold-chain to standard dry warehouses.\n"
                "2. FEFO: First-Expired, First-Out routing is mandatory.\n"
                "3. Controlled Substances: Must be routed to vaults only.\n"
                "4. Transfers: Redistribution is only allowed if target is below 20% capacity."
            )
            texts.append(guideline)
            metadatas.append({"source": "operational_rules", "type": "guideline"})

            # 2. Medicine-Aware Indexing (Products.json)
            products_path = os.path.join(self.dataset_root, "Products.json")
            if os.path.exists(products_path):
                with open(products_path, "r", encoding="utf-8") as f:
                    products = json.load(f)
                    for p in products:
                        text = f"Medicine SKU: {p.get('ProductName')} (ID: {p.get('ProductID')}). Category: {p.get('CategoryID')}. Unit Price: {p.get('UnitPrice')}. Reorder Level: {p.get('ReorderLevel')}. Units In Stock: {p.get('UnitsInStock')}."
                        texts.append(text)
                        metadatas.append({"source": "Products.json", "type": "medicine_inventory", "product_id": p.get("ProductID")})

            # 3. Warehouse-Aware Indexing (Regions.json & Territories.json)
            regions_path = os.path.join(self.dataset_root, "Regions.json")
            if os.path.exists(regions_path):
                with open(regions_path, "r", encoding="utf-8") as f:
                    regions = json.load(f)
                    for r in regions:
                        text = f"Warehouse Region: {r.get('RegionDescription')} (ID: {r.get('RegionID')})."
                        texts.append(text)
                        metadatas.append({"source": "Regions.json", "type": "warehouse_region"})

            if not texts:
                logger.warning("No operational documents found to index.")
                return
    
            self.vector_store = Chroma.from_texts(
                texts=texts,
                metadatas=metadatas,
                embedding=self.embeddings,
                persist_directory=self.persist_directory
            )
            logger.info(f"Indexed {len(texts)} structured chunks into RAG for medicine and warehouse awareness.")
        except Exception as e:
            logger.warning(f"Failed to index core knowledge: {e}")

    async def query(self, question: str, n_results: int = 3) -> Dict[str, Any]:
        """Query the operational RAG for grounding evidence with confidence scoring."""
        try:
            if not self.vector_store:
                await self.initialize()
                
            if self.vector_store:
                # Get results with scores
                results = self.vector_store.similarity_search_with_score(question, k=n_results)
                
                # If using L2 distance, lower score is better (more similar). Convert to confidence roughly.
                context = ""
                confidence_sum = 0.0
                for doc, score in results:
                    context += f"[{doc.metadata.get('type', 'info')}] {doc.page_content}\n"
                    # Simple heuristic: distance 0.0 = 100% confidence, distance 1.0 = 50%
                    confidence_sum += max(0.0, 1.0 - (score / 2.0))
                
                avg_confidence = (confidence_sum / len(results)) if results else 0.0
                return {
                    "context": context,
                    "retrieval_confidence": round(avg_confidence, 2),
                    "status": "success"
                }
        except Exception as exc:
            logger.warning(f"RAG search failed or Ollama offline: {exc}")
            
        # Deterministic Fallback if retrieval fails
        fallback_context = (
            "CLINICAL GROUNDING GUIDELINES:\n"
            "1. Cold-Chain Integrity: Life-critical vaccines must be maintained between +2C and +8C.\n"
            "2. FEFO (First-Expired, First-Out): Earliest expiry out first.\n"
            "3. Transfers: Redistribution allowed if target supply < 20%.\n"
            "4. Dataset Source: Northwind Products & Orders mapping."
        )
        return {
            "context": fallback_context,
            "retrieval_confidence": 0.50,  # Lower confidence due to fallback
            "status": "degraded_fallback"
        }
