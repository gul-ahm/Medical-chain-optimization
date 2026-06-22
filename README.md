# Healthcare Recommendation Platform - Product Feature Document

This document outlines the features delivered by the platform, the problems they solve within the medical supply chain, the technology stack utilized, and how that stack effectively addresses the client's pain points.

## 1. Agentic AI Orchestration & Autonomous Decision Making

### Feature Delivered
A multi-agent, hierarchical system (Director-Manager-Worker) that autonomously choreographs inventory, forecasting, and balancing operations without requiring constant human intervention. It includes an AI Governance Gatekeeper to prevent high-risk actions.

### Problem Solved
Medical supply chains often suffer from siloed decision-making where a change in demand doesn't automatically trigger procurement or warehouse transfers. Human operators cannot process thousands of SKU updates in real-time, leading to stockouts of critical medical supplies or expensive overstock.

### Tech Stack Used
- **Event Bus:** Confluent Kafka (Avro schemas)
- **State Management:** Redis (SAGA pattern, Distributed Locks)
- **Deployment:** Kubernetes (EKS), KEDA (Event-driven Autoscaling)
- **Compute:** FastAPI (Python) for stateless agent pods
- **Auditing:** PostgreSQL

### How the Tech Stack Solves the Medical Supply Chain Problem
By decoupling the "Thinking" (Workers) from "Doing" (Orchestrator) using asynchronous Kafka choreography, the system ensures that massive ML inference spikes (e.g., predicting demand for flu season) do not block operational communications. Redis locks ensure that if multiple agents recommend actions, the state is consistent and idempotency is guaranteed (no double ordering). The Governance Agent hard-codes safety limits (e.g., maximum transfer budgets), ensuring that autonomous actions never exceed financial or regulatory risk thresholds.

---

## 2. AI/ML Demand Forecasting & Optimization

### Feature Delivered
Multi-horizon demand forecasting, supplier risk prediction, warehouse balancing recommendations, and expiry/markdown optimization models running continuously.

### Problem Solved
Traditional medical supply chains rely on static reorder points (e.g., Min-Max), which fail during sudden demand shocks (pandemics, regional outbreaks). Additionally, medical supplies (like vaccines or reagents) have strict expiry dates, leading to massive write-offs if perishable inventory isn't rotated or discounted in time. 

### Tech Stack Used
- **Machine Learning Models:** Temporal Fusion Transformer (DeepAR), LightGBM, XGBoost, Random Forest, Multi-Armed Bandits.
- **MLOps:** Apache Airflow (Orchestration), MLflow (Model Registry), EvidentlyAI (Data Drift Monitoring).
- **Serving:** FastAPI, TorchServe.
- **Feature Store:** Redis (Online), S3/Parquet (Offline).

### How the Tech Stack Solves the Medical Supply Chain Problem
The Temporal Fusion Transformer models multi-horizon demand, allowing the platform to predict stockouts before they happen. Random Forest models analyze historical supplier delivery times to calculate `Probability_of_Delay` for critical POs, allowing the system to automatically adjust safety stock padding. XGBoost models predict `Probability_of_Expiry_Before_Sale`, triggering the Expiry Agent to automatically recommend transfers of near-expiry medical goods to high-demand regions, drastically reducing perishable waste.

---

## 3. Distributed Inventory Orchestration (Sagas)

### Feature Delivered
Real-time, event-sourced global inventory tracking with asynchronous, distributed choreography (Saga Pattern) for multi-warehouse transfers and cart reservations.

### Problem Solved
In a distributed medical network, transferring stock between regional warehouses often leads to "phantom inventory" or data inconsistencies if a network failure occurs midway. This can result in a hospital believing a critical item is available when it is actually locked in a failed transit state.

### Tech Stack Used
- **Pattern:** Choreography-based SAGA Pattern
- **Messaging:** Kafka (`evt.transfer.initiated`, `evt.transfer.failed`)
- **Database:** PostgreSQL (AsyncUnitOfWork, Optimistic Locking)
- **Coordination:** Redis (Distributed Locks, TTL Reservations)

