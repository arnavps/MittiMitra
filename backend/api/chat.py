import os
import io
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, List
from groq import Groq
from dotenv import load_dotenv
from gtts import gTTS
from engine.logistics import get_loading_instructions

load_dotenv()

router = APIRouter()

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
    current_name: str = ""
    current_crop: str = ""
    current_land_size: float = 0.0
    consent_granted: Any = None
    location_available: bool = False
    gps_error: Any = None
    current_storage: str = ""
    current_transport: str = ""

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
    oracle = context.get("oracle", {})
    maturity_pct = oracle.get("maturity", {}).get("current_maturity_pct", "Unknown")
    oracle_verdict = oracle.get("verdict", {}).get("verdict", "Unknown")
    maturity_advice = oracle.get("maturity", {}).get("advice", "")

    # Phase 3: Logistics Orchestration
    logistics_rec = context.get("logistics_recommendations", [])
    best_vehicle = logistics_rec[0]["name"] if logistics_rec else context.get("logistics_setup", "Open Trolley")
    
    # Detailed vehicle comparison for the AI
    vehicle_comparison = ""
    for v in logistics_rec:
        vehicle_comparison += f"- {v['name']}: Total Cost ₹{v['total_cost']}, Spoilage Risk {v['spoilage_risk_pct']}%, Net Realization ₹{v['net_realization_per_q']}/Qtl.\n"
    
    loading_advice = get_loading_instructions(context.get("crop", "Produce"), best_vehicle, yield_qtl)
    shared_logistics = context.get("shared_logistics", {})
    
    optimal_route = next((r for r in routing.get("routes", []) if r["id"] == routing.get("optimal_id")), None)
    route_info = ""
    if optimal_route:
        route_info = f"Optimal Route: {optimal_route['name']} ({optimal_route['distance_km']}km), transit spoilage risk: {optimal_route['quality_loss_pct']}%."
    
    # Calculate totals for the prompt to match dashboard
    total_today = total_profit
    total_48h = context.get('profit_forecast_48h', 0) * yield_qtl
    total_diff = total_48h - total_today
    prompt = f"""You are the MittiMitra Agri-Vakeel, an expert, empathetic agricultural advisor for Indian farmers.
You are currently in 'Co-Pilot Mode' acting as a virtual navigator while the farmer is in-transit.
You MUST respond ONLY in the following language: {language}.
If the language is Hindi or Marathi or Telugu or Tamil or Gujarati or Punjabi:
1. You MUST use the native script of {language} (e.g. Devanagari, Telugu script, Tamil script, etc.).
2. DO NOT use Roman script (English letters) for words in the response.
3. You MUST write out all numbers in words in {language} (e.g., instead of '15000' write the words for fifteen thousand in {language}). This is critical for voice clarity.

If the language is Hindi, use simple, respectful, and grounding Hindi. 
Address the farmer as 'Ji Kisan Bhai' (जी किसान भाई).
Language specific Rule for Hindi:
- Use terms like 'Bech den' (बेच दें) or 'Vikri karein' (बिक्री करें) for Sell.
- Use 'Intezar karein' (इंतजार करें) or 'Thoda rukein' (थोड़ा रुकें) for Wait/Hold.

If the language is Marathi, use very simple, slow-paced Marathi that a farmer can easily understand.
Address the farmer as 'Namaskar Shetkari Mitra' (नमस्कार शेतकरी मित्र).

If the language is Telugu, address the farmer as 'Namaskaram Raithu Sodhara' in Telugu script.
If the language is Tamil, address the farmer as 'Vanakkam Vivasayi Nanbare' in Tamil script.
If the language is Gujarati, address the farmer as 'Namaskar Khedut Mitra' in Gujarati script.
If the language is Punjabi, address the farmer as 'Sat Sri Akal Kisan Veer' in Punjabi script.

Translate technical terms into locally understood farming analogies. For example, "Biological Clock" should be explained as "Crop Expiry / Fasal ka samay" or equivalent in {language}. Keep the analogy native and intuitive.

If the language is English:
- Use clear, professional, yet empathetic Indian English.
- Address the farmer as 'Farmer Friend' or 'Sir'.
- Keep sentences concise and focus on the profit impact.

NAVIGATION PERSONA:
- Your role is to provide real-time updates while they drive.
- Focus on destination price changes, weather risks on the road, and spoilage prevention.
- Be proactive but non-intrusive.

PHASE 3: LOADING & SHARED LOGISTICS:
- You MUST mention the loading instruction: "{loading_advice}"
- If sharing savings is possible (count > 0 in data), you MUST mention it: "Vakeel found {shared_logistics.get('count')} neighbors going to {shared_logistics.get('mandi')}. If you share a truck, you save ₹{shared_logistics.get('savings_per_person')} each in transport costs."
- VEHICLE EFFICIENCY ROI: You can compare these options for the farmer:
{vehicle_comparison}

Here is the CURRENT REAL-TIME DATA for the farmer:
- Overall Recommendation Status: {status} (GREEN=Sell, YELLOW=Hold, RED=Wait/Danger)
- Total Estimated Take-Home Profit (Today): ₹{total_today}
- Net Realization value: ₹{per_quintal} per quintal
- Best Market to sell: {best_mandi} (Current Price: ₹{mandi.get('current_price', 0)}/Qtl)
- Weather: {weather.get('temperature_c', 0)}°C, Rain Probability: {weather.get('rain_probability_percent', 0)}%
- Temporal Arbitrage Analysis (Risk vs Reward):
  * Total Profit Today: ₹{total_today}
  * Predicted Total Profit in 48h (after spoilage/rot): ₹{total_48h}
  * Net Change if you wait: ₹{total_diff}
{f"CRITICAL: The farmer has MANUALLY CALIBRATED the environmental data ({context.get('manual_override_count')} overrides). Trust the farmer's ground truth over the sensors. Acknowledge this in your opening." if context.get('is_manual_override') else ""}

If the dashboard context includes a `priority_action` under `preservation`, you MUST mention it and tell the farmer exactly how much money they will save by doing it. Example format: "Also, by [action], you can save ₹[net_saving_inr] today." (translate to {language}).

If `logistics_audit.is_high_risk` is true, you MUST explicitly state the following (translated to {language}): "Vakeel found a profit leak. Your current setup ({context.get("logistics_audit", {}).get("current_setup")}) is costing you ₹{context.get("logistics_audit", {}).get("leak_inr_per_hour")} per hour in spoilage compared to the ideal setup ({context.get("logistics_audit", {}).get("ideal_setup")})."

- ROUTING CONTEXT:
{route_info}

- HARVEST ORACLE (MATURITY): {maturity_pct}% Ripe. Oracle Verdict: {oracle_verdict}. 
- MATURITY ADVICE: {maturity_advice}
"""
    # Phase 9: Pathological Alerts
    pathology = context.get("pathology", {})
    disease = pathology.get("disease_detected")
    severity = pathology.get("severity_index", 0)
    if disease and severity > 0.3:
        prompt += f"\nURGENT BIOLOGICAL ALERT: Pathological screening detected {disease} (Severity: {round(severity*100)}%). Respiration is accelerated by 2.5x. Farmer MUST prioritize Mandis within 100km or sell locally within 6 hours to avoid 100% spoilage loss.\n"
    elif disease:
        prompt += f"\nNOTE: Detected minor symptoms of {disease}. Monitor closely.\n"

    if shock and shock.get("is_shock"):
        prompt += f"\nCRITICAL SHOCK ALERT ACTIVE: {shock.get('message')}. Pivot Advice: {shock.get('pivot_advice')}\n"

    # Phase 10: Contextual Overrides
    context_mode = context.get("context_mode", "expert")
    if context_mode == "financial_advisor":
        prompt += """
FINANCIAL ADVISOR MODE:
- You are now an expert on Indian Agri-Schemes and subsidies.
- Connect the scheme's benefit specifically to the farmer's current risk (e.g., if spoilage is high, explain how Operation Greens helps).
- Be extremely encouraging about modernizing the farm using government support.
"""
    elif context_mode == "co_pilot":
        prompt += """
CO-PILOT MODE:
- Focus solely on traffic, road heat, and market pivots.
- Be blunt, fast, and tactical. You are helping them drive right now.
"""

    prompt += """
YOUR TASK:
Explain the 'Sell vs Wait' recommendation to the farmer based ONLY on the data above.
Explain the TRADE-OFFS (e.g., harvest now to avoid spoilage vs waiting for price peak).
CRITICAL: The response MUST be extremely brief and punchy for fast voice playback. STRICT MAXIMUM of 2 short sentences. Do not use complex numbers. Provide a fast, direct answer to build trust without making the farmer wait.
"""
    return prompt

