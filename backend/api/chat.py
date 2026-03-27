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
        "location_received": "Location received!",
        "all_done": "Calibration complete. Your profit optimization dashboard is now ready."
    },
    "Hindi": {
        "ask_consent": "नमस्ते! मैं मिट्टीमित्र हूँ। आपके लिए सबसे अच्छे लाभ खोजने के लिए, मुझे DPDP अधिनियम 2023 के तहत आपके जीपीएस और फसल डेटा का उपयोग करने की अनुमति चाहिए। क्या मैं आगे बढ़ सकता हूँ?",
        "ask_crop": "आज हम कौन सी फसल पर काम कर रहे हैं?",
        "ask_yield": "इस फसल के लिए आपका अनुमानित उत्पादन कितना है (क्विंटल या क्रेट में)?",
        "ask_location": "आपके खेत का नक्शा बनाने और स्थानीय मंडियों को खोजने के लिए, मुझे आपके जीपीएस स्थान की आवश्यकता है। क्या यह ठीक है?",
        "ask_storage": "आप अपनी फसल कहाँ रख रहे हैं? (खुले खेत में, शेड में या कोल्ड स्टोरेज में)",
        "ask_health": "क्या वे स्वस्थ दिखते हैं, या आपने कोई धब्बे या अनियमितताएं देखी हैं? (हाँ/नहीं)",
        "ask_visual_audit": "समझ गया। कृपया मुझे कैमरे के माध्यम से एक नज़दीकी नमूना दिखाएं ताकि मैं जोखिमों की जांच कर सकूं।",
        "ask_transport": "आप अपनी उपज का परिवहन कैसे करेंगे? दोपहिया, ट्रैक्टर ट्रॉली, या पिकअप ट्रक?",
        "ask_harvest_status": "क्या ये फसलें पहले ही काटी जा चुकी हैं, या आप अभी भी उन्हें काटना शुरू करने का निर्णय ले रहे हैं?",
        "ask_sowing_date": "आपने बीज कब बोया था?",
        "location_received": "स्थान प्राप्त हुआ!",
        "all_done": "कैलिब्रेशन पूरा हुआ। आपका लाभ अनुकूलन डैशबोर्ड अब तैयार है।"
    },
    "Marathi": {
        "ask_consent": "नमस्कार! मी मिट्टीमित्र आहे. तुमच्यासाठी सर्वोत्तम नफा शोधण्यासाठी, मला DPDP कायदा 2023 अंतर्गत तुमचा जीपीएस आणि पिकाचा डेटा वापरण्याची परवानगी हवी आहे. मी पुढे जाऊ शकतो का?",
        "ask_crop": "आज आपण कोणत्या पिकावर काम करत आहोत?",
        "ask_yield": "या पिकासाठी तुमचे अंदाजे उत्पन्न किती आहे (क्विंटल किंवा क्रेटमध्ये)?",
        "ask_location": "तुमच्या शेताचा नकाशा तयार करण्यासाठी आणि स्थानिक मंड्या शोधण्यासाठी, मला तुमचे जीपीएस लोकेशन हवे आहे. चालेल का?",
        "ask_storage": "तुम्ही तुमचा माल कोठे ठेवत आहात? (खुल्या शेतात, शेडमध्ये किंवा कोल्ड स्टोअरेजमध्ये)",
        "ask_health": "ते निरोगी दिसतात की तुम्हाला काही डाग किंवा अनियमितता दिसली आहे? (हो/नाही)",
        "ask_visual_audit": "समजले. कृपया मला कॅमेऱ्याद्वारे एक जवळचा नमुना दाखवा जेणेकरून मी जोखमींची तपासणी करू शकेन.",
        "ask_transport": "तुम्ही तुमचा माल कसा नेणार आहात? दुचाकी, ट्रॅक्टर ट्रॉली किंवा पिकअप ट्रक?",
        "ask_harvest_status": "या पिकांची कापणी आधीच झाली आहे, की तुम्ही अजून ती सुरू करण्याचा विचार करत आहात?",
        "ask_sowing_date": "तुम्ही बियाणे कधी पेरले होते?",
        "location_received": "स्थान प्राप्त झाले!",
        "all_done": "कॅलिब्रेशन पूर्ण झाले. तुमचे नफा ऑप्टिमायझेशन डॅशबोर्ड आता तयार आहे."
    },
    "Telugu": {
        "ask_consent": "నమస్కారం! నేను మిట్టిమిత్ర. మీకు ఉత్తమ లాభాలను కనుగొనడానికి, DPDP చట్టం 2023 ప్రకారం మీ GPS మరియు పంట డేటాను ఉపయోగించడానికి నాకు మీ అనుమతి అవసరం. నేను కొనసాగించవచ్చా?",
        "ask_crop": "ఈ రోజు మనం ఏ పంటపై పని చేస్తున్నాము?",
        "ask_yield": "ఈ పంటకు మీ అంచనా దిగుబడి ఎంత (క్వింటాళ్లు లేదా క్రేట్లలో)?",
        "ask_location": "మీ పొలాన్ని మ్యాప్ చేయడానికి మరియు స్థానిక మండీలను కనుగొనడానికి, నాకు మీ GPS స్థానం అవసరం. అది సరేనా?",
        "ask_storage": "మీరు మీ పంటను ఎక్కడ ఉంచుతున్నారు? (బహిరంగ ప్రదేశంలో, షెడ్డులో లేదా కోల్డ్ స్టోరేజీలలో)",
        "ask_health": "అవి ఆరోగ్యంగా కనిపిస్తున్నాయా, లేదా మీరు ఏవైనా మచ్చలు లేదా అక్రమాలను గమన్నించారా? (అవును/కాదు)",
        "ask_visual_audit": "అర్థమైంది. దయచేసి కెమెరా ద్వారా నాకు దగ్గరి నమూనాను చూపండి, తద్వారా నేను నష్టాలను తనిఖీ చేయగలను.",
        "ask_transport": "మీరు మీ సరుకును రవాణా చేస్తారు? ద్విచక్ర వాహనం, ట్రాక్టర్ ట్రాలీ లేదా పికప్ ట్రక్?",
        "ask_harvest_status": "ఈ పంటలు ఇప్పటికే కోయబడ్డాయా, లేదా మీరు ఇంకా కోత ప్రారంభించాలని నిర్ణయిస్తున్నారా?",
        "ask_sowing_date": "మీరు విత్తనాలు ఎప్పుడు వేశారు?",
        "location_received": "స్థానం స్వీకరించబడింది!",
        "all_done": "అంకగణితం పూర్తయింది. మీ లాభాల ఆప్టిమైజేషన్ డ్యాష్‌బోర్డ్ ఇప్పుడు సిద్ధంగా ఉంది."
    },
    "Tamil": {
        "ask_consent": "வணக்கம்! நான் மிட்டிமித்ரா. உங்களுக்குச் சிறந்த லாபத்தைக் கண்டறிய, DPDP சட்டம் 2023 இன் படி உங்கள் ஜிபிஎஸ் மற்றும் பயிர் தரவைப் பயன்படுத்த எனக்கு அனுமதி தேவை. நான் தொடரலாமா?",
        "ask_crop": "இன்று நாம் என்ன பயிர் செய்கிறோம்?",
        "ask_yield": "இந்த பயிரின் மதிப்பிடப்பட்ட விளைச்சல் எவ்வளவு (குவிண்டால் அல்லது பெட்டிகளில்)?",
        "ask_location": "உங்கள் வயலை வரைபடமாக்கி உள்ளூர் மண்டிகளைக் கண்டறிய, உங்கள் ஜிபிஎஸ் இருப்பிடம் எனக்குத் தேவை. ஓகேவா?",
        "ask_storage": "உங்கள் அறுவடையை எங்கே வைத்துள்ளீர்கள்? (திறந்த வெளி, கொட்டகை அல்லது குளிர்பதன கிடங்கு)",
        "ask_health": "அவை ஆரோக்கியமாகத் தெரிகிறதா, அல்லது ஏதேனும் புள்ளிகள் அல்லது மாற்றங்களைக் கவனித்தீர்களா? (ஆம்/இல்லை)",
        "ask_visual_audit": "புரிந்தது. தயவுசெய்து கேமரா மூலம் நெருக்கமான மாதிரியைக் காட்டுங்கள், இதனால் நான் அபாயங்களைச் சரிபார்க்க முடியும்.",
        "ask_transport": "உங்கள் விளைபொருட்களை எப்படி கொண்டு செல்வீர்கள்? டூ வீலர், டிராக்டர் டிராலி அல்லது பிக்கப் டிரக்?",
        "ask_harvest_status": "இந்தப் பயிர்கள் ஏற்கனவே அறுவடை செய்யப்பட்டுவிட்டதா, அல்லது எப்போது அறுவடை செய்ய வேண்டும் என்று முடிவு செய்கிறீர்களா?",
        "ask_sowing_date": "நீங்கள் எப்போது விதைத்தீர்கள்?",
        "location_received": "இடம் பெறப்பட்டது!",
        "all_done": "அளவுத்திருத்தம் முடிந்தது. உங்கள் லாப மேம்பாட்டு டேஷ்போர்டு இப்போது தயாராக உள்ளது."
    },
    "Gujarati": {
        "ask_consent": "નમસ્તે! હું મિત્તીમિત્ર છું. તમારા માટે શ્રેષ્ઠ નફો શોધવા માટે, મારે DPDP એક્ટ 2023 હેઠળ તમારા જીપીએસ અને પાકના ડેટાનો ઉપયોગ કરવાની મંજૂરી જોઈએ છે. શું હું આગળ વધી શકું?",
        "ask_crop": "આજે આપણે કયા પાક પર કામ કરી રહ્યા છીએ?",
        "ask_yield": "આ પાક માટે તમારી અંદાજિત ઉપજ કેટલી છે (ક્વિન્ટલ અથવા ક્રેટમાં)?",
        "ask_location": "તમારા ખેતરનો નકશો બનાવવા અને સ્થાનિક મંડીઓ શોધવા માટે, મારે તમારા જીપીએસ સ્થાનની જરૂર છે. શું તે બરાબર છે?",
        "ask_storage": "તમે તમારી લણણી ક્યાં રાખી રહ્યા છો? (ખુલ્લા ખેતરમાં, શેડમાં અથવા કોલ્ડ સ્ટોરેજમાં)",
        "ask_health": "શું તેઓ સ્વસ્થ દેખાય છે, અથવા તમે કોઈ ડાઘ કે અસમાનતા જોઈ છે? (હા/ના)",
        "ask_visual_audit": "સમજી ગયો. કૃપા કરીને મને કેમેરા દ્વારા નજીકનો નમૂનો બતાવો જેથી હું જોખમો તપાસી શકું.",
        "ask_transport": "તમે તમારો માલ કેવી રીતે લઈ જશો? ટુ વ્હીલર, ટ્રેક્ટર ટ્રોલી કે પિકઅપ ટ્રક?",
        "ask_harvest_status": "શું આ પાકની લણણી થઈ ગઈ છે, અથવા તમે હજુ પણ લણણી શરૂ કરવાનું વિચારી રહ્યા છો?",
        "ask_sowing_date": "તમે બીજ ક્યારે વાવ્યા હતા?",
        "location_received": "સ્થાન પ્રાપ્ત થયું!",
        "all_done": "કેલિબ્રેશન પૂર્ણ થયું. તમારું પ્રોફિટ ઓપ્ટિમાઇઝેશન ડેશબોર્ડ હવે તૈયાર છે."
    },
    "Punjabi": {
        "ask_consent": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਮਿੱਟੀਮਿੱਤਰ ਹਾਂ। ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਮੁਨਾਫ਼ਾ ਲੱਭਣ ਲਈ, ਮੈਨੂੰ DPDP ਐਕਟ 2023 ਦੇ ਤਹਿਤ ਤੁਹਾਡੇ ਜੀਪੀਐਸ ਅਤੇ ਫ਼ਸਲ ਦੇ ਡੇਟਾ ਦੀ ਵਰਤੋਂ ਕਰਨ ਦੀ ਇਜਾਜ਼ਤ ਚਾਹੀਦੀ ਹੈ। ਕੀ ਮੈਂ ਅੱਗੇ ਵਧ ਸਕਦਾ ਹਾਂ?",
        "ask_crop": "ਅੱਜ ਅਸੀਂ ਕਿਹੜੀ ਫ਼ਸਲ 'ਤੇ ਕੰਮ ਕਰ ਰਹੇ ਹਾਂ?",
        "ask_yield": "ਇਸ ਫ਼ਸਲ ਲਈ ਤੁਹਾਡੀ ਅੰਦਾਜ਼ਨ ਪੈਦਾਵਾਰ ਕਿੰਨੀ ਹੈ (ਕੁਇੰਟਲ ਜਾਂ ਕਰੇਟ ਵਿੱਚ)?",
        "ask_location": "ਤੁਹਾਡੇ ਖੇਤ ਦਾ ਨਕਸ਼ਾ ਬਣਾਉਣ ਅਤੇ ਸਥਾਨਕ ਮੰਡੀਆਂ ਲੱਭਣ ਲਈ, ਮੈਨੂੰ ਤੁਹਾਡੀ GPS ਲੋਕੇਸ਼ਨ ਦੀ ਲੋੜ ਹੈ। ਕੀ ਇਹ ਠੀਕ ਹੈ?",
        "ask_storage": "ਤੁਸੀਂ ਆਪਣੀ ਫ਼ਸਲ ਕਿੱਥੇ ਰੱਖ ਰਹੇ ਹੋ? (ਖੁੱਲ੍ਹੇ ਖੇਤ ਵਿੱਚ, ਸ਼ੈੱਡ ਵਿੱਚ ਜਾਂ ਕੋਲਡ ਸਟੋਰੇਜ ਵਿੱਚ)",
        "ask_health": "ਕੀ ਉਹ ਤੰਦਰੁਸਤ ਦਿਖਾਈ ਦਿੰਦੇ ਹਨ, ਜਾਂ ਕੀ ਤੁਸੀਂ ਕੋਈ ਧੱਬੇ ਜਾਂ ਅਨਿਯਮਿਤਤਾਵਾਂ ਦੇਖੀਆਂ ਹਨ? (ਹਾਂ/ਨਹੀਂ)",
        "ask_visual_audit": "ਸਮਝ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਮੈਨੂੰ ਕੈਮਰੇ ਰਾਹੀਂ ਇੱਕ ਨਜ਼ਦੀਕੀ ਨਮੂਨਾ ਦਿਖਾਓ ਤਾਂ ਜੋ ਮੈਂ ਜੋਖਮਾਂ ਦੀ ਜਾਂਚ ਕਰ ਸਕਾਂ।",
        "ask_transport": "ਤੁਸੀਂ ਆਪਣੀ ਉਪਜ ਦੀ ਢੋਆ-ਢੁਆਈ ਕਿਵੇਂ ਕਰੋਗੇ? ਦੋ ਪਹੀਆ ਵਾਹਨ, ਟ੍ਰੈਕਟਰ ਟ੍ਰਾਲੀ, ਜਾਂ ਪਿਕਅੱਪ ਟਰੱਕ?",
        "ask_harvest_status": "ਕੀ ਇਹ ਫ਼ਸਲਾਂ ਪਹਿਲਾਂ ਹੀ ਕੱਟੀਆਂ ਜਾ ਚੁੱਕੀਆਂ ਹਨ, ਜਾਂ ਤੁਸੀਂ ਅਜੇ ਵੀ ਕਟਾਈ ਸ਼ੁਰੂ ਕਰਨ ਦਾ ਫੈਸਲਾ ਕਰ ਰਹే ਹੋ?",
        "ask_sowing_date": "ਤੁਸੀਂ ਬੀਜ ਕਦੋਂ ਬੀਜੇ ਸਨ?",
        "location_received": "ਟਿਕਾਣਾ ਪ੍ਰਾਪਤ ਹੋ ਗਿਆ ਹੈ!",
        "all_done": "ਕੈਲੀਬ੍ਰੇਸ਼ਨ ਪੂਰੀ ਹੋ ਗਈ ਹੈ। ਤੁਹਾਡਾ ਮੁਨਾਫ਼ਾ ਅਨੁਕੂਲਨ ਡੈਸ਼ਬੋਰਡ ਹੁਣ ਤਿਆਰ ਹੈ।"
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
    Injects the real-time dashboard data into the AI prompt.
    """
    status = context.get("status", "UNKNOWN")
    best_mandi = context.get("best_mandi", "Unknown")
    total_profit = context.get("total_net_profit", 0)
    per_quintal = context.get("net_realization_inr_per_quintal", 0)
    yield_qtl = context.get("yield_quintals", 1)
    weather = context.get("weather", {})
    mandi = context.get("mandi_stats", {})
    
    prompt = f"""You are the MittiMitra Agri-Vakeel, an expert farming advisor.
Respond ONLY in {language}. Use Devanagari/Regional script. 
Dashboad Data: Status {status}, Best Mandi {best_mandi}, Profit ₹{total_profit}.
Farmer Address: Ji Kisan Bhai (Hindi) / Shetkari Mitra (Marathi) etc.
"""
    return prompt

@router.post("/onboarding_extract")
def onboarding_extract(req: OnboardingExtractRequest):
    """
    Hardened greedy extraction logic (DPDP 2023 Compliant).
    """
    if not client:
        return {
            "consent_granted": True,
            "crop": "Cotton",
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
4. DPDP CONSENT: Set 'consent_granted': true if user agrees OR provides data.
5. LOCATION CONSENT: Set 'location_provided': true if user says 'yes', 'ok', 'theek hai', etc. to the location request.
6. EXTRACTION: If user mentions a storage type (shed, cold storage, field), set 'storage_type' accordingly.
7. HEALTH STATUS: Set 'health_issue': false if user says 'no issues', 'healthy', 'theek hai', 'sab sahi hai'. Set 'health_issue': true if user says 'spots', 'bugs', 'bimaari', 'bad'.
8. RESILIENCY: If user says 'don't know', 'not sure', or gives ambiguous answers for non-critical fields (yield, storage, transit, sowing date), assign a sensible default (e.g., 50 quintals, 'Field', 'Today') and MOVE ON to the next question. DO NOT LOOP.

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
  "ai_reply": "string (Address 'Farmer' and Ask for NEXT missing field in {req.language})"
}}
"""

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        reply_json = json.loads(completion.choices[0].message.content)

        updated_consent = reply_json.get("consent_granted") or req.consent_granted or bool(reply_json.get("crop") or reply_json.get("yield_quintals"))
        updated_crop = reply_json.get("crop") or req.current_crop
        updated_yield = reply_json.get("yield_quintals") or req.current_yield
        updated_location = reply_json.get("location_provided") or req.location_provided
        updated_harvest = reply_json.get("harvest_status") or req.harvest_status
        
        reply_json["consent_granted"] = updated_consent

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

        import re
        ack = re.sub(r'[^.!?]+\?', '', reply_json.get("ai_reply", "")).strip()
        
        # Immediate Location Acknowledgment logic
        just_received_location = updated_location and (req.location_provided is False or req.location_provided is None)
        prefix = f"{lang_strings.get('location_received', 'Location received!')} " if just_received_location else ""

        if not next_q:
            reply_json["ai_reply"] = f"{prefix}{ack} {lang_strings['all_done']}".strip()
        else:
            reply_json["ai_reply"] = f"{prefix}{ack} {next_q}".strip()
            
        return reply_json

    except Exception as e:
        import traceback
        print(f"Extraction error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts")
def text_to_speech(req: TTSRequest):
    try:
        lang_map = {"English": "en", "Hindi": "hi", "Marathi": "mr", "Telugu": "te", "Tamil": "ta", "Gujarati": "gu", "Punjabi": "pa"}
        tts = gTTS(text=req.text, lang=lang_map.get(req.language, "en"), slow=False)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return StreamingResponse(mp3_fp, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tts")
def text_to_speech_stream(text: str = Query(...), language: str = Query("English")):
    try:
        lang_map = {"English": "en", "Hindi": "hi", "Marathi": "mr", "Telugu": "te", "Tamil": "ta", "Gujarati": "gu", "Punjabi": "pa"}
        tts = gTTS(text=text, lang=lang_map.get(language, "en"), slow=False)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return StreamingResponse(io.BytesIO(mp3_fp.getvalue()), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_vakeel_brief(context: Dict[str, Any], language: str) -> str:
    return "Recommendation successfully processed."
