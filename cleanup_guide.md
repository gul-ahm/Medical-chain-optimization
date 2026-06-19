# Project Cleanup & Deletion Guide

This document lists the files and directories that can be safely deleted if you want to clean or reset the project directory.

---

## 1. Safely Deletion-Safe Directories (Can be Re-generated)

| File / Folder Name | Description / Role | Re-generation / Recovery Method |
| :--- | :--- | :--- |
| **`.venv/`** | Python Virtual Environment. | Can be rebuilt by running `python -m venv .venv` and installing dependencies via `pip install -r requirements.txt`. |
| **`node_modules/`** (inside JS apps) | Node.js modules for the frontend. | Run `npm install` inside the respective frontend app folder. |
| **`testsprite_tests/`** | Auto-generated backend/frontend test scripts. | If you delete them, you can recreate them if you have test suite backup templates. |
| **`NorthwindData/`** & **`NorthwindData.zip`** | Raw database files and zip. | Extracted from original assets or downloaded from datasource. |
| **`generated_medical_datasets/`** | Generated mock medical datasets. | Re-seeded using mock generation scripts. |
| **`logs/`** | System runtime logs. | Automatically re-created by backend servers on start. |
| **`scratch/`** | Temporary playground/scratch directory. | None needed (contains temporary scripts). |

---

## 2. Safely Deletion-Safe Files (Can be Re-generated)

| File Name | Description / Role | Recovery Method |
| :--- | :--- | :--- |
| **`supply_chain.db`** (and `-shm`, `-wal`) | SQLite Database storing active state. | Re-run setup/ingestion scripts to re-generate the database. |
| **`verify_summary.json`** | Cached verification checklist summary. | Re-generated on the next verification check. |
| **`ingestion_log.txt`** | Log of the ingestion workflow. | Automatically created on next ingestion run. |
| **`profiler_output_utf8.json`** | JSON output from performance profilers. | Run profiler tools again to re-generate. |

---

## 3. Redundant / Draft Documents (Safe to Delete permanently)

The following markdown files are working drafts, tracebacks, or consolidated reports that are no longer active for production:

* **`error_log.md`** & **`error.md`** (Legacy crash logs and error trace dumps)
* **`CONSOLIDATED_ALL_MARKDOWN.md`** (Consolidated index of markdown files)
* **`final2.md`** & **`work.md`** (Working draft files)
* **`project_details.md`** & **`product_specification.md`** (Draft platform specs)
* **`PRD_New.md`** (Draft requirements specifications)
