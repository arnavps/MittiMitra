
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

    def test_yes_to_crop():
        # Case: User says "Yes"
        req = OnboardingExtractRequest(
            step="Consent",
            text_input="Yes I agree",
            language="English",
            consent_granted=None,
            current_crop=""
        )
        
        print("\n--- Testing 'Yes I agree' -> 'Crop' Progression ---")
        result = onboarding_extract(req)
        print(f"Result: {json.dumps(result, indent=2)}")
        
        ai_reply = result.get("ai_reply", "").lower()
        if result.get("consent_granted") == True and "crop" in ai_reply:
            print("✅ SUCCESS: Consent extracted AND crop question asked!")
        else:
            print("❌ FAILURE: Logic loop detected.")

    if __name__ == "__main__":
        test_yes_to_crop()

except Exception as e:
    print(f"Error: {e}")