### How the Tech Stack Solves the Medical Supply Chain Problem
The Saga pattern ensures eventual consistency without distributed locks on the databases. If a transfer of medical supplies is initiated from Warehouse A to Warehouse B, but Warehouse B rejects the transfer (e.g., capacity full), the system autonomously consumes the `evt.transfer.failed` event and executes a Compensating Transaction to roll the stock back to Warehouse A. This guarantees that critical medical inventory is never "lost" in the system due to infrastructure failures.

---

## 4. Enterprise Data Engineering & Feature Store

### Feature Delivered
A highly normalized transactional database combined with a real-time CDC (Change Data Capture) streaming architecture and a unified Feature Store for AI inference.

### Problem Solved
AI models are only as good as their data. In traditional medical supply chains, analytical data is processed in nightly batches, meaning AI predictions are always 24 hours behind reality. Furthermore, schema evolutions often break downstream reporting and AI training.

### Tech Stack Used
- **Transactional Database:** PostgreSQL (B-Tree/BRIN indexing, Native Partitioning)
- **CDC Streaming:** Debezium
- **Processing:** Apache Flink / Kafka Streams, Apache Spark
- **Data Warehouse:** AWS Redshift / Snowflake
- **Schema Management:** Confluent Schema Registry

### How the Tech Stack Solves the Medical Supply Chain Problem
Debezium captures PostgreSQL transactions (like a hospital placing an order) in real-time, streaming them to Kafka. Flink computes real-time sliding window aggregations (e.g., sudden spike in syringe orders) and pushes these directly to the Redis Online Feature Store. This allows the AI models to generate prescriptive recommendations with sub-100ms latency based on live data, rather than yesterday's batch data.

---

## 5. Enterprise UX & Dashboard Command Center

### Feature Delivered
A Next.js (App Router) based command center with 16 role-specific dashboards, featuring real-time Server-Sent Events (SSE) updates, 3D visualizations, and explainable AI insights (SHAP Waterfall charts).

### Problem Solved
Medical supply chain professionals are often overwhelmed by "data dumping" from traditional ERP systems. They need actionable insights, not raw data grids. When an AI suggests a risky transfer of medical goods, operators need to trust the system before approving it; otherwise, the AI is ignored.

### Tech Stack Used
- **Frontend Framework:** Next.js (React Server Components)
- **Real-Time Data:** Server-Sent Events (SSE) hooked into Zustand state management
- **UI & Visualization:** Tailwind CSS, Headless UI, Apache ECharts, Recharts
- **Security:** JWT RBAC guards, Dynamic PII Data Masking

### How the Tech Stack Solves the Medical Supply Chain Problem
The UX is built around "Explainable AI". When the Optimization Agent recommends a warehouse transfer, the UI presents a SHAP Waterfall chart visually breaking down why the decision was made (e.g., "+ High Demand Risk", "- High Freight Cost"). The use of SSE ensures that critical stockout alerts of medical supplies push to the operator's screen instantly without requiring page refreshes, enabling proactive rather than reactive management.

---

## 6. Monorepo & Shared SDK Foundation

### Feature Delivered
A strictly governed Python/Next.js monorepo containing reusable SDKs (`sc_events`, `sc_db`, `sc_auth`) ensuring 100% type-safety and standardized observability across all microservices.

### Problem Solved
In complex healthcare systems, microservices often drift in how they handle security, logging, and database transactions. If one service logs errors differently, distributed tracing breaks, making it impossible to audit why a critical medical supply order failed across 5 different services.

### Tech Stack Used
- **Type Safety:** Pydantic (Python), TypeScript (Frontend)
- **Database ORM:** SQLAlchemy 2.0 (Async UnitOfWork)
- **Observability:** OpenTelemetry, Prometheus, structlog (JSON logging)
- **CI/CD:** GitHub Actions (Trivy, SonarQube, ArgoCD)

### How the Tech Stack Solves the Medical Supply Chain Problem
The shared SDKs guarantee that every single database mutation triggers an `after_flush` audit log, providing the immutable traceability required for healthcare compliance. OpenTelemetry automatically injects `X-Correlation-ID` across HTTP and Kafka boundaries, meaning a single user click ("Approve Order") can be traced perfectly through the API, Kafka, the AI Agent, and the database, ensuring complete non-repudiation of actions.

---

## 7. Digital Twin & Simulation Engine

