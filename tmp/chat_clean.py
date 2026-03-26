import os
import io
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from groq import Groq
from dotenv import load_dotenv
from gtts import gTTS
from engine.logistics import get_loading_instructions
import json

load_dotenv()

router = APIRouter()

ONBOARDING_STRINGS_BACKEND = {
    "English": {
        "ask_consent": "Namaste! I am MittiMitra. To find you the best profit windows, I need your permission under the DPDP Act 2023 to use your GPS and crop data. Do I have your permission to proceed?",
        "ask_crop": "What crop are we working with today?",
        "ask_yield": "What is your estimated yield for this crop (in quintals or crates)?",
        "ask_location": "To map your field and find local mandis, I need your GPS location. Is that okay?",
        "ask_storage": "Where are you keeping your harvest? (Open field, shed, or cold storage)",
        "ask_health": "Do they look healthy, or have you noticed any spots or irregularities? (Yes/No)",
        "ask_visual_audit": "I see. Please show me a close-up sample via the camera so I can check for pathological risks.",
        "ask_transport": "How will you be transporting your produce? Two wheeler, tractor trolley, or pickup truck?",
        "ask_harvest_status": "Are these crops already harvested, or are you still deciding when to start cutting them?",
        "ask_sowing_date": "When did you sow the seeds?",
        "all_done": "Calibration complete. Your profit optimization dashboard is now ready."
    },
    "Hindi": {
        "ask_consent": "!           ,  DPDP  2023                   ?",
        "ask_crop": "         ?",
        "ask_yield": "         (   )?",
        "ask_location": "           ,           ?",
        "ask_storage": "      ? (  ,      )",
        "ask_health": "    ,        ? (/)",
        "ask_visual_audit": "                  ",
        "ask_transport": "      ? ,  ,   ?",
        "ask_harvest_status": "        ,             ?",
        "ask_sowing_date": "    ?",
        "all_done": "         "
    },
    "Marathi": {
        "ask_consent": "!   .    ,  DPDP  2023          .     ?",
        "ask_crop": "      ?",
        "ask_yield": "       (  )?",
        "ask_location": "        ,      .  ?",
        "ask_storage": "     ? ( ,    )",
        "ask_health": "          ? (/)",
        "ask_visual_audit": ".             .",
        "ask_transport": "     ? ,     ?",
        "ask_harvest_status": "     ,         ?",
        "ask_sowing_date": "    ?",
        "all_done": "  .       ."
    },
    "Telugu": {
        "ask_consent": "!  .    , DPDP  2023   GPS        .  ?",
        "ask_crop": "      ?",
        "ask_yield": "      (  )?",
        "ask_location": "       ,   GPS  .  ?",
        "ask_storage": "    ? ( ,    )",
        "ask_health": "  ,       ? (/)",
        "ask_visual_audit": ".       ,     .",
        "ask_transport": "    ?  ,     ?",
        "ask_harvest_status": "   ,      ?",
        "ask_sowing_date": "   ?",
        "all_done": " .       ."
    },
    "Tamil": {
        "ask_consent": "!  .    , DPDP  2023           .  ?",
        "ask_crop": "    ?",
        "ask_yield": "     (  )?",
        "ask_location": "     ,     . ?",
        "ask_storage": "   ? ( ,    )",
        "ask_health": "  ,      ? (/)",
        "ask_visual_audit": ".      ,     .",
        "ask_transport": "    ?  ,     ?",
        "ask_harvest_status": "    ,        ?",
        "ask_sowing_date": "  ?",
        "all_done": " .       ."
    },
    "Gujarati": {
        "ask_consent": "!   .      ,  DPDP  2023           .     ?",
        "ask_crop": "        ?",
        "ask_yield": "        (  )?",
        "ask_location": "        ,      .    ?",
        "ask_storage": "      ? ( ,    )",
        "ask_health": "    ,        ? (/)",
        "ask_visual_audit": " .             .",
        "ask_transport": "      ?  ,     ?",
        "ask_harvest_status": "      ,          ?",
        "ask_sowing_date": "    ?",
        "all_done": "  .       ."
    },
    "Punjabi": {
        "ask_consent": "  !           ,  DPDP  2023                     ?",
        "ask_crop": "    '    ?",
        "ask_yield": "        (   )?",
        "ask_location": "         ,   GPS        ?",
        "ask_storage": "      ? (  ,      )",
        "ask_health": "     ,         ? (/)",
        "ask_visual_audit": "                  ",
        "ask_transport": "    -  ?   ,  ,   ?",
        "ask_harvest_status": "        ,            ?",
        "ask_sowing_date": "    ?",
        "all_done": "           "
    }
}
 DPDP  2023           .     ?",
        "ask_crop": "        ?",
        "ask_yield": "        (  )?",
        "ask_location": "        ,      .    ?",
        "ask_storage": "      ? ( ,    )",
        "ask_health": "    ,        ? (/)",
        "ask_visual_audit": " .             .",
        "ask_transport": "      ?  ,     ?",
        "ask_harvest_status": "      ,          ?",
        "ask_sowing_date": "    ?",
        "all_done": "  .       ."
    },
    "Punjabi": {
        "ask_consent": "  !           ,  DPDP  2023                     ?",
        "ask_crop": "    '    ?",
        "ask_yield": "        (   )?",
        "ask_location": "         ,   GPS        ?",
        "ask_storage": "      ? (  ,      )",
        "ask_health": "     ,         ? (/)",
        "ask_visual_audit": "                  ",
        "ask_transport": "    -  ?   ,  ,   ?",
        "ask_harvest_status": "        ,            ?",
        "ask_sowing_date": "    ?",
        "all_done": "           "
    }?",
        "ask_sowing_date": "    ?",
        "all_done": "!    .   ."
    },
    "Tamil": {
        "ask_consent": "     ! ,         .  ?",
        "ask_crop": "    ?",
        "ask_yield": "     ?",
        "ask_location": "    ,     . ?",
        "ask_storage": "   ? ( ,    )",
        "ask_health": "       ?   ?",
        "ask_visual_audit": ",    .       ?     .",
        "ask_transport": "    ?  ,    ?",
        "ask_harvest_status": "     ?",
        "ask_sowing_date": "  ?",
        "all_done": "!   .   ."
    },
    "Gujarati": {
        "ask_consent": "       !   ,               .    ?",
        "ask_crop": "      ?",
        "ask_yield": "        ?",
        "ask_location": "      ,      .    ?",
        "ask_storage": "      ? ( ,    )",
        "ask_health": "       ?   ?",
        "ask_visual_audit": " ,     .          ?       .",
        "ask_transport": "      ?  ,    ?",
        "ask_harvest_status": "          ?",
        "ask_sowing_date": "      ?",
        "all_done": "!      .     ."
    },
    "Punjabi": {
        "ask_consent": "       !   ,                   ?",
        "ask_crop": "      ?",
        "ask_yield": "         ?",
        "ask_location": "      ,   GPS        ?",
        "ask_storage": "      ? (  ,      )",
        "ask_health": "        ?   ?",
        "ask_visual_audit": "  ,                    ?       ",
        "ask_transport": "      ?  ,    ?",
        "ask_harvest_status": "           ?",
        "ask_sowing_date": "     ?",
        "all_done": " !           '  "
    }
}

# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY and GROQ_API_KEY != "gsk_placeholder_key_you_need_to_change_this" else None


class ChatRequest(BaseModel):
    farmer_query: str
    dashboard_context: Dict[str, Any]
    language: str = "Regional"
    context_mode: str = "expert" # expert, financial_advisor, co_pilot

class TTSRequest(BaseModel):
    text: str
    language: str = "English"

class OnboardingExtractRequest(BaseModel):
    step: str
    text_input: str
    language: str = "English"
    # Current state fields for greedy extraction
    consent_granted: Any = None
    current_crop: str = ""
    current_yield: Any = None
    harvest_status: Optional[str] = None
    current_storage: str = ""
    health_issue: Any = None
    current_transport: str = ""
    sowing_date: Optional[str] = None
    current_name: str = "Farmer"
    current_land_size: Any = None
    location_provided: Optional[bool] = None
    visual_audit_required: Optional[bool] = None

def build_system_prompt(context: Dict[str, Any], language: str) -> str:
    """
    Injects the real-time dashboard data (prices, weather, shocks) into the AI prompt.
    """
    status = context.get("status", "UNKNOWN")
    best_mandi = context.get("best_mandi", "Unknown")
    total_profit = context.get("total_net_profit", 0)
    per_quintal = context.get("net_realization_inr_per_quintal", 0)
    yield_qtl = context.get("yield_quintals", 1) # Default to 1 to avoid div zero
    weather = context.get("weather", {})
    mandi = context.get("mandi_stats", {})
    shock = context.get("shock_alert", {})
    routing = context.get("routing_data", {})
    
    # Phase 7: Harvest Oracle
    oracle = context.get("oracle") or {}
    maturity = oracle.get("maturity") or {}
    verdict = oracle.get("verdict") or {}
    
    maturity_pct = maturity.get("current_maturity_pct", "Unknown")
    oracle_verdict = verdict.get("verdict", "Unknown")
    maturity_advice = maturity.get("advice", "")

    # Phase 3: Logistics Orchestration
    logistics_rec = context.get("logistics_recommendations", [])
    best_vehicle = logistics_rec[0]["name"] if logistics_rec else context.get("logistics_setup", "Open Trolley")
    
    # Detailed vehicle comparison for the AI
    vehicle_comparison = ""
    for v in logistics_rec:
        vehicle_comparison += f"- {v['name']}: Total Cost {v['total_cost']}, Spoilage Risk {v['spoilage_risk_pct']}%, Net Realization {v['net_realization_per_q']}/Qtl.\n"
    
    loading_advice = get_loading_instructions(context.get("crop", "Produce"), best_vehicle, yield_qtl)
    shared_logistics = context.get("shared_logistics") or {}
    logistics_audit = context.get("logistics_audit") or {}
    
    optimal_route = next((r for r in routing.get("routes", []) if r["id"] == routing.get("optimal_id")), None)
    route_info = ""
    if optimal_route:
        route_info = f"Optimal Route: {optimal_route['name']} ({optimal_route['distance_km']}km), transit spoilage risk: {optimal_route['quality_loss_pct']}%."
    
    # Calculate totals for the prompt to match dashboard
    total_today = total_profit
    total_48h = context.get('profit_forecast_48h', 0) * yield_qtl
    total_diff = total_48h - total_today

    # BASE PROMPT
    prompt = f"""You are the MittiMitra Agri-Vakeel, an expert, empathetic agricultural advisor for Indian farmers.
You are currently providing a strategic explanation of the post-harvest dashboard data.
You MUST respond ONLY in the following language: {language}.

"""
    # LANGUAGE SPECIFIC RULES
    if language == "English":
        prompt += """STRICT RULES FOR ENGLISH:
1. Use clear, professional, yet empathetic Indian English.
2. Address the farmer ONLY as 'Farmer Friend' or 'Sir'.
3. DO NOT use ANY Hindi words like 'Ji Kisan Bhai', 'Namaste', or 'Bhai'.
4. Ensure the entire response is in clean English.
"""
    elif language == "Hindi":
        prompt += """STRICT RULES FOR HINDI ():
1. You MUST use ONLY Devanagari script. DO NOT use Roman script (English letters) for Hindi words.
2. Address the farmer as 'Ji Kisan Bhai' (  ).
3. Use respectful terms like 'Bech den' ( ) or 'Vikri karein' ( ) for Sell.
4. Use 'Intezar karein' ( ) or 'Thoda rukein' ( ) for Wait/Hold.
5. Write out all numbers in Hindi words (e.g.,  as ' ').
"""
    elif language == "Marathi":
        prompt += """STRICT RULES FOR MARATHI ():
1. You MUST use ONLY Devanagari script.
2. Address the farmer as 'Namaskar Shetkari Mitra' (  ).
3. Write out all numbers in Marathi words.
"""
    elif language == "Telugu":
        prompt += "Address as 'Namaskaram Raithu Sodhara' in Telugu script. Use Telugu script ONLY. Write numbers in words.\n"
    elif language == "Tamil":
        prompt += "Address as 'Vanakkam Vivasayi Nanbare' in Tamil script. Use Tamil script ONLY. Write numbers in words.\n"
    elif language == "Gujarati":
        prompt += "Address as 'Namaskar Khedut Mitra' in Gujarati script. Use Gujarati script ONLY. Write numbers in words.\n"
    elif language == "Punjabi":
        prompt += "Address as 'Sat Sri Akal Kisan Veer' in Punjabi script. Use Punjabi script ONLY. Write numbers in words.\n"

    prompt += f"""
ANALOGY RULE: Translate technical terms into locally understood farming analogies. For example, "Biological Clock" of your {context.get('crop', 'Produce')} should be explained as "{context.get('crop', 'Produce')} Expiry / Fasal ka samay" or equivalent in {language}.

NAVIGATION PERSONA:
- Your role is to provide real-time updates while they drive.
- Focus on destination price changes, weather risks on the road, and spoilage prevention.

LOADING & SHARED LOGISTICS:
- Mention common unloading/loading instruction: "{loading_advice}"
- If sharing savings is possible (count > 0 in data), you MUST mention it: "Vakeel found {shared_logistics.get('count')} neighbors going to {shared_logistics.get('mandi')}. If you share a truck, you save {shared_logistics.get('savings_per_person')} each in transport costs."
- VEHICLE EFFICIENCY ROI COMPARISON:
{vehicle_comparison}

CURRENT REAL-TIME DASHBOARD DATA:
- Overall Recommendation Status: {status} (GREEN=Sell, YELLOW=Hold, RED=Wait/Danger)
- Total Estimated Take-Home Profit (Today): {total_today}
- Net Realization value: {per_quintal} per quintal
- Best Market to sell: {best_mandi} (Current Price: {mandi.get('current_price', 0)}/Qtl)
- Weather: {weather.get('temperature_c', 0)}C, Rain Probability: {weather.get('rain_probability_percent', 0)}%
- Transit Spoilage Risk (48h): {context.get('spoilage_risk_pct', 0)}%
- Temporal Arbitrage Analysis:
  * Total Profit Today: {total_today}
  * Predicted Total Profit in 48h (after spoilage/rot): {total_48h}
    * Net Change if you wait: {total_diff}

CRITICAL: The farmer has MANUALLY CALIBRATED the environmental data. Trust the farmer's ground truth. Acknowledge that you are using their provided data instead of the default satellite data.
"""
    return prompt