def generate_vakeel_brief(context: Dict[str, Any], language: str = "Regional") -> str:
    """
    Generates a single-sentence sub-second summary for the dashboard ticker.
    """
    if not client:
        return "Insight: Monitor market volatility and weather closely for optimal profit."
        
    status = context.get("status", "HOLD")
    total_profit = context.get("total_net_profit", 0)
    best_mandi = context.get("best_mandi", "Unknown")
    
    prompt = f"""You are MittiMitra AI. 
    Task: Summarize why the farmer should {status} based on {best_mandi}, profit of ₹{total_profit}, and maturity of {context.get('oracle', {}).get('maturity', {}).get('current_maturity_pct', 'unknown')}% ripeness.
    Constraint: ONE SENTENCE ONLY. Use the language: {language}.
    If {language} is not English, use the native script and address politely.
    Focus on the main driver (Price dip? High spoilage? Immature crop? Shock Alert?).
    If maturity is low (<85%), mention that the crop needs more time for weight gain.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant", # Use the fastest model for the ticker
            max_tokens=60,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Brief generation error: {e}")
        return f"Advice: Market alignment suggests {status} strategy for maximum yield protection."


@router.post("/explain")
def chat_explain(req: ChatRequest):
    """
    Sub-second inference endpoint utilizing Groq + Llama 3 70B for Explainable AI.
    """
    if not client:
        # Mock response if API key isn't provided (for local testing without keys)
        return {
            "response": f"[MOCK - {req.language}] Ji Kisan bhai. We see the price at {req.dashboard_context.get('best_mandi', 'market')} is good right now and weather is stable. You should harvest today to secure ₹{req.dashboard_context.get('net_realization_inr', 0)} profit."
        }

    try:
        system_prompt = build_system_prompt(req.dashboard_context, req.language)
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.farmer_query or "Please explain my dashboard recommendation."}
            ],
            temperature=0.3, # Low temperature for factual consistency
            max_tokens=100, # Decreased to enforce punchy replies
        )
        
        reply = completion.choices[0].message.content
        return {"response": reply}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/onboarding_extract")
def onboarding_extract(req: OnboardingExtractRequest):
    """
    Sub-second endpoint utilizing Groq + Llama 3 to structure unstructured voice input into JSON.
    """
    if not client:
        return {
            "consent_granted": True if "yes" in req.text_input.lower() else None,
            "crop": "tomato" if "tomato" in req.text_input.lower() else None,
            "yield_quintals": 150 if "150" in req.text_input else None,
            "ai_reply": "Mock OK."
        }

    try:
        if req.step == "Consent":
            schema_instructions = """Return JSON with: {'consent_granted': true/false/null, 'ai_reply': 'string'}.