### Feature Delivered
A Monte Carlo simulation engine utilizing a Digital Twin of the supply chain to run thousands of "What-If" scenarios before executing high-risk decisions.

### Problem Solved
Healthcare supply chains are sensitive to black swan events (e.g., supplier bankruptcy, sudden pandemics, port strikes). Testing new routing policies or ML models in the live production environment risks catastrophic medical shortages.

### Tech Stack Used
- **Simulation:** SimPy (Agent-based discrete event simulation)
- **Optimization:** Google OR-Tools (Mixed-Integer Linear Programming)
- **Compute:** Dedicated CPU-optimized Kubernetes Node Pools
- **ML Integration:** Reinforcement Learning environments (OpenAI Gym)

### How the Tech Stack Solves the Medical Supply Chain Problem
If a hospital network wants to know what happens if their primary supplier of PPE is delayed by 14 days, the system forks the current inventory state into a sandbox. The SimPy engine runs 1,000 Monte Carlo simulations of the disruption, outputting probabilistic stockout dates. This allows supply chain directors to proactively adjust safety stock or secure alternative suppliers mathematically, rather than guessing.

---

## 8. AI Executive Copilot & Natural Language Querying

### Feature Delivered
A conversational AI assistant embedded in the dashboard (`AICopilotPanel`) capable of translating natural language into complex semantic graphs to query operational telemetry.

### Problem Solved
Supply chain executives do not have time to write SQL queries or navigate through 20 different dashboard tabs to answer questions like, "Which hospitals are at risk of stockouts for antivirals next week?"

### Tech Stack Used
- **NLP/LLM:** Large Language Models (integrated via the API proxy)
- **Data Integration:** Semantic parsing against PostgreSQL and Redis Feature Stores
- **UI:** Next.js conversational UI with boundary condition handling

### How the Tech Stack Solves the Medical Supply Chain Problem
The Executive Copilot acts as a data analyst on demand. A user can type a question, and the LLM translates it into a precise backend query, returning structured, actionable insights instantly. It collapses the time from "asking a question" to "making a strategic decision" from hours to seconds.

---

## 9. Clinical Shortage Forensics

### Feature Delivered
An autonomous investigation module (`AIShortageForensics`) that compiles causality chains, including Root Cause Analysis, Clinical Risk Assessments, and Mitigation Strategy Plans for any detected inventory anomaly.

### Problem Solved
When a critical medicine (e.g., Insulin) runs out, identifying *why* it happened (Was it a supplier delay? A cold-chain breach? A sudden demand spike?) traditionally takes days of manual investigation.

### Tech Stack Used
- **Backend Analytics:** Explainability Agent querying PostgreSQL Audit Ledgers
- **Frontend State:** Resilient UI with explicit error boundaries and offline degradation handling
- **Tracing:** Distributed Kafka SAGA lineage tracing

### How the Tech Stack Solves the Medical Supply Chain Problem
If a hospital reports an insulin shortage, the user clicks "Investigate." The platform traces the exact lineage of the shortage through the Kafka event bus, identifying that a supplier delivery was delayed by 3 days, and immediately outputs an AI-generated mitigation plan (e.g., "Expedite emergency air freight from the central hub").

---

## 10. Cold-Chain Compliance & Regulatory Routing

### Feature Delivered
Hard-coded medical logistics rules integrated directly into the Optimization solver, enforcing First-Expired, First-Out (FEFO) and temperature-controlled routing.

### Problem Solved
Medical supplies like vaccines must be kept between 2°C and 8°C. Transferring them to a warehouse without cold-storage ruins the batch. Furthermore, traditional FIFO (First-In, First-Out) logic causes high pharmaceutical waste because it ignores expiration dates.

### Tech Stack Used
- **Logic Constraints:** Google OR-Tools (MILP constraint equations)
- **Compliance Rules:** FDA 21 CFR Part 11 compliant audit logging via SQLAlchemy
- **Data Attributes:** Redis tracking batch expiry and facility capabilities

### How the Tech Stack Solves the Medical Supply Chain Problem
The optimization engine mathematically blocks any proposed transfer of temperature-sensitive drugs to non-compliant facilities. It also forces the system to allocate near-expiry stock first (FEFO), directly preventing millions of dollars in pharmaceutical write-offs and ensuring patient safety.

---

