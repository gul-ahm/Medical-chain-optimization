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
