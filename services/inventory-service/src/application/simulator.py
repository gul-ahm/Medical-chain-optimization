import asyncio
import random
import json
import logging
from datetime import datetime
from .broadcaster import broadcaster

logger = logging.getLogger(__name__)

MEDICINES = [
    {"sku": "SKU-1001", "name": "Amoxicillin 500mg", "category": "Antibiotics"},
    {"sku": "SKU-1002", "name": "Insulin Glargine", "category": "Insulins"},
    {"sku": "SKU-1003", "name": "Paracetamol 500mg", "category": "Analgesics"},
    {"sku": "SKU-1004", "name": "Ceftriaxone 1g", "category": "Antibiotics"},
    {"sku": "SKU-1005", "name": "Salbutamol Inhaler", "category": "Respiratory"},
    {"sku": "SKU-2001", "name": "Vaccine Batch #04", "category": "Vaccines"},
]

LOCATIONS = ["Central Cold Storage", "Regional Hub B", "City Pharmacy #4", "Hospital Center"]

async def run_medical_simulator():
    """Background task that pushes realistic medical supply events to the broadcaster."""
    logger.info("Medical Supply Simulator Started")
    
    while True:
        try:
            # 1. Random Stock Movement
            med = random.choice(MEDICINES)
            loc = random.choice(LOCATIONS)
            qty = random.randint(50, 500)
            m_type = random.choice(["inbound", "outbound"])
            
            movement_payload = {
                "sku": med["sku"],
                "name": med["name"],
                "quantity": qty,
                "type": m_type,
                "location": loc,
                "timestamp": datetime.utcnow().isoformat(),
                "domain": "inventory"
            }
            await broadcaster.publish("stock_update", movement_payload)
            
            # 2. Occasional Critical Alert (1 in 5 chance)
            if random.random() < 0.2:
                alert_type = random.choice(["shortage", "expiry", "cold_chain"])
                severity = "critical" if alert_type != "cold_chain" else "warning"
                
                messages = {
                    "shortage": f"Critical Stock: {med['name']} below safety threshold in {loc}",
                    "expiry": f"Expiry Risk: Batch of {med['name']} in {loc} expires in {random.randint(3, 10)} days",
                    "cold_chain": f"Cold-Chain Anomaly: Temp variance (+0.5C) in {loc} for {med['name']}"
                }
                
                alert_payload = {
                    "id": str(random.randint(1000, 9999)),
                    "severity": severity,
                    "message": messages[alert_type],
                    "domain": "inventory",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await broadcaster.publish("alert", alert_payload)

            # 3. KPI Update for Control Tower (1 in 10 chance)
            if random.random() < 0.1:
                kpi_payload = {
                    "domain": "executive",
                    "payload": {
                        "shortage_prevention": round(random.uniform(96.0, 99.5), 1),
                        "forecast_accuracy": round(random.uniform(92.0, 95.0), 1),
                        "critical_shortages": random.randint(5, 20),
                        "clinical_readiness": round(random.uniform(88.0, 94.0), 1)
                    }
                }
                await broadcaster.publish("kpi_update", kpi_payload)

            # Sleep between events
            await asyncio.sleep(random.uniform(3.0, 7.0))
            
        except Exception as e:
            logger.error(f"Simulator Error: {e}")
            await asyncio.sleep(5)