## 11. Resilient Autonomous Testing & CI/CD Validation

### Feature Delivered
An autonomous testing pipeline (TestSprite) designed to continuously validate the Next.js frontend, API integrations, and AI Copilot resilience against edge cases.

### Problem Solved
With a highly decoupled architecture containing multiple AI agents, simple unit tests are insufficient. The system must be proven to recover gracefully if an AI node disconnects or if the Kafka stream is interrupted.

### Tech Stack Used
- **Testing Framework:** TestSprite autonomous validation
- **API Proxying:** Next.js Rewrites (`/api/v1/*` to `http://localhost:8008`) preventing CORS issues in cloud sandboxes
- **Telemetry:** Kubernetes Event-driven Autoscaling (KEDA) simulated load

### How the Tech Stack Solves the Medical Supply Chain Problem
By continuously running autonomous tests that simulate network disconnects and edge cases (e.g., empty submissions to the Copilot), the platform guarantees that the critical UI will never hard-crash during an emergency. If the AI goes offline, the UI gracefully degrades to "Clinical Failsafe Mode", ensuring operators can always access deterministic safety recommendations.

---

---

## 12. Supplier Intelligence & Risk Profiling

### Feature Delivered
The Supplier Intelligence Agent and Procurement Recommendation Agent dynamically evaluate vendor delivery risks and autonomously adjust purchase orders.

### Problem Solved
**Unreliable suppliers causing inventory imbalances.** If a supplier constantly delivers late, standard reorder points will lead to stockouts before the late delivery arrives.

### Tech Stack Used
- **ML Models:** Random Forest classifiers for supplier risk scoring.
- **Orchestration:** FastAPI Procurement Agents linked to the PostgreSQL ledger.

### How the Tech Stack Solves the Medical Supply Chain Problem
By dynamically scoring supplier On-Time In-Full (OTIF) metrics, the AI detects macro-economic or historical delivery risks. It autonomously pads the Safety Stock requirements and routes Purchase Orders (POs) to secondary, more reliable suppliers when the primary supplier exhibits a high risk of delay, preventing downstream clinical shortages.

---

## 13. Promotion & Causal Intelligence

### Feature Delivered
The Promotion Intelligence Agent buffers baseline demand forecasts using causal inference models based on external marketing or public health campaign inputs.

### Problem Solved
**Understanding how sales promotions affect inventory needs.** Public health campaigns (e.g., a flu vaccine drive) create artificial demand spikes that standard historical forecasting models fail to predict.

### Tech Stack Used
- **ML Models:** Causal Inference algorithms running within the MLOps pipeline.
- **Event Bus:** Kafka topics streaming marketing campaign schedules.

### How the Tech Stack Solves the Medical Supply Chain Problem
The agent integrates external schedule data into the baseline demand forecast. Before a public health campaign goes live, the system preemptively signals the Warehouse Balancing Agent to ship extra stock of the targeted items to local clinics, ensuring they are prepared for the artificial surge in patient demand without relying on excessive, permanent carryover inventory.

---

## 14. Expiry Markdown Optimization

### Feature Delivered
The Markdown Optimization Agent autonomously calculates targeted clearance discounts for aging inventory based on expiry proximity.

### Problem Solved
**Determining optimal timing and depth of price markdowns.** Treating all inventory items equally wastes resources and leads to massive financial write-offs when batches of medicine expire as "dead stock."

### Tech Stack Used
- **Algorithms:** Multi-Armed Bandit optimization models.
- **Telemetry:** Redis Feature Store tracking batch expiration dates.

### How the Tech Stack Solves the Medical Supply Chain Problem
The Expiry Monitoring Agent continuously scans the network. When it identifies a batch of medicine within 30 days of expiry, it triggers the Markdown Optimization Agent. Instead of waiting for the medicine to expire and throwing it away, the algorithm tests precise discount depths to safely clear the inventory to price-sensitive, high-volume clinics, recovering sunk costs and eliminating waste.

---

## 15. Localized Outlet Intelligence

### Feature Delivered
The Outlet Intelligence Agent executes hierarchical localized predictions to adjust stock allocations at the granular hospital or clinic level.

### Problem Solved
**Inconsistent performance of the same product across outlets and dead stock due to local demand mismatch.** A regional warehouse might appear healthy on average, while Outlet A is critically out-of-stock and Outlet B has untouched dead stock.

