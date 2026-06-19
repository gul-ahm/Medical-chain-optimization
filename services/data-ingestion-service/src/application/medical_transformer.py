import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List

class MedicalTransformer:
    # --- MEDICAL TAXONOMY ENGINE ---
    
    DRUG_TAXONOMY = {
        "Antibiotics": {
            "categories": ["Penicillins", "Fluoroquinolones", "Macrolides"],
            "meds": [
                {"generic": "Amoxicillin", "brands": ["Amoxil", "Moxatag"], "forms": ["Tablet", "Capsule"], "routes": ["Oral"], "storage": "Room Temp", "cold_chain": False},
                {"generic": "Ciprofloxacin", "brands": ["Cipro"], "forms": ["Tablet", "Injection"], "routes": ["Oral", "IV"], "storage": "Room Temp", "cold_chain": False},
                {"generic": "Azithromycin", "brands": ["Zithromax"], "forms": ["Tablet", "Suspension"], "routes": ["Oral"], "storage": "Room Temp", "cold_chain": False}
            ]
        },
        "Antidiabetics": {
            "categories": ["Insulins", "Biguanides"],
            "meds": [
                {"generic": "Metformin", "brands": ["Glucophage"], "forms": ["Tablet"], "routes": ["Oral"], "storage": "Room Temp", "cold_chain": False},
                {"generic": "Insulin Glargine", "brands": ["Lantus", "Basaglar"], "forms": ["Injection"], "routes": ["Subcutaneous"], "storage": "Refrigerated", "cold_chain": True}
            ]
        },
        "Cytotoxics": {
            "categories": ["Alkylating Agents", "Antimetabolites"],
            "meds": [
                {"generic": "Cyclophosphamide", "brands": ["Cytoxan"], "forms": ["Injection", "Tablet"], "routes": ["IV", "Oral"], "storage": "Room Temp", "cold_chain": False},
                {"generic": "Methotrexate", "brands": ["Trexall"], "forms": ["Tablet", "Injection"], "routes": ["Oral", "IM"], "storage": "Room Temp", "cold_chain": False}
            ]
        },
        "Vaccines": {
            "categories": ["Viral", "Bacterial"],
            "meds": [
                {"generic": "Influenza Vaccine", "brands": ["Fluarix", "Fluzone"], "forms": ["Injection"], "routes": ["IM"], "storage": "Ultra-Cold", "cold_chain": True},
                {"generic": "BCG Vaccine", "brands": ["Tice BCG"], "forms": ["Injection"], "routes": ["Intradermal"], "storage": "Refrigerated", "cold_chain": True}
            ]
        }
    }

    HOSPITAL_PREFIXES = ["St.", "General", "Regional", "Community", "Mercy", "University"]
    HOSPITAL_SUFFIXES = ["Medical Center", "Memorial Hospital", "Health System", "Clinic", "Surgery Center"]
    
    PHARMACY_CHAINS = ["CVS Pharmacy", "Walgreens", "Rite Aid", "Walmart Pharmacy", "HealthMart"]

    @classmethod
    def transform_product(cls, raw_product: Dict[str, Any]) -> Dict[str, Any]:
        product_name = raw_product.get("ProductName", "Generic Medicine")
        seed = hash(product_name)
        random.seed(seed)
        
        # Select Clinical Class
        med_class = random.choice(list(cls.DRUG_TAXONOMY.keys()))
        med_data = random.choice(cls.DRUG_TAXONOMY[med_class]["meds"])
        
        dosage_strength = random.choice(["25mg", "50mg", "100mg", "250mg", "500mg", "1g"])
        
        # Determine Controlled Status
        is_controlled = med_class in ["Analgesics", "Narcotics"] or random.random() > 0.95
        controlled_level = "Schedule II" if is_controlled else "Non-Controlled"
        
        return {
            "medicine_name": med_data["generic"],
            "brand_name": random.choice(med_data["brands"]),
            "drug_class": med_class,
            "formulation": random.choice(med_data["forms"]),
            "dosage_strength": dosage_strength,
            "administration_route": med_data["routes"][0],
            "unit_price": float(raw_product.get("UnitPrice", 0.0)),
            
            "storage_requirement": med_data["storage"],
            "is_cold_chain": med_data["cold_chain"],
            "is_controlled": is_controlled,
            "controlled_level": controlled_level,
            "criticality_level": "Critical" if med_class in ["Cytotoxics", "Vaccines"] else "Routine",
            
            # Legacy/Compatibility
            "units_in_stock": int(raw_product.get("UnitsInStock", 0)),
            "safety_stock_level": int(raw_product.get("ReorderLevel", 10)),
            "expiry_date": datetime.now() + timedelta(days=random.randint(180, 730)),
            "batch_id": f"BAT-{uuid.uuid4().hex[:8].upper()}",
            "clinical_category": random.choice(cls.DRUG_TAXONOMY[med_class]["categories"]),
            "supplier_id": raw_product.get("SupplierID")
        }

    @classmethod
    def transform_supplier(cls, raw_supplier: Dict[str, Any]) -> Dict[str, Any]:
        company_name = raw_supplier.get("CompanyName", "Generic Pharma")
        city = raw_supplier.get("City")
        
        # Realistic Pharma Supplier Naming
        is_distributor = "Distribution" in company_name or "Supply" in company_name
        suffix = "Logistics & Distribution" if is_distributor else "Pharmaceuticals Inc."
        
        return {
            "vendor_name": f"{company_name} {suffix}",
            "contact_lead": raw_supplier.get("ContactName"),
            "city": city,
            "country": raw_supplier.get("Country"),
            "reliability_score": round(random.uniform(0.85, 0.99), 2),
            "vendor_type": "Distributor" if is_distributor else "Manufacturer",
            "certification_level": "GDP Compliant" if is_distributor else "GMP Certified",
            "cold_chain_capable": random.random() > 0.3 # 70% of pharma vendors have cold capabilities
        }

    @classmethod
    def transform_customer(cls, raw_customer: Dict[str, Any]) -> Dict[str, Any]:
        company_name = raw_customer.get("CompanyName", "Generic Entity")
        seed = hash(company_name)
        random.seed(seed)
        
        # Decide if it's a Hospital or a Pharmacy
        is_pharmacy = random.random() > 0.7
        
        if is_pharmacy:
            chain = random.choice(cls.PHARMACY_CHAINS)
            store_num = random.randint(100, 9999)
            hospital_name = f"{chain} #{store_num}"
            h_type = "Retail Pharmacy"
            volume = random.choice(["Low", "Medium"])
        else:
            prefix = random.choice(cls.HOSPITAL_PREFIXES)
            suffix = random.choice(cls.HOSPITAL_SUFFIXES)
            hospital_name = f"{prefix} {company_name} {suffix}"
            h_type = random.choice(["General Hospital", "University Hospital", "Specialist Clinic"])
            volume = random.choice(["Medium", "High"])

        return {
            "hospital_name": hospital_name,
            "city": raw_customer.get("City"),
            "region": raw_customer.get("Region") or "Global",
            "hospital_type": h_type,
            "patient_volume": volume,
            "criticality": "Emergency Center" if volume == "High" else "Standard"
        }

    @classmethod
    def transform_shipper(cls, raw_shipper: Dict[str, Any]) -> Dict[str, Any]:
        company_name = raw_shipper.get("CompanyName", "Generic Shipper")
        # Realistic Medical Logistics Naming
        prefix = "MedConnect" if "Speedy" in company_name else "PharmaLink"
        if "United" in company_name: prefix = "GlobalHealth"
        
        return {
            "shipper_name": f"{prefix} {company_name} Logistics",
            "capabilities": ["Cold-Chain", "Controlled Substances", "Emergency Dispatch"],
            "reliability_score": round(random.uniform(0.92, 0.99), 2),
            "delay_sensitivity": "High",
            "cold_chain_capable": "MedConnect" in prefix or "GlobalHealth" in prefix
        }
