
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

    def test_implicit_consent_cotton():
        # Case: User provides crop instead of saying "proceed"
        req = OnboardingExtractRequest(
            step="Consent",
            text_input="cotton",
            language="English",
            consent_granted=None,
            current_crop=""
        )
        
        print("\n--- Testing Implicit Consent ('cotton') ---")
        result = onboarding_extract(req)
        print(f"Result: {json.dumps(result, indent=2)}")
        
        ai_reply = result.get("ai_reply", "").lower()
        if result.get("consent_granted") == True and "yield" in ai_reply:
            print("✅ SUCCESS: Implicit Consent extracted AND next question (yield) asked!")
        elif "proceed" in ai_reply:
            print("❌ FAILURE: Still asking 'proceed' even after extraction.")
        else:
            print(f"⚠️ UNCERTAIN: Reply is: {ai_reply}")

    if __name__ == "__main__":
        test_implicit_consent_cotton()

except Exception as e:
    print(f"Error: {e}")