### Tech Stack Used
- **ML Models:** Hierarchical forecasting models (ShipCity/Region specific).
- **Data Architecture:** Highly granular Postgres tracking partitioned by facility.

### How the Tech Stack Solves the Medical Supply Chain Problem
The agent Abandons "national average" metrics and instead models the specific demographic consumption of each individual hospital node. By understanding micro-local consumption rates, the agent ensures that inventory is precisely routed to the exact outlet where it will be consumed, rather than allowing it to sit as dead stock in a neighboring low-demand clinic.

---

> [!SUCCESS]
> **Complete:** The Product Feature Document has been fully updated to include all required architectural paradigms, PRD specifications, and targeted solutions for complex logistical edge cases.


# Comprehensive Installation & Deployment Guide
**Global Medical Supply Chain Intelligence**

This document provides an exhaustive, step-by-step guide to installing, configuring, and deploying the platform from absolute zero. It covers hardware prerequisites, software dependencies, local LLM configurations, and Docker orchestration.

---

## 1. System Requirements

To run the full stack locally (including AI models and microservices), your machine must meet the following specifications:

| Component | Minimum | Recommended (For Local AI Processing) |
| :--- | :--- | :--- |
| **OS** | Windows 10/11, macOS 12+, Ubuntu 20.04+ | Ubuntu 22.04 LTS or macOS 14 (Apple Silicon) |
| **CPU** | 4 Cores (Intel i5 / AMD Ryzen 5) | 8+ Cores (Intel i7 / AMD Ryzen 7 / Apple M2) |
| **RAM** | 16 GB DDR4 | 32 GB DDR5 (Crucial for Local LLMs) |
| **GPU** | Not required for API-based AI | NVIDIA RTX 3060+ (12GB VRAM) or Apple Unified Memory |
| **Storage** | 50 GB SSD | 100 GB NVMe SSD |

---

## 2. Core Software Dependencies

You must install the following software with the exact or compatible versions listed below:

1. **Node.js Environment**
   * **Node.js**: `v18.17.0` or `v20.x` (LTS recommended).
   * **npm**: `v9.x` or `v10.x` (comes with Node).
   * *Verify:* `node --version` and `npm --version`
2. **Python Environment**
   * **Python**: `v3.10.x` or `v3.11.x`. (Avoid `v3.12` if using older machine learning libraries).
   * **pip**: `v23.x` or higher.
   * *Verify:* `python --version`
3. **Docker & Containerization**
   * **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux): `v24.0+`.
   * **Docker Compose**: `v2.20+`.
   * *Verify:* `docker --version`
4. **Git**
   * **Git**: `v2.30+`.
   * *Verify:* `git --version`

---

## 3. Local AI & LLM Model Configuration

This platform utilizes AI for "Demand Forecasting", "Optimization", and "Operational Causality". If you are running the AI models entirely locally (air-gapped) rather than using OpenAI/Google APIs, you must set up a local inference server.