@router.post("/onboarding_extract")
def onboarding_extract(req: OnboardingExtractRequest):
    """
    Greedy extraction logic for "non-stop" multi-lingual voice onboarding.
    Extracts all possible fields from raw speech and always appends the NEXT question.
    """
    if not client:
        # Mock logic for testing without keys
        return {
            "consent_granted": True if "yes" in req.text_input.lower() else req.consent_granted,
            "crop": ("Cotton" if "cotton" in req.text_input.lower() else req.current_crop),
            "ai_reply": "Mock OK. What is your yield?"
        }

    try:
        # 1. Determine local strings for the requested language
        lang = req.language if req.language in ONBOARDING_STRINGS_BACKEND else "English"
        lang_strings = ONBOARDING_STRINGS_BACKEND[lang]

        # 2. Define the current state for the AI
        state = {
            "consent_granted": "PROVIDED" if req.consent_granted is True else "MISSING",
            "crop": req.current_crop if req.current_crop else "MISSING",
            "yield_quintals": f"{req.current_yield} Quintals" if req.current_yield else "MISSING",
            "harvest_status": req.harvest_status if req.harvest_status else "MISSING",
            "storage_type": req.current_storage if req.current_storage else "MISSING",
            "health_issue": "IDENTIFIED" if req.health_issue else "MISSING",
            "transport_type": req.current_transport if req.current_transport else "MISSING",
            "sowing_date": req.sowing_date if req.sowing_date else "MISSING",
            "land_size": req.current_land_size if req.current_land_size else "MISSING",
            "location_provided": "YES" if req.location_provided else "NO"
        }

        # Priority and templates for missing info
        templates = {
            "crop": lang_strings.get("ask_crop"),
            "yield_quintals": lang_strings.get("ask_yield"),
            "harvest_status": lang_strings.get("ask_harvest_status"),
            "storage_type": lang_strings.get("ask_storage"),
            "health_issue": lang_strings.get("ask_health"),
            "transport_type": lang_strings.get("ask_transport"),
            "sowing_date": lang_strings.get("ask_sowing_date")
        }

        prompt = f"""You are Agri-Vakeel, an expert farming assistant. 
TASK: 
1. Extract DATA from the USER INPUT into JSON.
2. If USER gives multiple facts (e.g. "Yes I agree and I have 50 crates of cotton"), extract EVERYTHING.
3. Identify what is STILL MISSING based on the KNOWN STATE below.
4. CRITICAL: Only extract data if EXPLICITLY mentioned. Do NOT guess or default fields to values like "already_harvested".
   - If user mentions "crates", convert to quintals (1 quintal ~ 2 crates for tomatoes/onions, else 1:1 estimate).
5. Compose an 'ai_reply' STRICTLY in {req.language} script (If {req.language} is NOT English, DO NOT USE ENGLISH at all) that:
   - Politely acknowledges any NEW info extracted from text_input (e.g., "I've recorded 50 quintals...").
   - NEVER ask "Shall we proceed?" or "Can I use your data?" if the user has already provided ANY information (crop, yield, or location).
   - If consent is not explicitly granted but user continues with crop/yield info, consider 'consent_granted' as true and continue to next missing field.
   - ALWAYS appends the NEXT QUESTION for the FIRST missing field in the priority list.
   - You MUST maintain a supportive, expert farmer persona.
   - ADDRESS THE USER AS 'Farmer'.

PRIORITY LIST:
1. Consent (Skip if crop/yield/location already provided)
2. Crop Name
3. Yield Volume
4. Location (Skip if location_provided is YES)
5. Harvest Status
6. Branching (Storage/Health/Transport if Harvested, Sowing Date if Not Harvested)

LANGUAGE: {req.language} (Response MUST be in this script).
USER INPUT: {req.text_input}

KNOWN STATE:
- Consent: {state['consent_granted']}
- Crop: {state['crop']}
- Yield: {state['yield_quintals']}
- Harvest Status: {state['harvest_status']}
- Storage: {state['storage_type']}
- Health: {state['health_issue']}
- Transport: {state['transport_type']}
- Sowing Date: {state['sowing_date']}
- Location Shared: {state['location_provided']}

JSON SCHEMA:
{{
  "consent_granted": boolean | null,  # Set TRUE if user agrees or proceeds to provide data
  "crop": string | null,
  "yield_quintals": number | null,
  "harvest_status": "already_harvested" | "not_yet_harvested" | null,
  "location_provided": boolean | null,
  "storage_type": string | null,
  "health_issue": boolean | null,  # Set TRUE if user reports illness/fungus/issue
  "visual_audit_required": boolean | null, # Set TRUE ONLY IF user says YES to issues
  "transport_type": string | null,
  "sowing_date": "YYYY-MM-DD" | null,
  "ai_reply": "string (Acknowledge findings + Ask for NEXT missing field in {req.language})"
If all required fields (based on harvest status) are filled, set 'ai_reply' to: {lang_strings.get('all_done')}

STRICT: Return ONLY valid JSON. Address the user as 'Farmer'. No English in the reply.
"""

        # DEBUG
        # print(f"DEBUG PROMPT: {prompt}")

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        raw_content = completion.choices[0].message.content
        reply_json = json.loads(raw_content)

        # Helper to strip any ? from AI acknowledgement to prevent loop
        import re
        def clean_ack(text: str) -> str:
            # Remove any sentence ending in ? (common AI loop behavior)
            return re.sub(r'[^.!?]+\?', '', text).strip()

        # 1. FAIL-SAFE: If any info is provided, consent is implicitly granted
        if reply_json.get("crop") or reply_json.get("yield_quintals") or reply_json.get("location_provided") or reply_json.get("harvest_status"):
            reply_json["consent_granted"] = True
        
        # 2. PYTHON-DRIVEN PROGRESSION (Guaranteed)
        # Identify the REAL next question based on the UPDATED fields
        # Note: We prioritize the flags from the Request if the LLM didn't see anything new
        updated_consent = reply_json.get("consent_granted") if reply_json.get("consent_granted") is not None else req.consent_granted
        updated_crop = reply_json.get("crop") if reply_json.get("crop") else req.current_crop
        updated_yield = reply_json.get("yield_quintals") if reply_json.get("yield_quintals") else req.current_yield
        updated_location = reply_json.get("location_provided") if reply_json.get("location_provided") is not None else req.location_provided
        updated_harvest_status = reply_json.get("harvest_status") if reply_json.get("harvest_status") else req.harvest_status

        # If data is present but consent is not explicitly set, force it (Fail-safe)
        if (updated_crop or updated_yield or updated_location) and not updated_consent:
            updated_consent = True
            reply_json["consent_granted"] = True

        next_q = ""
        if not updated_consent:
            next_q = lang_strings.get("ask_consent")
        elif not updated_crop:
            next_q = lang_strings.get("ask_crop")
        elif not updated_yield:
            next_q = lang_strings.get("ask_yield")
        elif not updated_location:
            next_q = lang_strings.get("ask_location")
        elif not updated_harvest_status:
            next_q = lang_strings.get("ask_harvest_status")
        elif updated_harvest_status == 'already_harvested':
            if not (reply_json.get("storage_type") or req.current_storage):
                next_q = lang_strings.get("ask_storage")
            elif (reply_json.get("health_issue") is None and req.health_issue is None):
                next_q = lang_strings.get("ask_health")
            elif (reply_json.get("health_issue") is True or req.health_issue is True) and not (reply_json.get("visual_audit_required") or req.visual_audit_required):
                # User reported issue, now ask to show camera
                next_q = lang_strings.get("ask_visual_audit")
            
            # If health is resolved or skipped, move to transport
            if not next_q:
                if not (reply_json.get("transport_type") or req.current_transport):
                    next_q = lang_strings.get("ask_transport")
        elif updated_harvest_status == 'not_yet_harvested':
            if not (reply_json.get("sowing_date") or req.sowing_date):
                next_q = lang_strings.get("ask_sowing_date")

        # 3. Concatenate Acknowledgement (AI) + Question (Python)
        if next_q:
            ack = clean_ack(reply_json.get("ai_reply", ""))
            # If ack already asks a question or is empty, we just append or use next_q
            reply_json["ai_reply"] = f"{ack} {next_q}".strip()
            
        return reply_json

    except Exception as e:
        import traceback
        print(f"Extraction error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts")
