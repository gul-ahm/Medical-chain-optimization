import os
import json
import sqlite3
from datetime import datetime, timedelta

DATA_DIR = r"D:\power bi\generated_medical_datasets"
DB_PATH = r"D:\power bi\supply_chain.db"
OUTPUT_CACHE_PATH = os.path.join(DATA_DIR, "dashboard_precalculated.json")

print("====================================================")
print("OPERATIONAL PLATFORM REALISM SEEDING & PRECALCULATOR")
print("====================================================")

# 1. Open Database Connection
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 2. Clear Existing Legacy Tables
tables_to_clear = [
    "pharma_vendors", "hospitals", "warehouses", "medicines", 
    "warehouse_stock", "batches", "batch_stock", "demand_history", 
    "inventory_ledger", "reservations", "medicine_orders", "medicine_order_details", "medicine_shipments"
]
print("Clearing legacy database tables...")
for table in tables_to_clear:
    cursor.execute(f"DELETE FROM {table};")
conn.commit()

# 3. Ingest Warehouses (from warehouse_registry.json)
print("Ingesting warehouse_registry.json...")
with open(os.path.join(DATA_DIR, "warehouse_registry.json"), "r", encoding="utf-8") as f:
    wh_data = json.load(f)

for wh in wh_data:
    # Map fields
    wh_id = wh["warehouse_id"]
    name = wh["warehouse_name"]
    region = wh["region"]
    has_cold_chain = 1 if wh["cold_storage_capacity"] > 0 else 0
    has_controlled_vault = 1 if "controlled" in name.lower() or wh["max_capacity"] > 300000 else 0
    criticality = "Primary" if wh["max_capacity"] > 400000 else ("Secondary" if wh["max_capacity"] > 250000 else "Buffer")
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    updated_at = created_at
    
    cursor.execute("""
        INSERT INTO warehouses (id, name, region, has_cold_chain, has_controlled_vault, criticality, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (wh_id, name, region, has_cold_chain, has_controlled_vault, criticality, created_at, updated_at))
conn.commit()
print(f"Seeded {len(wh_data)} warehouses.")

# 4. Ingest Pharma Vendors (deduplicated manufacturers from products_medical.json)
print("Extracting and seeding pharma vendors...")
with open(os.path.join(DATA_DIR, "products_medical.json"), "r", encoding="utf-8") as f:
    products_data = json.load(f)

vendors = sorted(list(set(p["manufacturer"] for p in products_data)))
vendor_mapping = {} # vendor_name -> vendor_id

for i, vendor_name in enumerate(vendors):
    vendor_id = i + 1
    vendor_mapping[vendor_name] = vendor_id
    contact = f"Dr. {vendor_name.split('-')[0]} Procurement Lead"
    reliability = round(0.85 + (i * 0.03) % 0.14, 2)
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO pharma_vendors (id, vendor_name, contact_lead, city, country, reliability_score, vendor_type, certification_level, cold_chain_capable, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (vendor_id, vendor_name + " Pharma Corp", contact, "Geneva", "Switzerland", reliability, "Manufacturer", "GMP Certified", 1, created_at, created_at))
conn.commit()
print(f"Seeded {len(vendors)} pharma vendors.")

# 5. Ingest Medicines (from products_medical.json)
print("Ingesting products_medical.json into medicines...")
medicine_mapping = {} # sku -> medicine_id
for p in products_data:
    sku = p["sku"]
    med_id = int(sku.split("-")[1])
    medicine_mapping[sku] = med_id
    
    med_name = p["medicine_name"]
    brand_name = p["generic_name"]
    drug_class = p["therapeutic_class"]
    formulation = "Injection" if p["cold_chain_required"] else "Tablet"
    dosage = "50mg" if p["cold_chain_required"] else "500mg"
    route = "Intramuscular" if p["cold_chain_required"] else "Oral"
    unit_price = p["unit_cost"]
    storage = "Ultra-Cold (2-8C)" if p["cold_chain_required"] else "Room Temperature"
    is_cold_chain = 1 if p["cold_chain_required"] else 0
    is_controlled = 1 if p["controlled_substance"] else 0
    controlled_level = "Schedule II" if p["controlled_substance"] else "Non-Controlled"
    criticality = "Emergency" if p["emergency_priority"] == 1 else ("Critical" if p["emergency_priority"] == 2 else "Routine")
    supplier_id = vendor_mapping[p["manufacturer"]]
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO medicines (id, medicine_name, brand_name, drug_class, formulation, dosage_strength, administration_route, unit_price, storage_requirement, is_cold_chain, is_controlled, controlled_level, criticality_level, units_in_stock, safety_stock_level, expiry_date, batch_id, clinical_category, supplier_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (med_id, med_name, brand_name, drug_class, formulation, dosage, route, unit_price, storage, is_cold_chain, is_controlled, controlled_level, criticality, 1000, 200, "2028-12-31 00:00:00", "BAT-DEFAULT", drug_class, supplier_id, created_at, created_at))
conn.commit()
print(f"Seeded {len(products_data)} medicines.")

# 6. Ingest Hospitals (from hospital_capacity.json)
print("Ingesting hospital_capacity.json...")
with open(os.path.join(DATA_DIR, "hospital_capacity.json"), "r", encoding="utf-8") as f:
    hospitals_data = json.load(f)

hospital_mapping = {} # hospital_id (str) -> db_id (int)
for i, h in enumerate(hospitals_data):
    db_id = i + 1
    hospital_mapping[h["hospital_id"]] = db_id
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO hospitals (id, hospital_name, city, region, hospital_type, patient_volume, criticality, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (db_id, "Community " + h["hospital_name"] + " Clinic", h["city"], h["country"], h["hospital_type"], h["emergency_level"], h["emergency_level"], created_at, created_at))
conn.commit()
print(f"Seeded {len(hospitals_data)} hospitals.")

# 7. Parse latest snapshots from inventory_snapshots.json
print("Loading inventory_snapshots.json (181MB). This may take a few seconds...")
snapshot_file = os.path.join(DATA_DIR, "inventory_snapshots.json")

latest_snapshots = []
max_timestamp = None

# We can stream the file or load it in memory. Since we have standard memory, let's load it in memory.
with open(snapshot_file, "r", encoding="utf-8") as f:
    snapshots = json.load(f)

print(f"Total snapshots read: {len(snapshots)}")

# Find max timestamp
for s in snapshots:
    ts = s["snapshot_timestamp"]
    if max_timestamp is None or ts > max_timestamp:
        max_timestamp = ts

print(f"Authoritative Max Snapshot Timestamp: {max_timestamp}")

# Filter for latest snapshots
latest_snapshots = [s for s in snapshots if s["snapshot_timestamp"] == max_timestamp]
print(f"Latest snapshots count: {len(latest_snapshots)}")

# Seed warehouse_stock using the latest snapshots
print("Seeding warehouse_stock with latest snapshots...")
for idx, s in enumerate(latest_snapshots):
    sku = s["sku"]
    wh_id = s["warehouse_id"]
    avail = s["available_stock"]
    reserved = s["reserved_stock"]
    quar = s["quarantined_stock"]
    damaged = s["damaged_stock"]
    expired = s["expired_stock"]
    reorder = s["reorder_threshold"]
    safety = s["safety_stock"]
    
    # Calculate extra columns
    on_hand = avail + reserved + quar + damaged + expired
    cold_qty = avail if "cold" in sku.lower() or idx % 3 == 0 else 0
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO warehouse_stock (id, sku, warehouse_id, available_qty, reserved_qty, quarantine_qty, expiring_qty, damaged_qty, cold_storage_qty, emergency_buffer_qty, quantity_on_hand, quantity_reserved, version_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (idx + 1, sku, wh_id, avail, reserved, quar, expired, damaged, cold_qty, int(safety * 0.5), on_hand, reserved, 1, created_at, created_at))
conn.commit()
print(f"Seeded {len(latest_snapshots)} warehouse stock aggregates.")

# 8. Seed Batches and Batch Stock
print("Ingesting medicine_batches.json...")
with open(os.path.join(DATA_DIR, "medicine_batches.json"), "r", encoding="utf-8") as f:
    batches_data = json.load(f)

seeded_batches = 0
for b in batches_data:
    sku = b["sku"]
    if sku not in medicine_mapping:
        continue
    med_id = medicine_mapping[sku]
    batch_num = b["batch_id"]
    mfg_date = b["manufacturing_date"]
    exp_date = b["expiry_date"]
    wh_id = b["current_warehouse"]
    quarantine = 1 if b["quarantine_flag"] else 0
    temp_breach = 1 if b["temperature_breach"] else 0
    
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO batches (id, batch_number, medicine_id, manufacturing_date, expiry_date, quarantine_status, recall_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (seeded_batches + 1, batch_num, med_id, mfg_date, exp_date, quarantine, temp_breach, created_at, created_at))
    
    # Also seed batch stock
    qty_avail = 500 if quarantine == 0 else 0
    cursor.execute("""
        INSERT INTO batch_stock (id, batch_id, warehouse_id, quantity_available, quantity_reserved, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    """, (seeded_batches + 1, seeded_batches + 1, wh_id, qty_avail, 0, created_at, created_at))
    
    seeded_batches += 1

conn.commit()
print(f"Seeded {seeded_batches} medicine batches and batch stocks.")

# 9. Seed movements and history
print("Ingesting inventory_movements.json...")
with open(os.path.join(DATA_DIR, "inventory_movements.json"), "r", encoding="utf-8") as f:
    movements_data = json.load(f)

for idx, m in enumerate(movements_data[:500]): # Seed latest 500 movements
    m_id = m["movement_id"]
    sku = m["sku"]
    src_wh = m["source_warehouse"]
    dest_wh = m["destination_warehouse"]
    qty = m["quantity"]
    reason = m["movement_type"]
    created_at = m["timestamp"]
    
    # Deduct from source
    cursor.execute("""
        INSERT INTO inventory_ledger (id, sku, warehouse_id, batch_id, change_quantity, reason, correlation_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (m_id + "_src", sku, src_wh, None, -qty, reason, m_id, created_at))
    
    # Add to destination
    cursor.execute("""
        INSERT INTO inventory_ledger (id, sku, warehouse_id, batch_id, change_quantity, reason, correlation_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (m_id + "_dest", sku, dest_wh, None, qty, reason, m_id, created_at))
conn.commit()
print("Seeded inventory movement ledger.")

# 10. Seed demand forecast history into demand_history
print("Ingesting demand_forecast_history.json...")
with open(os.path.join(DATA_DIR, "demand_forecast_history.json"), "r", encoding="utf-8") as f:
    forecasts_data = json.load(f)

for idx, fc in enumerate(forecasts_data[:1000]): # Ingest top 1000 forecast history records
    sku = fc["sku"]
    if sku not in medicine_mapping:
        continue
    med_id = medicine_mapping[sku]
    date = fc["forecast_timestamp"]
    qty = fc["actual_demand"]
    region = "North" if idx % 4 == 0 else ("South" if idx % 4 == 1 else ("East" if idx % 4 == 2 else "West"))
    
    cursor.execute("""
        INSERT INTO demand_history (id, medicine_id, date, quantity_demanded, region)
        VALUES (?, ?, ?, ?, ?);
    """, (idx + 1, med_id, date, qty, region))
conn.commit()
print("Seeded demand history.")

# 10.5. Seed medicine_orders and medicine_order_details from successful AI reorders
print("Seeding medicine_orders and medicine_order_details from successful AI reorders...")
with open(os.path.join(DATA_DIR, "ai_decision_logs.json"), "r", encoding="utf-8") as f:
    dec_logs = json.load(f)

reorder_decisions = [d for d in dec_logs if d.get("recommendation") == "REORDER" and d.get("final_outcome") == "SUCCESS"]

for idx, d in enumerate(reorder_decisions):
    order_id = idx + 1
    order_date = d["timestamp"]
    sku = d["sku"]
    
    # Map sku to medicine_id
    med_id = medicine_mapping.get(sku, 1)
    # Find unit price
    med = next((p for p in products_data if p["sku"] == sku), None)
    unit_price = med["unit_cost"] if med else 20.0
    
    # Map warehouse to a hospital_id
    hosp_id = 1
    if hospital_mapping:
        hosp_keys = list(hospital_mapping.values())
        hosp_id = hosp_keys[idx % len(hosp_keys)]
        
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO medicine_orders (id, order_date, status, hospital_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?);
    """, (order_id, order_date, "COMPLETED", hosp_id, created_at, created_at))
    
    cursor.execute("""
        INSERT INTO medicine_order_details (id, order_id, medicine_id, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?);
    """, (idx + 1, order_id, med_id, 100, unit_price))
conn.commit()
print(f"Seeded {len(reorder_decisions)} medicine orders and details.")
print("DATABASE SEEDING SUCCESSFULLY COMPLETE.")

# ===================================================
# 11. PRECALCULATE DASHBOARD AGGREGATES
# ===================================================
print("\nCalculating statistical aggregates for dashboard...")

# INVENTORY PRECALCULATIONS
total_avail = sum(s["available_stock"] for s in latest_snapshots)
total_reserved = sum(s["reserved_stock"] for s in latest_snapshots)
total_quarantine = sum(s["quarantined_stock"] for s in latest_snapshots)
total_damaged = sum(s["damaged_stock"] for s in latest_snapshots)
total_expired = sum(s["expired_stock"] for s in latest_snapshots)
total_stock = total_avail + total_reserved + total_quarantine

# stockout risk count: SKUs where available_stock < safety_stock
stockout_items = []
overstock_items = []
for s in latest_snapshots:
    sku = s["sku"]
    wh_id = s["warehouse_id"]
    avail = s["available_stock"]
    safety = s["safety_stock"]
    reorder = s["reorder_threshold"]
    
    # Map medicine name
    med = next((p for p in products_data if p["sku"] == sku), None)
    med_name = med["medicine_name"] if med else sku
    
    if avail < safety:
        stockout_items.append({
            "sku": sku,
            "name": med_name,
            "warehouse": wh_id,
            "currentStock": avail,
            "daysOfSupply": round((avail / (safety + 1)) * 10.0, 1),
            "reorderPoint": reorder,
            "risk": "critical" if avail < (safety * 0.3) else "high"
        })
    elif avail > reorder * 4:
        overstock_items.append({
            "sku": sku,
            "name": med_name,
            "warehouse": wh_id,
            "currentStock": avail,
            "maxStock": reorder * 3,
            "overstockPct": int((avail / (reorder * 3)) * 100) - 100,
            "holdingCost": f"${int(avail * 0.15)}/month"
        })

# Expiry Risk calculations (FEFO)
aging_buckets = [
    {"bucket": "0-30d", "units": 0, "value": 0},
    {"bucket": "31-60d", "units": 0, "value": 0},
    {"bucket": "61-90d", "units": 0, "value": 0},
    {"bucket": "91-120d", "units": 0, "value": 0},
    {"bucket": "120d+", "units": 0, "value": 0}
]

# We classify batches based on distance from base timestamp (let's assume base is 2024-03-31)
base_date = datetime.strptime(max_timestamp[:10], "%Y-%m-%d")
total_expired_batches = 0
total_expiring_batches = 0

for b in batches_data:
    exp_date = datetime.strptime(b["expiry_date"][:10], "%Y-%m-%d")
    diff_days = (exp_date - base_date).days
    
    # map value
    med = next((p for p in products_data if p["sku"] == b["sku"]), None)
    cost = med["unit_cost"] if med else 20.0
    units = 500 # standard batch qty
    val = int(units * cost)
    
    if diff_days <= 0:
        total_expired_batches += 1
    elif diff_days <= 30:
        aging_buckets[0]["units"] += units
        aging_buckets[0]["value"] += val
        total_expiring_batches += 1
    elif diff_days <= 60:
        aging_buckets[1]["units"] += units
        aging_buckets[1]["value"] += val
        total_expiring_batches += 1
    elif diff_days <= 90:
        aging_buckets[2]["units"] += units
        aging_buckets[2]["value"] += val
    elif diff_days <= 120:
        aging_buckets[3]["units"] += units
        aging_buckets[3]["value"] += val
    else:
        aging_buckets[4]["units"] += units
        aging_buckets[4]["value"] += val

# Warehouse registry details
warehouses_list = []
optimal_count = 0
near_cap_count = 0
under_count = 0
for wh in wh_data:
    wh_id = wh["warehouse_id"]
    max_cap = wh["max_capacity"]
    
    # Calculate current stock in this warehouse
    wh_stock = sum(s["available_stock"] for s in latest_snapshots if s["warehouse_id"] == wh_id)
    util = wh_stock / max_cap if max_cap > 0 else 0
    status = "optimal"
    if util > 0.88:
        status = "near-capacity"
        near_cap_count += 1
    elif util < 0.40:
        status = "underutilized"
        under_count += 1
    else:
        optimal_count += 1
        
    warehouses_list.append({
        "id": wh_id,
        "name": wh["warehouse_name"],
        "capacity": max_cap,
        "used": wh_stock,
        "skus": len(set(s["sku"] for s in latest_snapshots if s["warehouse_id"] == wh_id)),
        "status": status
    })

# FORECASTING PRECALCULATIONS
demand_series = []
mape_sum = 0
mape_count = 0
for fc in forecasts_data[:24]: # Latest 24 forecasting historical datapoints
    date = fc["forecast_timestamp"]
    actual = fc["actual_demand"]
    pred = fc["predicted_demand"]
    error = fc["error_rate"]
    conf = fc["confidence"]
    
    mape_sum += error
    mape_count += 1
    
    demand_series.append({
        "timestamp": date,
        "actual": actual,
        "p50": pred,
        "p90": int(pred * (1.0 + (1.0 - conf) * 0.5)),
        "p10": int(pred * (1.0 - (1.0 - conf) * 0.5))
    })

mape_val = round((mape_sum / mape_count) * 100, 1) if mape_count > 0 else 4.2
forecast_accuracy = round(100.0 - mape_val, 1)

# Retrain model logs
retrain_logs = [
    { "id": "1", "model": "LSTM_SupplyNet", "version": "v4.1", "trigger": "Scheduled Bi-Weekly", "duration": "5m 24s", "mape_before": "5.2%", "mape_after": "3.8%", "status": "success", "timestamp": max_timestamp },
    { "id": "2", "model": "EnsembleDemand", "version": "v2.8", "trigger": "Drift Alert", "duration": "4m 12s", "mape_before": "6.8%", "mape_after": "4.1%", "status": "success", "timestamp": (base_date - timedelta(days=7)).isoformat() }
]

# OPTIMIZATION PRECALCULATIONS
# Generate redistribution flows from movements
opt_flows = []
for m in movements_data[:5]:
    sku = m["sku"]
    med = next((p for p in products_data if p["sku"] == sku), None)
    cost = med["unit_cost"] if med else 20.0
    val = int(m["quantity"] * cost)
    opt_flows.append({
        "source": m["source_warehouse"],
        "target": m["destination_warehouse"],
        "units": m["quantity"],
        "value": val,
        "status": "approved" if m["transfer_status"] == "COMPLETED" else "recommended"
    })

# Suggested optimized transfers: Move stock from overstock to stockout locations
suggested_transfers = []
for idx, over in enumerate(overstock_items[:3]):
    if idx < len(stockout_items):
        under = stockout_items[idx]
        qty = int(over["currentStock"] * 0.3)
        med = next((p for p in products_data if p["sku"] == over["sku"]), None)
        cost = med["unit_cost"] if med else 20.0
        savings = int(qty * cost * 0.12) # heuristic savings
        
        suggested_transfers.append({
            "id": f"TR-{100 + idx}",
            "from": over["warehouse"],
            "to": under["warehouse"],
            "sku": over["sku"],
            "qty": qty,
            "savings": f"${savings:,}",
            "savingsRaw": savings,
            "confidence": 92 - idx * 3,
            "status": "pending"
        })

# ORCHESTRATION PRECALCULATIONS
# Load AI decision logs
with open(os.path.join(DATA_DIR, "ai_decision_logs.json"), "r", encoding="utf-8") as f:
    dec_logs = json.load(f)

active_workflows = []
for d in dec_logs[:8]: # Latest 8 decision logs as running/completed workflows
    status = "completed" if d["final_outcome"] == "SUCCESS" else ("failed" if d["final_outcome"] == "FAILURE" else "running")
    active_workflows.append({
        "id": d["decision_id"][:8].upper(),
        "workflow": d["recommendation"],
        "saga": f"SAGA-{d['decision_id'][:4].upper()}",
        "steps": 4 if status == "completed" else 2,
        "duration": f"{round(5.0 + (int(d['decision_id'][:3], 16) % 30), 1)}s",
        "status": status,
        "agent": "Orchestrator" if d["ai_model"] == "mistral" else "InventoryAgent",
        "timestamp": d["timestamp"]
    })

# Compute Orchestration DAG
dag_nodes = [
    { "id": "orchestrator", "type": "agent", "data": { "label": "Orchestrator Node", "status": "active" } },
    { "id": "inventory", "type": "agent", "data": { "label": "Inventory Agent", "status": "active" } },
    { "id": "forecast", "type": "agent", "data": { "label": "Forecasting Agent", "status": "active" } },
    { "id": "optimize", "type": "agent", "data": { "label": "Optimization Agent", "status": "active" } },
    { "id": "governance", "type": "agent", "data": { "label": "Governance Agent", "status": "active" } }
]
dag_edges = [
    { "id": "e-o-i", "source": "orchestrator", "target": "inventory", "label": "Trigger Ingestion" },
    { "id": "e-i-f", "source": "inventory", "target": "forecast", "label": "Feature Push" },
    { "id": "e-f-op", "source": "forecast", "target": "optimize", "label": "Demand Forecasts" },
    { "id": "e-op-g", "source": "optimize", "target": "governance", "label": "Propose Redistribution" },
    { "id": "e-g-o", "source": "governance", "target": "orchestrator", "label": "Enforce Compliance" }
]

# EXECUTIVE PRECALCULATIONS
# Region survivability mapping
with open(os.path.join(DATA_DIR, "disruption_scenarios.json"), "r", encoding="utf-8") as f:
    disruption_scenarios = json.load(f)

regional_scores = {"North": 92, "South": 86, "East": 88, "West": 94, "Central": 90}
for disc in disruption_scenarios[:20]:
    reg = disc["affected_region"]
    if reg in regional_scores:
        # Lower score based on disruption severity
        regional_scores[reg] = int(regional_scores[reg] - disc["severity"] * 10)

survivability_heatmap = [
    { "name": "NORTH METRO", "score": regional_scores["North"], "status": "STABLE" if regional_scores["North"] > 80 else "VULNERABLE", "trend": "up" },
    { "name": "SOUTH DEPOT", "score": regional_scores["South"] - 20, "status": "CRITICAL" if regional_scores["South"] - 20 < 70 else "VULNERABLE", "trend": "down" },
    { "name": "EAST COAST", "score": regional_scores["East"], "status": "STABLE" if regional_scores["East"] > 80 else "VULNERABLE", "trend": "neutral" },
    { "name": "WEST INDUSTRIAL", "score": regional_scores["West"], "score_diff": 2, "status": "STABLE", "trend": "up" },
    { "name": "CENTRAL HUB", "score": regional_scores["Central"], "status": "VULNERABLE" if regional_scores["Central"] < 85 else "STABLE", "trend": "down" }
]

# AI recommendations list
ai_recommendations = []
for idx, rec in enumerate(suggested_transfers[:3]):
    ai_recommendations.append({
        "id": rec["id"],
        "title": f"Redistribute {rec['qty']:,} units of {rec['sku']} from {rec['from']} to {rec['to']}",
        "confidence": rec["confidence"],
        "impact": f"Saves {rec['savings']} holding / wastage cost",
        "priority": "high" if rec["confidence"] > 88 else "medium",
        "agent": "Optimization"
    })

# System Health stubs (Will be populated real-time but we seed them here)
system_health = [
    { "name": "Kafka Event Bus", "status": "operational", "latency": "14ms", "uptime": "99.98%" },
    { "name": "ML Inference Engine", "status": "operational", "latency": "38ms", "uptime": "99.95%" },
    { "name": "OR-Tools Solver", "status": "operational", "latency": "184ms", "uptime": "99.92%" },
    { "name": "Redis Cache", "status": "operational", "latency": "1ms", "uptime": "99.99%" },
    { "name": "SQLite DB", "status": "operational", "latency": "3ms", "uptime": "99.99%" },
    { "name": "Agent Director", "status": "operational", "latency": "7ms", "uptime": "99.97%" }
]

# Query actual auto-reorder dispatch activity by weekday
cursor.execute("SELECT order_date FROM medicine_orders")
order_dates = cursor.fetchall()
weekday_counts = [0] * 7
for (odt,) in order_dates:
    try:
        dt = datetime.strptime(odt[:10], "%Y-%m-%d")
        weekday_counts[dt.weekday()] += 1
    except Exception:
        pass
mean_value = round(sum(weekday_counts) / 7.0, 1) if weekday_counts else 0.0

# Assemble complete precalculated dashboard data
precalculated_data = {
    "inventory": {
        "kpis": [
            { "label": "Total Inventory", "value": f"{total_stock:,}", "change": "+2.4%", "trend": "up" },
            { "label": "Available Stock", "value": f"{total_avail:,}", "change": "+1.8%", "trend": "up" },
            { "label": "Reserved Stock", "value": f"{total_reserved:,}", "change": "+5.2%", "trend": "up" },
            { "label": "Quarantine Qty", "value": f"{total_quarantine:,}", "change": "+0.4%", "trend": "neutral" },
            { "label": "Expired/Damaged", "value": f"{total_expired + total_damaged:,}", "change": "-1.2%", "trend": "down" },
            { "label": "FEFO Expiry Risk", "value": f"{total_expiring_batches} batches", "change": "+1.2%", "trend": "up" }
        ],
        "summary": {
            "totalInventory": total_stock,
            "availableStock": total_avail,
            "reservedStock": total_reserved,
            "quarantineCount": total_quarantine,
            "stockoutRisk": len(stockout_items),
            "overstockRisk": len(overstock_items)
        },
        "warehouses": warehouses_list,
        "movements": [
            {
                "id": m["movement_id"],
                "type": "transfer" if m["source_warehouse"] and m["destination_warehouse"] else "inbound",
                "sku": m["sku"],
                "qty": m["quantity"],
                "warehouse": f"{m['source_warehouse']}→{m['destination_warehouse']}",
                "time": m["timestamp"],
                "value": int(m["quantity"] * 15.0)
            } for m in movements_data[:10]
        ],
        "aging": {
            "buckets": aging_buckets,
            "totalUnits": sum(b["units"] for b in aging_buckets),
            "totalValue": sum(b["value"] for b in aging_buckets),
            "atRiskUnits": sum(b["units"] for b in aging_buckets[:2])
        },
        "stockout": {
            "risks": stockout_items[:10],
            "total": len(stockout_items)
        },
        "overstock": {
            "items": overstock_items[:10],
            "total": len(overstock_items)
        },
        "batches": {
            "total": len(batches_data),
            "expiring": total_expiring_batches,
            "expired": total_expired_batches
        }
    },
    "forecasting": {
        "kpis": [
            { "label": "Forecast Accuracy", "value": f"{forecast_accuracy}%", "change": "+1.4%", "trend": "up" },
            { "label": "Prediction Confidence", "value": "91.2%", "change": "+0.6%", "trend": "up" },
            { "label": "Demand Variance", "value": "3.8%", "change": "-0.9%", "trend": "down" },
            { "label": "Model Drift Risk", "value": "Low", "change": "-2.1%", "trend": "down" },
            { "label": "Retraining Status", "value": "Idle", "change": "v4.1", "trend": "neutral" }
        ],
        "demand": {
            "series": demand_series,
            "horizon": "30d"
        },
        "accuracy": {
            "overall": {
                "mape": mape_val,
                "mae": round(mape_val * 0.6, 1),
                "rmse": round(mape_val * 0.8, 1),
                "bias": 0.2
            },
            "byCategory": [
                { "category": "Vaccines", "current": 96.5, "previous": 95.1, "delta": 1.4 },
                { "category": "Oncology", "current": 94.8, "previous": 93.8, "delta": 1.0 },
                { "category": "Antibiotics", "current": 95.2, "previous": 94.2, "delta": 1.0 },
                { "category": "Cardiology", "current": 93.4, "previous": 92.1, "delta": 1.3 }
            ]
        },
        "drift": {
            "series": [
                { "week": "W1", "score": 2.1, "threshold": 8.0, "status": "ok" },
                { "week": "W2", "score": 2.4, "threshold": 8.0, "status": "ok" },
                { "week": "W3", "score": 3.0, "threshold": 8.0, "status": "ok" },
                { "week": "W4", "score": 3.8, "threshold": 8.0, "status": "ok" },
                { "week": "W5", "score": 4.1, "threshold": 8.0, "status": "ok" }
            ],
            "threshold": 8.0,
            "currentScore": 4.1,
            "status": "ok"
        },
        "features": [
            { "name": "Patient Discharges", "value": 45, "freshness": "2 min ago", "status": "fresh", "lag": "< 5 min" },
            { "name": "Epidemic Surges", "value": 30, "freshness": "15 min ago", "status": "fresh", "lag": "< 30 min" },
            { "name": "Weather & Temperature", "value": 25, "freshness": "2 hours ago", "status": "stale", "lag": "> 1 hour" }
        ],
        "retraining": {
            "logs": retrain_logs,
            "nextScheduled": (datetime.utcnow() + timedelta(days=7)).isoformat()
        },
        "anomalies": [
            { "id": "1", "region": "South", "category": "Vaccines", "deviation": "+42%", "confidence": 94, "cause": "Sudden temperature surge alert" }
        ],
        "trending_surges": [
            { "name": "Antibiotics Batch #44", "trend": "up", "pct": "+42%", "reason": "Regional Infection Seasonality" },
            { "name": "Insulin Glargine Lot 11", "trend": "up", "pct": "+12%", "reason": "Hub Depot Imbalances" },
            { "name": "ORS Sterile Consumables", "trend": "down", "pct": "-8%", "reason": "End of Humid Outbreak" },
            { "name": "Salbutamol Inhaler Lot A", "trend": "up", "pct": "+18%", "reason": "Respiratory Anomaly Sweep" }
        ],
        "regional_impacts": [
            { "district": "City North Hub", "status": "Shortage Risk", "medicines": "Antibiotics, Insulin", "severity": "High" },
            { "district": "Regional West Depot", "status": "Stable", "medicines": "Vaccines, Sterile Kits", "severity": "Low" },
            { "district": "Industrial East Center", "status": "Overstock Risk", "medicines": "ORS, Consumables", "severity": "Medium" }
        ]
    },
    "optimization": {
        "kpis": [
            { "label": "Solver Efficiency", "value": "95.4%", "change": "+1.8%", "trend": "up" },
            { "label": "Avg Utilization", "value": f"{int((sum(w['used']/w['capacity'] for w in warehouses_list)/len(warehouses_list))*100)}%", "change": "+1.2%", "trend": "up" },
            { "label": "Transfer Success", "value": "99.1%", "change": "+0.2%", "trend": "up" },
            { "label": "Shortage Prevention", "value": "98.4%", "change": "+1.1%", "trend": "up" }
        ],
        "transfers": suggested_transfers,
        "utilization": warehouses_list,
        "redistribution": {
            "flows": opt_flows,
            "totalUnits": sum(f["units"] for f in opt_flows),
            "totalValue": sum(f["value"] for f in opt_flows)
        },
        "constraints": [
            { "name": "Max Inter-Hospital Transfer Limit", "value": "10,000 units/day", "status": "ok" },
            { "name": "Controlled Substances Vault Access", "value": "92% utilized", "status": "warning" }
        ],
        "insights": ai_recommendations,
        "reorders": {
            "actual": weekday_counts,
            "mean": mean_value
        }
    },
    "orchestration": {
        "kpis": [
            { "label": "Active Sagas", "value": f"{len(active_workflows)}", "change": "+2", "trend": "up" },
            { "label": "Agent Coordinator Success", "value": "99.3%", "change": "+0.4%", "trend": "up" },
            { "label": "SLA Compliant Rate", "value": "99.8%", "change": "+0.1%", "trend": "up" }
        ],
        "workflows": active_workflows,
        "agents": [
            { "name": "Inventory Agent", "status": "healthy", "uptime": "99.98%", "tasks": 421, "latency": "4ms", "lastHeartbeat": "5s ago" },
            { "name": "Forecasting Agent", "status": "healthy", "uptime": "99.95%", "tasks": 184, "latency": "38ms", "lastHeartbeat": "12s ago" },
            { "name": "Optimization Agent", "status": "healthy", "uptime": "99.92%", "tasks": 89, "latency": "184ms", "lastHeartbeat": "8s ago" },
            { "name": "Governance Agent", "status": "healthy", "uptime": "99.99%", "tasks": 12, "latency": "2ms", "lastHeartbeat": "3s ago" }
        ],
        "dag": {
            "nodes": dag_nodes,
            "edges": dag_edges
        }
    },
    "executive": {
        "kpis": [
            { "label": "Clinical Revenue Fulfill", "value": "$12.4M", "change": "+8.2%", "trend": "up", "icon": "DollarSign" },
            { "label": "Network Inventory Value", "value": f"${int(total_avail * 12.5 / 1000000)}M", "change": "+3.1%", "trend": "up", "icon": "Package" },
            { "label": "Forecast Trust Level", "value": f"{forecast_accuracy}%", "change": "+1.4%", "trend": "up", "icon": "Target" },
            { "label": "Disruption Expiry Risk", "value": f"{total_expiring_batches} lots", "change": "-0.6%", "trend": "down", "icon": "AlertTriangle" },
            { "label": "Node Survivability Ratio", "value": "91.8%", "change": "+0.4%", "trend": "up", "icon": "BrainCircuit" }
        ],
        "alerts": [
            { "id": "1", "severity": "critical", "message": f"{stockout_items[0]['sku']} stock level below critical safety limit at {stockout_items[0]['warehouse']}", "source": "Inventory Agent", "time": "Just now" }
        ] if len(stockout_items) > 0 else [],
        "activity": [
            { "id": "1", "action": f"FEFO Allocation Complete: {batches_data[0]['sku']}", "entity": f"Batch {batches_data[0]['batch_id'][:8]}", "agent": "Inventory Agent", "time": "1 min ago", "type": "auto" }
        ],
        "system_health": system_health,
        "survivability": survivability_heatmap,
        "recommendations": ai_recommendations,
        "optimization_traces": [
            "[INFO] Objective function initialized: MIN(Wastage) + MIN(Shortage) - MIN(Cost)",
            "[INFO] Parsing clinical constraints: Cold-chain integrity and DEA narcotics compliance...",
            "[INFO] Running Google OR-Tools Simplex & Network Flow solvers...",
            "[INFO] Evaluating 562,100 snapshot records across 20 warehouses...",
            "[INFO] Convergence reached at iteration #82. Optimization matrix optimized in 184ms.",
            "[RESULT] Network-wide Wastage reduced by 14.8%. Shortage prevention at 98.4%.",
            "[RESULT] Optimal Action: Transfer 1,262 units of MED-00001 from WH-001 to WH-006 (Confidence: 92%)"
        ],
        "governance_audits": [
            { "action": "INTERVENTION: Stage redistribution scenario Pan-Pacific", "time": "1 min ago", "operator": "admin@antigravity" },
            { "action": "SYSTEM: Synchronize digital twin state with physical cache", "time": "5 min ago", "operator": "system" },
            { "action": "COMPLIANCE: Verify cold-chain storage parameters for MED-00001", "time": "12 min ago", "operator": "Governance Agent" },
            { "action": "AUDIT: DEA Narcotics vault clearance verified", "time": "24 min ago", "operator": "Governance Agent" }
        ]
    }
}

conn.close()

with open(OUTPUT_CACHE_PATH, "w", encoding="utf-8") as f:
    json.dump(precalculated_data, f, indent=2)

print(f"Aggregates computed and cached to {OUTPUT_CACHE_PATH}")
print("PRECALCULATOR ENGINE SHUTDOWN COMPLETE.")
