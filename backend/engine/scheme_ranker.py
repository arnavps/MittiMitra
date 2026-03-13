from typing import List, Dict, Any

def rank_schemes(user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Ranks agricultural schemes based on the farmer's current risk profile and storage setup.
    """
    schemes = [
        {
            "id": "pm_kisan_sampada",
            "title": "PM-Kisan Sampada",
            "hook": "Scale your harvest with modern cold chain infrastructure.",
            "description": "Provides financial assistance for creating modern infrastructure with efficient supply chain management from farm gate to retail outlet.",
            "portal_url": "https://mofpi.gov.in/pmksy",
            "eligibility": "FPOs, individual farmers, and entrepreneurs.",
            "documents": "Land ownership proof, project report, entity registration.",
            "category": "infrastructure"
        },
        {
            "id": "operation_greens",
            "title": "Operation Greens",
            "hook": "Get 50% subsidy on transport and storage for TOP crops.",
            "description": "Supports Tomato, Onion, and Potato (TOP) value chain to prevent flash crashes and reduce post-harvest losses.",
            "portal_url": "https://mofpi.gov.in/operation-greens",
            "eligibility": "Farmers and FPOs involved in TOP crops.",
            "documents": "Mandi sale receipts, transport invoices.",
            "category": "logistics"
        },
        {
            "id": "aif",
            "title": "Agriculture Infrastructure Fund (AIF)",
            "hook": "₹1 Lakh Crore for post-harvest management projects.",
            "description": "A medium-long term debt financing facility for investment in viable projects for post-harvest management infrastructure and community farming assets.",
            "portal_url": "https://agriinfra.dac.gov.in/",
            "eligibility": "Farmers, FPOs, PACS, Marketing Cooperative Societies.",
            "documents": "Project report, ID proof, Land details.",
            "category": "infrastructure"
        },
        {
            "id": "pm_kisan",
            "title": "PM-Kisan",
            "hook": "Direct income support for all landholding farmer families.",
            "description": "Financial benefit of ₹6000 per year in three equal installments to provide income support to all landholding farmer families.",
            "portal_url": "https://pmkisan.gov.in/",
            "eligibility": "All landholding farmer families (subject to exclusions).",
            "documents": "Aadhaar, Bank account details, Land record.",
            "category": "income"
        }
    ]

    # Ranking Logic
    spoilage_risk = user_data.get("spoilage_risk_pct", 0)
    storage_type = user_data.get("storage_type", "Open Field")
    crop = user_data.get("crop", "").lower()

    def get_score(scheme):
        score = 0
        
        # Boost logistics/transport schemes if spoilage risk is high
        if spoilage_risk > 15 and scheme["category"] == "logistics":
            score += 50
        
        # Boost infrastructure if storage is poor
        if storage_type == "Open Field" and scheme["category"] == "infrastructure":
            score += 40
            
        # Specific crop boost for Operation Greens
        if crop in ["tomato", "onion", "potato"] and scheme["id"] == "operation_greens":
            score += 30
            
        return score

    # Sort based on score descending
    ranked_schemes = sorted(schemes, key=lambda s: get_score(s), reverse=True)
    
    return ranked_schemes
