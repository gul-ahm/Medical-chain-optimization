import json
import re
from typing import Dict, Any, Optional

class HealthcareInteroperabilityLayer:
    """
    Normalizes healthcare ecosystem data formats (HL7 v2.x and HL7 FHIR Release 4)
    into standard platform clinical inventory and supply chain schemas.
    """

    @staticmethod
    def parse_hl7_v2_adt_a08(raw_hl7: str) -> Dict[str, Any]:
        """
        Parses an HL7 ADT^A08 event (Inventory update / patient transaction link)
        Returns a normalized inventory dictionary.
        """
        # Clean segment lines
        segments = [line.strip().split('|') for line in raw_hl7.split('\n') if line.strip()]
        
        normalized = {
            "source_format": "HL7_V2",
            "message_type": "ADT_A08",
            "sku": "UNKNOWN",
            "quantity": 0,
            "lot_number": "N/A",
            "expiry_date": "N/A"
        }

        # Scan for OBX (Observation/Result) segment mapping vaccine/insulin status
        for seg in segments:
            if seg[0] == 'MSH':
                normalized["message_id"] = seg[9] if len(seg) > 9 else "UNKNOWN"
            elif seg[0] == 'OBX':
                # OBX|1|ST|SKU^INSULIN-REG||450|units|||||F|||20260517
                if len(seg) > 5:
                    identifier = seg[3]
                    val = seg[5]
                    # Parse SKU if present in OBX-3
                    match_sku = re.search(r'\^(.*)', identifier)
                    if match_sku:
                        normalized["sku"] = match_sku.group(1)
                    else:
                        normalized["sku"] = identifier
                    try:
                        normalized["quantity"] = int(val)
                    except ValueError:
                        normalized["quantity"] = 0
            elif seg[0] == 'RXE':
                # RXE|1|INSULIN-REG^Insulin||450|||||LOT-782||20261130
                if len(seg) > 11:
                    normalized["lot_number"] = seg[10]
                    normalized["expiry_date"] = seg[11]

        return normalized

    @staticmethod
    def parse_fhir_supply_request(fhir_json: str) -> Dict[str, Any]:
        """
        Parses a FHIR SupplyRequest resource into clinical supply chain schemas.
        Referencing HL7 FHIR SupplyRequest resource schema:
        http://hl7.org/fhir/R4/supplyrequest.html
        """
        try:
            payload = json.loads(fhir_json)
        except Exception:
            return {"error": "Invalid FHIR JSON payload"}

        if payload.get("resourceType") != "SupplyRequest":
            return {"error": f"Unsupported resourceType: {payload.get('resourceType')}"}

        sku = "UNKNOWN"
        quantity = 0

        # Parse FHIR codings for item
        item_code = payload.get("itemCodeableConcept", {})
        codings = item_code.get("coding", [])
        if codings:
            sku = codings[0].get("code", "UNKNOWN")

        # Parse FHIR quantities
        quantity_obj = payload.get("quantity", {})
        quantity = quantity_obj.get("value", 0)

        # Parse requester identifiers
        requester = payload.get("requester", {})
        requester_id = requester.get("reference", "UNKNOWN_CLINIC")

        # Parse priority
        priority = payload.get("priority", "routine")

        return {
            "source_format": "FHIR_R4",
            "resource_type": "SupplyRequest",
            "sku": sku,
            "quantity": int(quantity),
            "requester": requester_id,
            "priority": priority,
            "status": payload.get("status", "unknown")
        }

    @staticmethod
    def validate_healthcare_payload(format_type: str, data: str) -> bool:
        """
        Validates structure integrity for compliance loops.
        """
        if format_type.upper() == "HL7":
            return data.startswith("MSH")
        elif format_type.upper() == "FHIR":
            try:
                js = json.loads(data)
                return "resourceType" in js
            except Exception:
                return False
        return False