### Installing Ollama (Local LLM Server)
Ollama is used to run local quantized models efficiently.
1. **Download:** Go to [ollama.com/download](https://ollama.com/download) and install for your OS.
2. **Start the Service:** Ensure the Ollama tray app is running.
3. **Pull the Required Models:** Open your terminal and pull the models used by the application:
   ```bash
   # For general reasoning and Copilot logic
   ollama pull llama3:8b 

   # For specialized data extraction and JSON structuring
   ollama pull mistral:7b-instruct

   # For embedding generation (RAG and semantic search)
   ollama pull nomic-embed-text
   ```
   *Note: Ensure Ollama is running on its default port `http://localhost:11434` as the Python backend will route requests there.*

---

## 4. Installation from Absolute Zero

### Step 4.1: Clone the Repository
Open your terminal and clone the project:
```bash
git clone https://github.com/your-org/medical-supply-chain.git
cd medical-supply-chain
```

### Step 4.2: Frontend Setup (Next.js)
The frontend is a React/Next.js 14 application located in `apps/web`.
```bash
cd apps/web

# Install all Node dependencies (React, Tailwind, Framer Motion, Lucide, etc.)
npm install

# Return to root
cd ../../
```

### Step 4.3: Backend Setup (Python)
The backend consists of event processors, database connectors, and AI orchestrators.
```bash
# Create a virtual environment in the root folder
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install the Python dependencies
pip install -r requirements.txt
```

### Step 4.4: Environment Variables
You must configure the environment variables for both the frontend and backend. 

Create a `.env` file in the root directory:
```env
# AI Configuration
LLM_PROVIDER=local           # Set to 'openai' or 'google' if not using Ollama
OLLAMA_BASE_URL=http://localhost:11434
PRIMARY_MODEL=llama3:8b

# Database Configuration (If using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/medical_db

# Frontend URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create a `.env.local` file in `apps/web`:
```env
NEXT_PUBLIC_APP_ENV=development
```

---

## 5. Running the Project Locally

With dependencies installed and models downloaded, you can start the entire stack.

### Option A: Using the Orchestrator Script (Recommended)
We provide a Python script that boots the Next.js dev server, the Python ingestion pipelines, and the internal Bug Reporter simultaneously.
```bash
# Ensure your virtual environment is active
python run_all.py
```
* **Frontend:** `http://localhost:3000`
* **Bug Reporter:** `http://localhost:8099`

*(Troubleshooting: If VS Code throws an `EPERM` error on `.next/trace`, it means `run_all.py` is already running in another terminal. Terminate it to release the file lock).*

### Option B: Running via Docker Compose
If you prefer not to manage Node/Python environments natively, you can run the entire stack inside Docker.
1. Ensure Docker Desktop is running.
2. From the project root, build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. Docker will automatically provision the Node container, the Python backend container, and a local PostgreSQL container.

---

## 6. Core Data Structures & Feature Definitions

To power the analytics dashboards, your database must adhere to the following schemas:

### 1. Medical Control Tower (Operational Telemetry)
*   **`warehouse_id`** (String, Primary Key): Unique identifier (e.g., `WH-REG-001`).
*   **`status`** (Enum: `NORMAL`, `WARNING`, `CRITICAL`): Current operational health.
*   **`active_alerts`** (Integer): Number of unresolved supply chain disruptions.
*   **`utilization_rate`** (Float): Percentage of warehouse capacity (0.0 - 1.0).

### 2. Medicine Inventory (Stock Intelligence)
*   **`sku_id`** (String, Indexed): Identifier for the medical product (e.g., vaccine batch).
*   **`current_stock`** (Integer): Exact count of available units.
*   **`expiry_date`** (Date): Scheduled expiration to trigger automated redistribution.
*   **`storage_temp_celsius`** (Float): IoT sensor data for cold-chain monitoring.

### 3. Demand Forecasting (Predictive Models)
*   **`region_id`** (String): Geographic identifier.
*   **`disease_vector_index`** (Float): SHAP-based epidemiology score predicting outbreaks.
*   **`predicted_shortage_probability`** (Float: 0.0 - 1.0): AI-calculated risk of regional exhaustion.

### 4. Supply Redistribution (Optimization)
*   **`source_node`** / **`destination_node`** (String): Origin and Target warehouse IDs.
*   **`transfer_quantity`** (Integer): Recommended units to shift.
*   **`approval_status`** (Enum: `PENDING`, `APPROVED`, `EXECUTED`).

---

## 7. Production Deployment Guide

### Deploying the Frontend (Vercel)
1. Commit your code to GitHub.
2. In Vercel, import the repository and set the **Root Directory** to `apps/web`.
3. Framework Preset: **Next.js**.
4. Build Command: `next build`.
5. Add any environment variables (`NEXT_PUBLIC_API_URL`).
6. Click **Deploy**.

### Deploying the Backend (Google Cloud Run / AWS ECS)
1. Containerize the Python microservices using the provided `Dockerfile`.
2. Build the Docker image:
   ```bash
   docker build -t medical-supply-backend -f Dockerfile.backend .
   ```
3. Push to a container registry (e.g., Google Artifact Registry):
   ```bash
   docker tag medical-supply-backend gcr.io/your-project-id/backend:latest
   docker push gcr.io/your-project-id/backend:latest
   ```
4. Deploy the image to Cloud Run or AWS ECS, ensuring you allocate sufficient memory (at least 2GB) and set the required database environment variables.