- Set consent_granted to true if they say ANY affirmative.
- If consent_granted is true, acknowledge and ask what crop they are growing today.
- Grok is free to phrase this creatively in """ + req.language + " script."
        elif req.step == "CropName":
            schema_instructions = """Return JSON with: {'crop': string/null, 'ai_reply': 'string'}.
- Extract the crop name.
- If crop is present, acknowledge and ask for their estimated yield in quintals.
- Grok is free to phrase this creatively in """ + req.language + " script."
        elif req.step == "YieldVolume":
            schema_instructions = """Return JSON with: {'yield_quintals': number/null, 'ai_reply': 'string'}.
- Extract the yield volume (number only).
- If yield is present, acknowledge and ask if the crop is already harvested or not.
- Grok is free to phrase this creatively in """ + req.language + " script."
        elif req.step == "HarvestStatus":
            schema_instructions = """Return JSON with: {'harvest_status': 'already_harvested'/'not_yet_harvested'/null, 'ai_reply': 'string'}.
- If 'already_harvested', suggest taking them to the dashboard for storage and transit planning.
- If 'not_yet_harvested', ask when they sowed the seeds to check maturity.
- Grok is free to phrase this creatively in """ + req.language + " script only."
        elif req.step == "StorageAudit":
             schema_instructions = """Return JSON with: {'storage_type': 'Open Field'/'Shaded'/'Cold Storage'/null, 'health_issue': boolean/null, 'ai_reply': 'string'}.
