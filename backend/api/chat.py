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

ONBOARDING_STRINGS_BACKEND = {
    "English": {
        "ask_crop": "What crop are you growing today?",
        "ask_yield": "What is your estimated yield for this crop in quintals?",
        "ask_location": "To find local markets and maximize profit, I need your GPS location. Is that okay?",
        "ask_storage": "Where are you keeping your harvest? (Open field, shed, or cold storage)",
        "ask_health": "Are there any health issues, spots, or problems on your crop?",
        "ask_transport": "How will you be transporting your produce? Two wheeler, tractor, or pickup truck?",
        "all_done": "Congratulations! We have collected all details. Let's head to the dashboard."
    },
    "Hindi": {
        "ask_crop": "आप आज कौन सी फसल उगा रहे हैं?",
        "ask_yield": "इस फसल के लिए आपका अनुमानित उत्पादन क्विंटल में कितना है?",
        "ask_location": "मुनाफा बढ़ाने के लिए स्थानीय मंडियों को खोजने हेतु मुझे आपके जीपीएस स्थान की आवश्यकता है। क्या यह ठीक है?",
        "ask_storage": "आप अपनी फसल कहाँ रख रहे हैं? (खुले खेत में, शेड में या कोल्ड स्टोरेज में)",
        "ask_health": "क्या आपकी फसल में कोई बीमारी, धब्बे या कोई समस्या है?",
        "ask_transport": "आप अपना माल कैसे ले जाएंगे? दोपहिया, ट्रैक्टर या पिकअप ट्रक?",
        "all_done": "बधाई हो! हमने सभी विवरण एकत्र कर लिए हैं। चलिए अब डैशबोर्ड पर चलते हैं।"
    },
    "Marathi": {
        "ask_crop": "तुम्ही आज कोणते पीक घेत आहात?",
        "ask_yield": "या पिकासाठी तुमचे अंदाजे उत्पन्न क्विंटलमध्ये किती आहे?",
        "ask_location": "तुमचा नफा वाढवण्यासाठी जवळच्या बाजारपेठा शोधण्यासाठी मला तुमचे जीपीएस लोकेशन हवे आहे. चालेल का?",
        "ask_storage": "तुम्ही तुमचा माल कोठे ठेवत आहात? (खुल्या शेतात, शेडमध्ये किंवा कोल्ड स्टोरेजमध्ये)",
        "ask_health": "तुमच्या पिकावर काही आरोग्याच्या समस्या, डाग किंवा काही प्रश्न आहेत का?",
        "ask_transport": "तुम्ही तुमचा माल कसा नेणार आहात? दुचाकी, ट्रॅक्टर किंवा पिकअप ट्रक?",
        "all_done": "अभिनंदन! आम्ही सर्व माहिती गोळा केली आहे. आता डॅशबोर्डवर जाऊया."
    },
    "Telugu": {
        "ask_crop": "మీరు ఈ రోజు ఏ పంటను పండిస్తున్నారు?",
        "ask_yield": "ఈ పంటకు మీ అంచనా దిగుబడి క్వింటాళ్లలో ఎంత?",
        "ask_location": "స్థానిక మార్కెట్లను కనుగొనడానికి మరియు లాభాన్ని పెంచడానికి, నాకు మీ GPS స్థానం అవసరం. అది సరేనా?",
        "ask_storage": "మీరు మీ పంటను ఎక్కడ ఉంచుతున్నారు? (బహిరంగ ప్రదేశంలో, షెడ్డులో లేదా కోల్డ్ స్టోరేజీలో)",
        "ask_health": "మీ పంటలో ఏవైనా ఆరోగ్య సమస్యలు ఉన్నాయా?",
        "ask_transport": "మీరు మీ సరుకును ఎలా రవాణా చేస్తారు? ద్విచక్ర వాహనం, ట్రాక్టర్ లేదా పிக்கప్ ట్రక్?",
        "all_done": "అభినందనలు! మేము అన్ని వివరాలను సేకరించాము. ఇక డ్యాష్‌బోర్డ్‌కు వెళ్దాం."
    },
    "Tamil": {
        "ask_crop": "இன்று நீங்கள் என்ன பயிர் செய்கிறீர்கள்?",
        "ask_yield": "இந்தப் பயிரின் மதிப்பிடப்பட்ட விளைச்சல் எத்தனை குவிண்டால்?",
        "ask_location": "உள்ளூர் சந்தைகளைக் கண்டறியவும் லாபத்தை அதிகரிக்கவும், உங்கள் ஜிபிஎஸ் இருப்பிடம் எனக்குத் தேவை. ஓகேவா?",
        "ask_storage": "உங்கள் அறுவடையை எங்கே வைத்திருக்கிறீர்கள்? (திறந்த வெளி, கொட்டகை அல்லது குளிர்பதன கிடங்கு)",
        "ask_health": "உங்கள் பயிரில் ஏதேனும் நோய் பாதிப்புகள் அல்லது பிரச்சனைகள் உள்ளதா?",
        "ask_transport": "உங்கள் விளைபொருட்களை எப்படி கொண்டு செல்வீர்கள்? டூ வீலர், டிராக்டர் அல்லது பிக்கப் டிரக்?",
        "all_done": "வாழ்த்துக்கள்! அனைத்து விவரங்களையும் சேகரித்துவிட்டோம். இப்போது டேஷ்போர்டுக்கு செல்வோம்."
    },
    "Gujarati": {
        "ask_crop": "તમે આજે કયો પાક ઉગાડી રહ્યા છો?",
        "ask_yield": "આ પાક માટે તમારી અંદાજિત ઉપજ ક્વિન્ટલમાં કેટલી છે?",
        "ask_location": "સ્થાનિક બજારો શોધવા અને નફો વધારવા માટે, મારે તમારા જીપીએસ લોકેશનની જરૂર છે. શું તે બરાબર છે?",
        "ask_storage": "તમે તમારી લણણી ક્યાં રાખી રહ્યા છો? (ખુલ્લા ખેતરમાં, શેડમાં અથવા કોલ્ડ સ્ટોરેજમાં)",
        "ask_health": "શું તમારા પાકમાં કોઈ રોગ કે સમસ્યા છે?",
        "ask_transport": "તમે તમારો માલ કેવી રીતે લઈ જશો? ટુ વ્હીલર, ટ્રેક્ટર કે પિકઅપ ટ્રક?",
        "all_done": "અભિનંદન! અમે બધી વિગતો એકત્રિત કરી છે. ચાલો હવે ડેશબોર્ડ પર જઈએ."
    },
    "Punjabi": {
        "ask_crop": "ਤੁਸੀਂ ਅੱਜ ਕਿਹੜੀ ਫ਼ਸਲ ਉਗਾ ਰਹੇ ਹੋ?",
        "ask_yield": "ਇਸ ਫ਼ਸਲ ਲਈ ਤੁਹਾਡੀ ਅੰਦਾਜ਼ਨ ਪੈਦਾਵਾਰ ਕੁਇੰਟਲਾਂ ਵਿੱਚ ਕਿੰਨੀ ਹੈ?",
        "ask_location": "ਸਥਾਨਕ ਮੰਡੀਆਂ ਲੱਭਣ ਅਤੇ ਮੁਨਾਫ਼ਾ ਵਧਾਉਣ ਲਈ, ਮੈਨੂੰ ਤੁਹਾਡੀ GPS ਲੋਕੇਸ਼ਨ ਦੀ ਲੋੜ ਹੈ। ਕੀ ਇਹ ਠੀਕ ਹੈ?",
        "ask_storage": "ਤੁਸੀਂ ਆਪਣੀ ਫ਼ਸਲ ਕਿੱਥੇ ਰੱਖ ਰਹੇ ਹੋ? (ਖੁੱਲ੍ਹੇ ਖੇਤ ਵਿੱਚ, ਸ਼ੈੱਡ ਵਿੱਚ ਜਾਂ ਕੋਲਡ ਸਟੋਰੇਜ ਵਿੱਚ)",
        "ask_health": "ਕੀ ਤੁਹਾਡੀ ਫ਼ਸਲ ਵਿੱਚ ਕੋਈ ਬਿਮਾਰੀ ਜਾਂ ਸਮੱਸਿਆ ਹੈ?",
        "ask_transport": "ਤੁਸੀਂ ਆਪਣਾ ਮਾਲ ਕਿਵੇਂ ਲੈ ਕੇ ਜਾਓਗੇ? ਦੋਪਹੀਆ ਵਾਹਨ, ਟ੍ਰੈਕਟਰ ਜਾਂ ਪਿਕਅੱਪ ਟਰੱਕ?",
        "all_done": "ਵਧਾਈ ਹੋ! ਅਸੀਂ ਸਾਰੇ ਵੇਰਵੇ ਇਕੱਠੇ ਕਰ ਲਏ ਹਨ। ਚਲੋ ਹੁਣ ਡੈਸ਼ਬੋਰਡ 'ਤੇ ਚੱਲਦੇ ਹਾਂ।"
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
    harvest_status: str = ""
    current_storage: str = ""
    health_issue: Any = None
    current_transport: str = ""
    sowing_date: str = ""

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
        vehicle_comparison += f"- {v['name']}: Total Cost ₹{v['total_cost']}, Spoilage Risk {v['spoilage_risk_pct']}%, Net Realization ₹{v['net_realization_per_q']}/Qtl.\n"
    
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
        prompt += """STRICT RULES FOR HINDI (हिन्दी):
1. You MUST use ONLY Devanagari script. DO NOT use Roman script (English letters) for Hindi words.
2. Address the farmer as 'Ji Kisan Bhai' (जी किसान भाई).
3. Use respectful terms like 'Bech den' (बेच दें) or 'Vikri karein' (बिक्री करें) for Sell.
4. Use 'Intezar karein' (इंतजार करें) or 'Thoda rukein' (थोड़ा रुकें) for Wait/Hold.
5. Write out all numbers in Hindi words (e.g., १५००० as 'पंद्रह हजार').
"""
    elif language == "Marathi":
        prompt += """STRICT RULES FOR MARATHI (मराठी):
1. You MUST use ONLY Devanagari script.
2. Address the farmer as 'Namaskar Shetkari Mitra' (नमस्कार शेतकरी मित्र).
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
- If sharing savings is possible (count > 0 in data), you MUST mention it: "Vakeel found {shared_logistics.get('count')} neighbors going to {shared_logistics.get('mandi')}. If you share a truck, you save ₹{shared_logistics.get('savings_per_person')} each in transport costs."
- VEHICLE EFFICIENCY ROI COMPARISON:
{vehicle_comparison}

CURRENT REAL-TIME DASHBOARD DATA:
- Overall Recommendation Status: {status} (GREEN=Sell, YELLOW=Hold, RED=Wait/Danger)
- Total Estimated Take-Home Profit (Today): ₹{total_today}
- Net Realization value: ₹{per_quintal} per quintal
- Best Market to sell: {best_mandi} (Current Price: ₹{mandi.get('current_price', 0)}/Qtl)
- Weather: {weather.get('temperature_c', 0)}°C, Rain Probability: {weather.get('rain_probability_percent', 0)}%
- Transit Spoilage Risk (48h): {context.get('spoilage_risk_pct', 0)}%
- Temporal Arbitrage Analysis:
  * Total Profit Today: ₹{total_today}
  * Predicted Total Profit in 48h (after spoilage/rot): ₹{total_48h}
    * Net Change if you wait: ₹{total_diff}

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
            "consent_granted": req.consent_granted,
            "crop": req.current_crop,
            "yield_quintals": req.current_yield,
            "harvest_status": req.harvest_status,
            "storage_type": req.current_storage,
            "health_issue": req.health_issue,
            "transport_type": req.current_transport,
            "sowing_date": req.sowing_date
        }

        # Priority and templates for missing info
        templates = {
            "crop": lang_strings.get("ask_crop", "What crop?"),
            "yield_quintals": lang_strings.get("ask_yield", "What yield?"),
            "harvest_status": "What is the harvest status?" if lang == "English" else "पिकाची कापणी झाली आहे का? ( Marathi example link )",
            "storage_type": lang_strings.get("ask_storage", "Where storage?"),
            "health_issue": lang_strings.get("ask_health", "Crop health?"),
            "transport_type": lang_strings.get("ask_transport", "Transport?"),
            "sowing_date": "पेरणी कधी केली? ( Marathi example link )"
        }
        
        # Localize the extra-strings if not in the main dict
        if lang == "Hindi":
            templates["harvest_status"] = "क्या आपने फसल की कटाई कर ली है या करने वाले हैं?"
            templates["sowing_date"] = "आपने इस फसल की बुवाई कब की थी?"
        elif lang == "Marathi":
            templates["harvest_status"] = "तुमच्या पिकाची कापणी झाली आहे का?"
            templates["sowing_date"] = "तुम्ही या पिकाची पेरणी कधी केली होती?"
        elif lang == "Tamil":
            templates["harvest_status"] = "பயிர் அறுவடை செய்யப்பட்டுள்ளதா?"
            templates["sowing_date"] = "நீங்கள் எப்போது விதைத்தீர்கள்?"
        # ... others use English fallback or can be added to ONBOARDING_STRINGS_BACKEND directly

        prompt = f"""You are Agri-Vakeel, an expert farming assistant. 
TASK: 
1. Extract DATA from the USER INPUT into JSON.
2. If USER gives multiple facts (e.g. "Yes I agree and I have 50 quintals of cotton"), extract EVERYTHING.
3. Identify what is STILL MISSING based on the KNOWN STATE below.
4. Compose an 'ai_reply' in {req.language} script that:
   - Politely acknowledges any NEW info extracted.
   - ALWAYS appends the NEXT QUESTION for the FIRST missing field.

USER INPUT: "{req.text_input}"
LANGUAGE: {req.language} (Response MUST be in this script).

KNOWN STATE:
- Consent: {state['consent_granted']}
- Crop: {state['crop']}
- Yield: {state['yield_quintals']}
- Harvest Status: {state['harvest_status']}
- Storage: {state['storage_type']}
- Health: {state['health_issue']}
- Transport: {state['transport_type']}

PRIORITY & NEXT QUESTIONS:
1. Consent Missing? -> Ask for consent.
2. Crop Missing? -> {templates['crop']}
3. Yield Missing? -> {templates['yield_quintals']}
4. Harvest Status Missing? -> {templates['harvest_status']}
5. (If Already Harvested) Storage Missing? -> {templates['storage_type']}
6. (If Already Harvested) Health Missing? -> {templates['health_issue']}
7. (If Already Harvested) Transport Missing? -> {templates['transport_type']}
8. (If Not Yet Harvested) Sowing Date Missing? -> {templates['sowing_date']}

JSON SCHEMA:
{{
  "consent_granted": boolean | null,
  "crop": string | null,
  "yield_quintals": number | null,
  "harvest_status": "already_harvested" | "not_yet_harvested" | null,
  "storage_type": string | null,
  "health_issue": boolean | null,
  "transport_type": string | null,
  "sowing_date": "YYYY-MM-DD" | null,
  "ai_reply": "string (Acknowledge + Next Question in {req.language})"
}}

If all required fields (based on harvest status) are filled, set 'ai_reply' to: {lang_strings.get('all_done')}

STRICT: Return ONLY valid JSON. Address the user as 'Farmer'. No English in the reply.
"""

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        reply_json = json.loads(completion.choices[0].message.content)
        return reply_json

    except Exception as e:
        import traceback
        print(f"Extraction error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
can check maturity.
- Phrase the question creatively in {req.language} script only."""
        elif req.step == "StorageAudit":
             schema_instructions = f"""Return JSON with: {{'storage_type': 'Open Field'/'Shaded'/'Cold Storage'/null, 'health_issue': boolean/null, 'ai_reply': 'string'}}.
- Extract storage_type.
- DO NOT set health_issue to false unless the user explicitly says "all good" or "no problems".
- IF `health_issue` is null, YOUR REPLY MUST END BY ASKING in {req.language} script: "Are there any health issues, spots, or problems on your crop?"
- IF `health_issue` is false, YOUR REPLY MUST END BY ASKING in {req.language} script: "How will you be transporting your produce? Two wheeler, tractor, or pickup truck?"
- DO NOT proceed to TransitConfig or ask about transport until the farmer confirms if there are problems or not.
- Use {req.language} script only."""
        elif req.step == "HealthAudit":
             schema_instructions = f"""Return JSON with: {{'ai_reply': 'string'}}.
- Acknowledge in {req.language} script that you are waiting for a photo of the crop issues.
- Use {req.language} script only."""
        elif req.step == "MaturityCheck":
             schema_instructions = f"""Return JSON with: {{'sowing_date': 'YYYY-MM-DD'/null, 'ai_reply': 'string'}}.
- If extracted, provide maturity insight in {req.language} script and say you'll notify them when it's harvest time.
- Moving to Success Dashboard."""
        elif req.step == "TransitConfig":
             schema_instructions = f"""Return JSON with: {{'transport_type': 'Two Wheeler'/'Tractor'/'Pickup'/'Covered Van'/null, 'ai_reply': 'string'}}.
- If extracted, congratulate them in {req.language} script and say you are taking them to the main dashboard.
- If the user says "no issues" or "ignore health" here, move on.
- Use {req.language} script only."""
        elif req.step == "FinalVerdict":
             schema_instructions = "Return JSON with: {'yield_quintals': number/null, 'ai_reply': 'string'}. If yield is present, ask the success question."
        else:
             schema_instructions = "Return JSON with: {'ai_reply': 'string'}"

        system_prompt = f"""You are the MittiMitra Agri-Vakeel Assistant. Your ONLY goal is to extract farmer data into JSON.
You MUST communicate with the farmer ONLY in {req.language} script. 

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
2. The 'ai_reply' MUST be in {req.language} script. NEVER use English for the 'ai_reply' if the language is not English.
3. If a field is NOT 'Unknown' in the CONTEXT above, you MUST NOT ask for it again.
4. DO NOT use conversational filler unless it's part of a brief acknowledgement in {req.language}.
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