def text_to_speech(req: TTSRequest):
    """
    Sub-second endpoint to generate robust audio for all 7 Indic languages via gTTS.
    """
    try:
        lang_map = {
            "English": "en",
            "Hindi": "hi",
            "Marathi": "mr",
            "Telugu": "te",
            "Tamil": "ta",
            "Gujarati": "gu",
            "Punjabi": "pa"
        }
        
        target_lang = lang_map.get(req.language, "en")
        
        # Removed artificial slowdown for Marathi per farmer feedback
        tts = gTTS(text=req.text, lang=target_lang, slow=False)
        
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        return StreamingResponse(mp3_fp, media_type="audio/mpeg")
    
    except Exception as e:
        import traceback
        error_msg = f"TTS Error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/tts")
def text_to_speech_stream(text: str = Query(...), language: str = Query("English")):
    """
    Sub-second GET endpoint for native HTML5 Audio streaming. 
    Bypasses the need for Blob downloading on the frontend.
    """
    try:
        lang_map = {
            "English": "en",
            "Hindi": "hi",
            "Marathi": "mr",
            "Telugu": "te",
            "Tamil": "ta",
            "Gujarati": "gu",
            "Punjabi": "pa"
        }
        
        target_lang = lang_map.get(language, "en")
        
        # Use safe logging
        try:
            print(f"DEBUG: TTS Request - Lang: {language} ({target_lang})")
        except:
            pass

        tts = gTTS(text=text, lang=target_lang, slow=False)
        
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        audio_content = mp3_fp.getvalue()
        content_length = len(audio_content)
        
        # Stream the audio buffer directly to the browser
        return StreamingResponse(io.BytesIO(audio_content), media_type="audio/mpeg", headers={
            "Cache-Control": "public, max-age=31536000",
            "Content-Length": str(content_length),
            "Accept-Ranges": "bytes"
        })
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"CRITICAL TTS FAILURE: {e}\n{error_trace}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_vakeel_brief(context: Dict[str, Any], language: str) -> str:
    """
    Generates a concise, high-impact summary of the harvest recommendation.
    """
    try:
        status = context.get("status", "UNKNOWN")
        best_mandi = context.get("best_mandi", "Unknown")
        total_profit = context.get("profit_forecast_48h", 0)
        
        ripeness_data = context.get("oracle", {}).get("maturity", {})
        ripeness = ripeness_data.get("current_maturity_pct", "unknown") if isinstance(ripeness_data, dict) else "unknown"
        
        prompt = f"""You are Agri-Vakeel, the expert farming advisor. 
        TASK: Summarize why the farmer should {status} based on {best_mandi}, profit of {total_profit}, and maturity of {ripeness}% ripeness.
        LANGUAGE: {language} (Response MUST be in this script).
        STYLE: Encouraging, concise, high-impact. Max 2 sentences.
        """
        
        if not client:
            return f"Agri-Vakeel: {status} at {best_mandi} for {total_profit}."

        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            max_tokens=100
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in generate_vakeel_brief: {e}")
        return f"Agri-Vakeel: Recommendation successfully processed for {best_mandi}."
