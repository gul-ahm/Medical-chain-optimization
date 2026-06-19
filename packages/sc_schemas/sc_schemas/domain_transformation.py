import random
from typing import Dict, Any, List

class MedicalDomainTransformer:
    # Plausible medical taxonomies
    MEDICINE_CLASSES = [
        "Antibiotics", "Antivirals", "Analgesics", "Antihypertensives", 
        "Statins", "Antidiabetics", "Immunosuppressants", "Cytotoxics"
    ]
    
    MEDICINE_NAMES = {
        "Antibiotics": ["Amoxicillin", "Ciprofloxacin", "Azithromycin", "Cephalexin"],
        "Antidiabetics": ["Metformin", "Insulin Glargine", "Sitagliptin", "Glipizide"],
        "Analgesics": ["Paracetamol", "Ibuprofen", "Morphine", "Oxycodone"],
        "Antihypertensives": ["Lisinopril", "Amlodipine", "Losartan", "Metoprolol"]
    }
    
    HOSPITALS = [
        "St. Mary's General", "City North Medical Center", "Westside Health Clinic", 
        "Metropolitan University Hospital", "Central Children's Hospital"
    ]
    
    VENDORS = [
        "Pfizer Distribution", "Novartis Clinical Supplies", "Roche Logistics", 
        "GlaxoSmithKline Pharma", "Merck Clinical Services"
    ]

    @classmethod
    def transform_product(cls, product_name: str) -> Dict[str, str]:
        """Maps a generic product to a plausible medicine."""
        # Use hashing for deterministic mapping if needed, or just random choice for simulation
        # For simulation, we'll pick a class based on the hash of the product name
        class_idx = hash(product_name) % len(cls.MEDICINE_CLASSES)
        med_class = cls.MEDICINE_CLASSES[class_idx]
        
        med_names = cls.MEDICINE_NAMES.get(med_class, ["Generic Med"])
        med_name = med_names[hash(product_name) % len(med_names)]
        
        dosage = random.choice(["50mg", "100mg", "500mg", "1g"])
        form = random.choice(["Tablet", "Capsule", "Injection", "Syrup"])
        
        return {
            "medicine_name": f"{med_name} {dosage} {form}",
            "drug_class": med_class,
            "formulation": form,
            "dosage": dosage
        }

    @classmethod
    def transform_customer(cls, company_name: str) -> str:
        """Maps a company to a hospital/pharmacy."""
        return cls.HOSPITALS[hash(company_name) % len(cls.HOSPITALS)]

    @classmethod
    def transform_supplier(cls, supplier_name: str) -> str:
        """Maps a supplier to a pharma vendor."""
        return cls.VENDORS[hash(supplier_name) % len(cls.VENDORS)]
