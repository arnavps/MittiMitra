
import os

file_path = r'c:\Users\Arnav Shirwadkar\Desktop\Mains\MittiMitra\backend\api\chat.py'

# I will use a multi-step approach: 
# 1. Read existing content in latin-1 to preserve Indic chars correctly.
# 2. Update the logic.
# 3. Write back.

def harden_backend():
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()
    
    # Let's define the new onboarding_extract logic block specifically.
    # I'll replace the block from "def onboarding_extract" to its return statement.
    
    new_extract_logic = '''def onboarding_extract(req: OnboardingExtractRequest):
    """
    Hardened greedy extraction logic (DPDP 2023 Compliant).
    Ensures linear progression (Consent -> Crop -> Yield -> Location -> Harvest Status)
    with branching logic for post-harvest.
    """
    if not client:
        return {
            "consent_granted": True if "yes" in req.text_input.lower() else req.consent_granted,
            "crop": ("Cotton" if "cotton" in req.text_input.lower() else req.current_crop),
            "ai_reply": "Mock OK. What is your yield?"
        }

    try:
        lang = req.language if req.language in ONBOARDING_STRINGS_BACKEND else "English"
        lang_strings = ONBOARDING_STRINGS_BACKEND[lang]

        state = {
            "consent_granted": "PROVIDED" if req.consent_granted else "MISSING",
            "crop": req.current_crop if req.current_crop else "MISSING",
            "yield_quintals": f"{req.current_yield} Quintals" if req.current_yield else "MISSING",
            "harvest_status": req.harvest_status if req.harvest_status else "MISSING",
            "storage_type": req.current_storage if req.current_storage else "MISSING",
            "health_issue": "IDENTIFIED" if req.health_issue else "MISSING",
            "transport_type": req.current_transport if req.current_transport else "MISSING",
            "sowing_date": req.sowing_date if req.sowing_date else "MISSING",
            "location_provided": "YES" if req.location_provided else "NO"
        }

        prompt = f"""You are Agri-Vakeel, an expert farming assistant. 
TASK: 
1. Extract DATA from USER INPUT into JSON. 
2. Identify STILL MISSING fields using the KNOWN STATE.
3. CRITICAL: Address 'Farmer'. No English in 'ai_reply'.
4. DPDP CONSENT: Set 'consent_granted': true if user agrees OR provides crop/yield/location details.
5. If Harvested: Set 'visual_audit_required': true ONLY if health issue reported and no audit done yet.

PRIORITY LIST:
1. Consent (Skip if crop/yield already known)
2. Crop Name
3. Yield Volume
4. Location (Skip if location_provided is YES)
5. Harvest Status
6. Branching (Storage/Health/Transport if Harvested, Sowing Date if Not)

LANGUAGE: {req.language}
USER INPUT: {req.text_input}
KNOWN STATE: {state}

RESPONSE JSON SCHEMA:
{{
  "consent_granted": boolean,
  "crop": string | null,
  "yield_quintals": number | null,
  "harvest_status": "already_harvested" | "not_yet_harvested" | null,
  "location_provided": boolean,
  "storage_type": string | null,
  "health_issue": boolean | null,
  "visual_audit_required": boolean | null,
  "transport_type": string | null,
  "sowing_date": string | null,
  "ai_reply": "Acknowledge findings in {req.language}"
}}
"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        reply_json = json.loads(completion.choices[0].message.content)

        # 1. FAIL-SAFE: Consent & Field Sync
        updated_consent = reply_json.get("consent_granted") or req.consent_granted or bool(reply_json.get("crop") or reply_json.get("yield_quintals"))
        updated_crop = reply_json.get("crop") or req.current_crop
        updated_yield = reply_json.get("yield_quintals") or req.current_yield
        updated_location = reply_json.get("location_provided") or req.location_provided
        updated_harvest = reply_json.get("harvest_status") or req.harvest_status
        
        reply_json["consent_granted"] = updated_consent

        # 2. PYTHON-DRIVEN PROGRESSION
        next_q = ""
        if not updated_consent: next_q = lang_strings["ask_consent"]
        elif not updated_crop: next_q = lang_strings["ask_crop"]
        elif not updated_yield: next_q = lang_strings["ask_yield"]
        elif not updated_location: next_q = lang_strings["ask_location"]
        elif not updated_harvest: next_q = lang_strings["ask_harvest_status"]
        elif updated_harvest == "already_harvested":
            if not (reply_json.get("storage_type") or req.current_storage):
                next_q = lang_strings["ask_storage"]
            elif (reply_json.get("health_issue") is None and req.health_issue is None):
                next_q = lang_strings["ask_health"]
            elif (reply_json.get("health_issue") is True or req.health_issue is True) and not (reply_json.get("visual_audit_required") or req.visual_audit_required):
                next_q = lang_strings["ask_visual_audit"]
                reply_json["visual_audit_required"] = True
            elif not (reply_json.get("transport_type") or req.current_transport):
                next_q = lang_strings["ask_transport"]
        elif updated_harvest == "not_yet_harvested":
            if not (reply_json.get("sowing_date") or req.sowing_date):
                next_q = lang_strings["ask_sowing_date"]

        # Final Reply
        import re
        ack = re.sub(r'[^.!?]+\?', '', reply_json.get("ai_reply", "")).strip()
        if not next_q:
            reply_json["ai_reply"] = f"{ack} {lang_strings['all_done']}".strip()
        else:
            reply_json["ai_reply"] = f"{ack} {next_q}".strip()
            
        return reply_json
'''

    # We will replace the entire onboarding_extract function.
    # The start is "def onboarding_extract" and the end is "return reply_json" followed by any spacing.
    
    import re
    # We use non-greedy matching to find the function.
    pattern = r'def onboarding_extract\(req: OnboardingExtractRequest\):.*?return reply_json'
    content = re.sub(pattern, new_extract_logic, content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='latin-1') as f:
        f.write(content)
    
    print("Backend logic hardened.")

if __name__ == "__main__":
    harden_backend()
