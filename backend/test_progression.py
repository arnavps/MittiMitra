
import sys
import os
import json
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

try:
    from api.chat import onboarding_extract, OnboardingExtractRequest
    import asyncio

    # Setup environment
    import os
    from dotenv import load_dotenv
    load_dotenv()

    def test_proceed_progression():
        # Case: User says "proceed"
        req = OnboardingExtractRequest(
            step="Consent",
            text_input="proceed",
            language="English",
            consent_granted=None,
            current_crop=""
        )
        
        print("\n--- Testing 'proceed' -> 'Crop' Progression ---")
        result = onboarding_extract(req)
        print(f"Result: {json.dumps(result, indent=2)}")
        
        ai_reply = result.get("ai_reply", "").lower()
        if result.get("consent_granted") == True and "crop" in ai_reply:
            print("✅ SUCCESS: Consent extracted AND next question (crop) asked!")
        else:
            print("❌ FAILURE: Consent or progression logic missing.")

    if __name__ == "__main__":
        test_proceed_progression()

except Exception as e:
    print(f"Error: {e}")