- Extract storage_type and whether they mentioned ANY health issues, spots, or problems (health_issue).
- If health_issue is FALSE, acknowledge and IMMEDIATELY ask about their transport plans (TransitConfig).
- If health_issue is TRUE, acknowledge and suggest they take a photo to analyze (HealthAudit).
- Grok is free to phrase this creatively in """ + req.language + " script only."
        elif req.step == "MaturityCheck":
             schema_instructions = """Return JSON with: {'sowing_date': 'YYYY-MM-DD'/null, 'ai_reply': 'string'}.
- If extracted, Provide maturity insight and say you'll notify them when it's harvest time.
- Moving to Success Dashboard."""
        elif req.step == "TransitConfig":
             schema_instructions = """Return JSON with: {'transport_type': 'Two Wheeler'/'Tractor'/'Pickup'/'Covered Van'/null, 'ai_reply': 'string'}.
- If extracted, congratulate them and say you are taking them to the main dashboard.
- If the user says "no issues" or "ignore health" here, set transport_type to null and move on.
- Grok is free to phrase this creatively in """ + req.language + " script only."
        elif req.step == "FinalVerdict":
             schema_instructions = "Return JSON with: {'yield_quintals': number/null, 'ai_reply': 'string'}. If yield is present, ask the success question."
        else:
             schema_instructions = "Return JSON with: {'ai_reply': 'string'}"

        system_prompt = f"""You are the MittiMitra Agri-Vakeel Assistant. Your ONLY goal is to extract farmer data into JSON.

CONTEXT OF ALREADY EXTRACTED DATA:
- Name: {req.current_name or 'Unknown'}
- Crop: {req.current_crop or 'Unknown'}
- Land Size: {req.current_land_size or 'Unknown'} acres
- Consent: {req.consent_granted}
- Storage: {req.current_storage or 'Unknown'}
- Transport: {req.current_transport or 'Unknown'}

Current Step: {req.step}
Farmer Language: {req.language}

{schema_instructions}

STRICT RULES:
1. Return ONLY valid JSON.
2. The 'ai_reply' MUST be in {req.language} script.
3. If a field is NOT 'Unknown' in the CONTEXT above, you MUST NOT ask for it again.
4. do NOT use conversational filler like "Ji Kisan bhai" unless it's part of a brief acknowledgement.
"""
        # Safer logging for Windows terminals
        try:
            print(f"DEBUG: Onboarding Extract Step: {req.step}")
        except:
            pass
        
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant", # Faster and more stable for extraction
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.text_input}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        reply = completion.choices[0].message.content
        import json
        
        # Robust parsing to handle markdown blocks if present
        cleaned_reply = reply.strip()
        if cleaned_reply.startswith("```json"):
            cleaned_reply = cleaned_reply.split("```json")[1].split("```")[0].strip()
        elif cleaned_reply.startswith("```"):
            cleaned_reply = cleaned_reply.split("```")[1].split("```")[0].strip()
            
        try:
            parsed = json.loads(cleaned_reply)
            return parsed
        except json.JSONDecodeError as je:
            print(f"FAILED TO PARSE JSON: {reply}")
            raise HTTPException(status_code=500, detail=f"Invalid JSON from AI: {str(je)}")
        
    except Exception as e:
        import traceback
        error_detail = f"{type(e).__name__}: {str(e)}"
        print(f"Extraction error: {error_detail}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)

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
