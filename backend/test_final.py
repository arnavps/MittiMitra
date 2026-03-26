
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

    def test_loop_broken_and_location():
        # Case 1: User says "cotton"
        req1 = OnboardingExtractRequest(
            step="Consent",
            text_input="cotton",
            language="English",
            consent_granted=None,
            current_crop=""
        )
        
        print("\n--- Testing 'cotton' -> Loop Broken Check ---")
        result1 = onboarding_extract(req1)
        ai_reply1 = result1.get("ai_reply", "")
        print(f"AI Reply: {ai_reply1}")
        
        if "?" in ai_reply1.split("?")[0]: # This is bit crude
            pass
            
        if "consent" in ai_reply1.lower() or "sammati" in ai_reply1.lower():
            print("❌ FAILURE: Consent question still Present in reply!")
        else:
            print("✅ SUCCESS: Consent loop finally broken!")

        # Case 2: User says "50 quintals" (assuming crop is already set)
        req2 = OnboardingExtractRequest(
            step="Yield",
            text_input="I expect 50 quintals",
            language="English",
            consent_granted=True,
            current_crop="cotton",
            current_yield=None,
            location_provided=None
        )
        
        print("\n--- Testing '50 quintals' -> Location Check ---")
        result2 = onboarding_extract(req2)
        ai_reply2 = result2.get("ai_reply", "")
        print(f"AI Reply: {ai_reply2}")
        
        if "location" in ai_reply2.lower() or "gps" in ai_reply2.lower():
            print("✅ SUCCESS: Location asked after Yield!")
        else:
            print("❌ FAILURE: Location step SKIPPED!")

    if __name__ == "__main__":
        test_loop_broken_and_location()

except Exception as e:
    import traceback
    print(f"Error: {e}\n{traceback.format_exc()}")
