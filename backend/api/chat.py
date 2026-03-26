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
        "all_done": "कैलिब्रेशन पूरा हुआ। आपका लाभ अनुकूलन डैशबोर्ड अब तैयार है।"
    },
    "Marathi": {
        "ask_consent": "नमस्कार! मी मिट्टीमित्र आहे. तुमच्यासाठी सर्वोत्तम नफा शोधण्यासाठी, मला DPDP कायदा 2023 अंतर्गत तुमचा जीपीएस आणि पिकाचा डेटा वापरण्याची परवानगी हवी आहे. मी पुढे जाऊ शकतो का?",
        "ask_crop": "आज आपण कोणत्या पिकावर काम करत आहोत?",
        "ask_yield": "या पिकासाठी तुमचे अंदाजे उत्पन्न किती आहे (क्विंटल किंवा क्रेटमध्ये)?",
        "ask_location": "तुमच्या शेताचा नकाशा तयार करण्यासाठी आणि स्थानिक मंड्या शोधण्यासाठी, मला तुमचे जीपीएस लोकेशन हवे आहे. चालेल का?",
        "ask_storage": "तुम्ही तुमचा माल कोठे ठेवत आहात? (खुल्या शेतात, शेडमध्ये किंवा कोल्ड स्टोरेजमध्ये)",
        "ask_health": "ते निरोगी दिसतात की तुम्हाला काही डाग किंवा अनियमितता दिसली आहे? (हो/नाही)",
        "ask_visual_audit": "समजले. कृपया मला कॅमेऱ्याद्वारे एक जवळचा नमुना दाखवा जेणेكرून मी जोखमींची तपासणी करू शकेन.",
        "ask_transport": "तुम्ही तुमचा माल कसा नेणार आहात? दुचाकी, ट्रॅक्टर ट्रॉली किंवा पिकअप ट्रक?",
        "ask_harvest_status": "या पिकांची कापणी आधीच झाली आहे, की तुम्ही अजून ती सुरू करण्याचा विचार करत आहात?",
        "ask_sowing_date": "तुम्ही बियाणे कधी पेरले होते?",
        "all_done": "कॅलिब्रेशन पूर्ण झाले. तुमचे नफा ऑप्टिमायझेशन डॅशबोर्ड आता तयार आहे."
    },
    "Telugu": {
        "ask_consent": "నమస్కారం! నేను మిట్టిమిత్ర. మీకు ఉత్తమ లాభాలను కనుగొనడానికి, DPDP చట్టం 2023 ప్రకారం మీ GPS మరియు పంట డేటాను ఉపయోగించడానికి నాకు మీ అనుమతి అవసరం. నేను కొనసాగించవచ్చా?",
        "ask_crop": "ఈ రోజు మనం ఏ పంటపై పని చేస్తున్నాము?",
        "ask_yield": "ఈ పంటకు మీ అంచనా దిగుబడి ఎంత (క్వింటాళ్ళు లేదా క్రేట్లలో)?",
        "ask_location": "మీ పొలాన్ని మ్యాప్ చేయడానికి మరియు స్థానిక మండీలను కనుగొనడానికి, నాకు మీ GPS స్థానం అవసరం. అది సరేనా?",
        "ask_storage": "మీరు మీ పంటను ఎక్కడ ఉంచుతున్నారు? (బహిరంగ ప్రదేశంలో, షెడ్డులో లేదా కోల్డ్ స్టోరేజీలో)",
        "ask_health": "అవి ఆరోగ్యంగా కనిపిస్తున్నాయా, లేదా మీరు ఏవైనా మచ్చలు లేదా అక్రమాలను గమనించారా? (అవును/కాదు)",
        "ask_visual_audit": "అర్థమైంది. దయచేసి కెమెరా ద్వారా నాకు దగ్గరి నమూనాను చూపండి, తద్వారా నేను నష్టాలను తనిఖీ చేయగలను.",
        "ask_transport": "మీరు మీ సరుకును రవాణా చేస్తారు? ద్విచక్ర వాహనం, ట్రాక్టర్ ట్రాలీ లేదా పికప్ ట్రక్?",
        "ask_harvest_status": "ఈ పంటలు ఇప్పటికే కోయబడ్డాయా, లేదా మీరు ఇంకా కోత ప్రారంభించాలని నిర్ణయిస్తున్నారా?",
        "ask_sowing_date": "మీరు విత్తనాలు ఎప్పుడు వేశారు?",
        "all_done": "అంకగణితం పూర్తయింది. మీ లాభాల ఆప్టిమైజేషన్ డ్యాష్‌బోర్డ్ ఇప్పుడు సిద్ధంగా ఉంది."
    },
    "Tamil": {
        "ask_consent": "வணக்கம்! நான் மிட்டிமித்ரா. உங்களுக்குச் சிறந்த லாபத்தைக் கண்டறிய, DPDP சட்டம் 2023 இன் படி உங்கள் ஜிபிஎஸ் மற்றும் பயிர் தரவைப் பயன்படுத்த எனக்கு அனுமதி தேவை. நான் தொடரலாமா?",
        "ask_crop": "இன்று நாம் என்ன பயிர் செய்கிறோம்?",
        "ask_yield": "இந்தப் பயிரின் மதிப்பிடப்பட்ட விளைச்சல் எவ்வளவு (குவிண்டால் அல்லது பெட்டிகளில்)?",
        "ask_location": "உங்கள் வயலை வரைபடமாக்கி உள்ளூர் மண்டிகளைக் கண்டறிய, உங்கள் ஜிபிஎஸ் இருப்பிடம் எனக்குத் தேவை. ஓகேவா?",
        "ask_storage": "உங்கள் அறுவடையை எங்கே வைத்திருக்கிறீர்கள்? (திறந்த வெளி, கொட்டகை அல்லது குளிர்பதன கிடங்கு)",
        "ask_health": "அவை ஆரோக்கியமாகத் தெரிகிறதா, அல்லது ஏதேனும் புள்ளிகள் அல்லது மாற்றங்களைக் கவனித்தீர்களா? (ஆம்/இல்லை)",
        "ask_visual_audit": "புரிந்தது. தயவுசெய்து கேமரா மூலம் நெருக்கமான மாதிரியைக் காட்டுங்கள், இதனால் நான் அபாயங்களைச் சரிபார்க்க முடியும்.",
        "ask_transport": "உங்கள் விளைபொருட்களை எப்படி கொண்டு செல்வீர்கள்? டூ வீலர், டிராக்டர் டிராலி அல்லது பிக்கப் டிரக்?",
        "ask_harvest_status": "இந்தப் பயிர்கள் ஏற்கனவே அறுவடை செய்யப்பட்டுவிட்டதா, அல்லது எப்போது அறுவடை செய்ய வேண்டும் என்று முடிவு செய்கிறீர்களா?",
        "ask_sowing_date": "நீங்கள் எப்போது விதைத்தீர்கள்?",
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
        "all_done": "કેલિબ્રેશન પૂર્ણ થયું. તમારું પ્રોફિટ ઓપ્ટિમાઇઝેશન ડેશબોર્ડ હવે તૈયાર છે."
    },
    "Punjabi": {
        "ask_consent": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਮਿੱਟੀਮਿੱਤਰ ਹਾਂ। ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਮੁਨਾਫ਼ਾ ਲੱਭਣ ਲਈ, ਮੈਨੂੰ DPDP ਐਕਟ 2023 ਦੇ ਤਹਿਤ ਤੁਹਾਡੇ ਜੀਪੀਐਸ ਅਤੇ ਫ਼ਸਲ ਦੇ ਡੇਟਾ ਦੀ ਵਰਤੋਂ ਕਰਨ ਦੀ ਇਜਾਜ਼ਤ ਚਾਹੀਦੀ ਹੈ। ਕੀ ਮੈਂ ਅੱਗੇ ਵਧ ਸਕਦਾ ਹਾਂ?",
        "ask_crop": "ਅੱਜ ਅਸੀਂ ਕਿਹੜੀ ਫ਼ਸਲ 'ਤੇ ਕੰਮ ਕਰ ਰਹੇ ਹਾਂ?",
        "ask_yield": "ਇਸ ਫ਼ਸਲ ਲਈ ਤੁਹਾਡੀ ਅੰਦਾਜ਼ਨ ਪੈਦਾਵਾਰ ਕਿੰਨੀ ਹੈ (ਕੁਇੰਟਲ ਜਾਂ ਕਰੇਟ ਵਿੱਚ)?",
        "ask_location": "ਤੁਹਾਡੇ ਖेਤ ਦਾ ਨਕਸ਼ਾ ਬਣਾਉਣ ਅਤੇ ਸਥਾਨਕ ਮੰਡੀਆਂ ਲੱਭਣ ਲਈ, ਮੈਨੂੰ ਤੁਹਾਡੀ GPS ਲੋਕੇਸ਼ਨ ਦੀ ਲੋੜ ਹੈ। ਕੀ ਇਹ ਠੀਕ ਹੈ?",
        "ask_storage": "ਤੁਸੀਂ ਆਪਣੀ ਫ਼ਸਲ ਕਿੱਥੇ ਰੱਖ ਰਹੇ ਹੋ? (ਖੁੱਲ੍ਹੇ ਖੇਤ ਵਿੱਚ, ਸ਼ੈੱਡ ਵਿੱਚ ਜਾਂ ਕੋਲਡ ਸਟੋਰੇਜ ਵਿੱਚ)",
        "ask_health": "ਕੀ ਉਹ ਤੰਦਰੁਸਤ ਦਿਖਾਈ ਦਿੰਦੇ ਹਨ, ਜਾਂ ਕੀ ਤੁਸੀਂ ਕੋਈ ਧੱਬੇ ਜਾਂ ਅਨਿਯਮਿਤਤਾਵਾਂ ਦੇਖੀਆਂ ਹਨ? (ਹਾਂ/ਨਹੀਂ)",
        "ask_visual_audit": "ਸਮਝ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਮੈਨੂੰ ਕੈਮਰੇ ਰਾਹੀਂ ਇੱਕ ਨਜ਼ਦੀਕੀ ਨਮੂਨਾ ਦਿਖਾਓ ਤਾਂ ਜੋ ਮੈਂ ਜੋਖਮਾਂ ਦੀ ਜਾਂਚ ਕਰ ਸਕਾਂ।",
        "ask_transport": "ਤੁਸੀਂ ਆਪਣੀ ਉਪਜ ਦੀ ਢੋਆ-ਢੁਆਈ ਕਿਵੇਂ ਕਰੋਗੇ? ਦੋ ਪਹੀਆ ਵਾਹਨ, ਟ੍ਰੈਕਟਰ ਟ੍ਰਾਲੀ, ਜਾਂ ਪਿਕਅੱਪ ਟਰੱਕ?",
        "ask_harvest_status": "ਕੀ ਇਹ ਫ਼ਸਲਾਂ ਪਹਿਲਾਂ ਹੀ ਕੱਟੀਆਂ ਜਾ ਚੁੱਕੀਆਂ ਹਨ, ਜਾਂ ਤੁਸੀਂ ਅਜੇ ਵੀ ਕਟਾਈ ਸ਼ੁਰੂ ਕਰਨ ਦਾ ਫੈਸਲਾ ਕਰ ਰਹੇ ਹੋ?",
        "ask_sowing_date": "ਤੁਸੀਂ ਬੀਜ ਕਦੋਂ ਬੀਜੇ ਸਨ?",
        "all_done": "ਕੈਲੀਬ੍ਰੇਸ਼ਨ ਪੂਰੀ ਹੋ ਗਈ ਹੈ। ਤੁਹਾਡਾ ਮੁਨਾਫ਼ਾ ਅਨੁਕੂਲਨ ਡੈਸ਼ਬੋਰਡ ਹੁਣ ਤਿਆਰ ਹੈ।"
    }
}
�� DPDP એક્ટ 2023 હેઠળ તમારા જીપીએસ અને પાકના ડેટાનો ઉપયોગ કરવાની મંજૂરી જોઈએ છે. શું હું આગળ વધી શકું?",
        "ask_crop": "આજે આપણે કયા પાક પર કામ કરી રહ્યા છીએ?",
        "ask_yield": "આ પાક માટે તમારી અંદાજિત ઉપજ કેટલી છે (ક્વિન્ટલ અથવા ક્રેટમાં)?",
        "ask_location": "તમારા ખેતરનો નકશો બનાવવા અને સ્થાનિક મંડીઓ શોધવા માટે, મારે તમારા જીપીએસ સ્થાનની જરૂર છે. શું તે બરાબર છે?",
        "ask_storage": "તમે તમારી લણણી ક્યાં રાખી રહ્યા છો? (ખુલ્લા ખેતરમાં, શેડમાં અથવા કોલ્ડ સ્ટોરેજમાં)",
        "ask_health": "શું તેઓ સ્વસ્થ દેખાય છે, અથવા તમે કોઈ ડાઘ કે અસમાનતા જોઈ છે? (હા/ના)",
        "ask_visual_audit": "સમજી ગયો. કૃપા કરીને મને કેમેરા દ્વારા નજીકનો નમૂનો બતાવો જેથી હું જોખમો તપાસી શકું.",
        "ask_transport": "તમે તમારો માલ કેવી રીતે લઈ જશો? ટુ વ્હીલર, ટ્રેક્ટર ટ્રોલી કે પિકઅપ ટ્રક?",
        "ask_harvest_status": "શું આ પાકની લણણી થઈ ગઈ છે, અથવા તમે હજુ પણ લણણી શરૂ કરવાનું વિચારી રહ્યા છો?",
        "ask_sowing_date": "તમે બીજ ક્યારે વાવ્યા હતા?",
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
        "ask_harvest_status": "ਕੀ ਇਹ ਫ਼ਸਲਾਂ ਪਹਿਲਾਂ ਹੀ ਕੱਟੀਆਂ ਜਾ ਚੁੱਕੀਆਂ ਹਨ, ਜਾਂ ਤੁਸੀਂ ਅਜੇ ਵੀ ਕਟਾਈ ਸ਼ੁਰੂ ਕਰਨ ਦਾ ਫੈਸਲਾ ਕਰ ਰਹੇ ਹੋ?",
        "ask_sowing_date": "ਤੁਸੀਂ ਬੀਜ ਕਦੋਂ ਬੀਜੇ ਸਨ?",
        "all_done": "ਕੈਲੀਬ੍ਰੇਸ਼ਨ ਪੂਰੀ ਹੋ ਗਈ ਹੈ। ਤੁਹਾਡਾ ਮੁਨਾਫ਼ਾ ਅਨੁਕੂਲਨ ਡੈਸ਼ਬੋਰਡ ਹੁਣ ਤਿਆਰ ਹੈ।"
    }కోశారా?",
        "ask_sowing_date": "మీరు ఈ పంటను ఎప్పుడు వేశారు?",
        "all_done": "అభినందనలు! మేము అన్ని వివరాలను సేకరించాము. ఇక డ్యాష్‌బోర్డ్‌కు వెళ్దాం."
    },
    "Tamil": {
        "ask_consent": "நீங்கள் இங்கே வந்ததில் எனக்கு மிக்க மகிழ்ச்சி! தொடங்குவதற்கு, உங்கள் தகவலை என்னுடன் பகிர்ந்து கொள்ள நீங்கள் தயார் என்பதை உறுதிப்படுத்தவும். நாம் தொடரலாமா?",
        "ask_crop": "இன்று நீங்கள் என்ன பயிர் செய்கிறீர்கள்?",
        "ask_yield": "இந்தப் பயிரின் மதிப்பிடப்பட்ட விளைச்சல் எத்தனை குவிண்டால்?",
        "ask_location": "உள்ளூர் சந்தைகளைக் கண்டறியவும் லாபத்தை அதிகரிக்கவும், உங்கள் ஜிபிஎஸ் இருப்பிடம் எனக்குத் தேவை. ஓகேவா?",
        "ask_storage": "உங்கள் அறுவடையை எங்கே வைத்திருக்கிறீர்கள்? (திறந்த வெளி, கொட்டகை அல்லது குளிர்பதன கிடங்கு)",
        "ask_health": "உங்கள் பயிரில் ஏதேனும் நோய் பாதிப்புகள் அல்லது பிரச்சனைகள் உள்ளதா? ஆம் அல்லது இல்லை?",
        "ask_visual_audit": "அப்படியானால், நான் தரத்தைச் சரிபார்க்க வேண்டும். தயவுசெய்து உங்கள் அறுவடையின் மாதிரியை எனக்குக் காட்ட முடியுமா? நான் இப்போது உங்கள் கேமராவைத் திறக்கிறேன்.",
        "ask_transport": "உங்கள் விளைபொருட்களை எப்படி கொண்டு செல்வீர்கள்? டூ வீலர், டிராக்டர் அல்லது பிக்கப் டிரக்?",
        "ask_harvest_status": "பயிர் அறுவடை செய்யப்பட்டுள்ளதா அல்லது இன்னும் காத்திருக்கிறீர்களா?",
        "ask_sowing_date": "நீங்கள் எப்போது விதைத்தீர்கள்?",
        "all_done": "வாழ்த்துக்கள்! அனைத்து விவரங்களையும் சேகரித்துவிட்டோம். இப்போது டேஷ்போர்டுக்கு செல்வோம்."
    },
    "Gujarati": {
        "ask_consent": "તમે અહીં આવ્યા તે બદલ મને આનંદ છે! શરૂ કરવા માટે, કૃપા કરીને પુષ્ટિ કરો કે તમે તમારી માહિતી મારી સાથે શેર કરવા માટે તૈયાર છો. શું આપણે આગળ વધીએ?",
        "ask_crop": "તમે આજે કયો પાક ઉગાડી રહ્યા છો?",
        "ask_yield": "આ પાક માટે તમારી અંદાજિત ઉપજ ક્વિન્ટલમાં કેટલી છે?",
        "ask_location": "સ્થાનિક બજારો શોધવા અને નફો વધારવા માટે, મારે તમારા જીપીએસ લોકેશનની જરૂર છે. શું તે બરાબર છે?",
        "ask_storage": "તમે તમારી લણણી ક્યાં રાખી રહ્યા છો? (ખુલ્લા ખેતરમાં, શેડમાં અથવા કોલ્ડ સ્ટોરેજમાં)",
        "ask_health": "શું તમારા પાકમાં કોઈ રોગ કે સમસ્યા છે? હા કે ના?",
        "ask_visual_audit": "તે કિસ્સામાં, મારે ગુણવત્તા તપાસવાની જરૂર છે. શું તમે કૃપા કરીને મને તમારા પાકનો નમૂનો બતાવી શકશો? હું અત્યારે તમારો કેમેરો ખોલી રહ્યો છું.",
        "ask_transport": "તમે તમારો માલ કેવી રીતે લઈ જશો? ટુ વ્હીલર, ટ્રેક્ટર કે પિકઅપ ટ્રક?",
        "ask_harvest_status": "શું તમારા પાકની લણણી થઈ ગઈ છે કે હજી બાકી છે?",
        "ask_sowing_date": "તમે આ પાકની વાવણી ક્યારે કરી હતી?",
        "all_done": "અભિનંદન! અમે બધી વિગતો એકત્રિત કરી છે. ચાલો હવે ડેશબોર્ડ પર જઈએ."
    },
    "Punjabi": {
        "ask_consent": "ਮੈਨੂੰ ਖੁਸ਼ੀ ਹੈ ਕਿ ਤੁਸੀਂ ਇੱਥੇ ਆਏ ਹੋ! ਸ਼ੁਰੂ ਕਰਨ ਲਈ, ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ ਕਿ ਤੁਸੀਂ ਆਪਣੀ ਜਾਣਕਾਰੀ ਮੇਰੇ ਨਾਲ ਸਾਂਝੀ ਕਰਨ ਲਈ ਤਿਆਰ ਹੋ। ਕੀ ਅਸੀਂ ਅੱਗੇ ਵਧੀਏ?",
        "ask_crop": "ਤੁਸੀਂ ਅੱਜ ਕਿਹੜੀ ਫ਼ਸਲ ਉਗਾ ਰਹੇ ਹੋ?",
        "ask_yield": "ਇਸ ਫ਼ਸਲ ਲਈ ਤੁਹਾਡੀ ਅੰਦਾਜ਼ਨ ਪੈਦਾਵਾਰ ਕੁਇੰਟਲਾਂ ਵਿੱਚ ਕਿੰਨੀ ਹੈ?",
        "ask_location": "ਸਥਾਨਕ ਮੰਡੀਆਂ ਲੱਭਣ ਅਤੇ ਮੁਨਾਫ਼ਾ ਵਧਾਉਣ ਲਈ, ਮੈਨੂੰ ਤੁਹਾਡੀ GPS ਲੋਕੇਸ਼ਨ ਦੀ ਲੋੜ ਹੈ। ਕੀ ਇਹ ਠੀਕ ਹੈ?",
        "ask_storage": "ਤੁਸੀਂ ਆਪਣੀ ਫ਼ਸਲ ਕਿੱਥੇ ਰੱਖ ਰਹੇ ਹੋ? (ਖੁੱਲ੍ਹੇ ਖੇਤ ਵਿੱਚ, ਸ਼ੈੱਡ ਵਿੱਚ ਜਾਂ ਕੋਲਡ ਸਟੋਰੇਜ ਵਿੱਚ)",
        "ask_health": "ਕੀ ਤੁਹਾਡੀ ਫ਼ਸਲ ਵਿੱਚ ਕੋਈ ਬਿਮਾਰੀ ਜਾਂ ਸਮੱਸਿਆ ਹੈ? ਹਾਂ ਜਾਂ ਨਾਂ?",
        "ask_visual_audit": "ਉਸ ਸਥਿਤੀ ਵਿੱਚ, ਮੈਨੂੰ ਗੁਣਵੱਤਾ ਦੀ ਜਾਂਚ ਕਰਨ ਦੀ ਲੋੜ ਹੈ। ਕੀ ਤੁਸੀਂ ਕਿਰਪਾ ਕਰਕੇ ਮੈਨੂੰ ਆਪਣੀ ਫਸਲ ਦਾ ਨਮੂਨਾ ਦਿਖਾ ਸਕਦੇ ਹੋ? ਮੈਂ ਹੁਣ ਤੁਹਾਡਾ ਕੈਮਰਾ ਖੋਲ੍ਹ ਰਿਹਾ ਹਾਂ।",
        "ask_transport": "ਤੁਸੀਂ ਆਪਣਾ ਮਾਲ ਕਿਵੇਂ ਲੈ ਕੇ ਜਾਓਗੇ? ਦੋਪਹੀਆ ਵਾਹਨ, ਟ੍ਰੈਕਟਰ ਜਾਂ ਪਿਕਅੱਪ ਟਰੱਕ?",
        "ask_harvest_status": "ਕੀ ਤੁਹਾਡੀ ਫ਼ਸਲ ਦੀ ਕਟਾਈ ਹੋ ਚੁੱਕੀ ਹੈ ਜਾਂ ਅਜੇ ਬਾਕੀ ਹੈ?",
        "ask_sowing_date": "ਤੁਸੀਂ ਇਹ ਫ਼ਸਲ ਕਦੋਂ ਬੀਜੀ ਸੀ?",
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
        TASK: Summarize why the farmer should {status} based on {best_mandi}, profit of ₹{total_profit}, and maturity of {ripeness}% ripeness.
        LANGUAGE: {language} (Response MUST be in this script).
        STYLE: Encouraging, concise, high-impact. Max 2 sentences.
        """
        
        if not client:
            return f"Agri-Vakeel: {status} at {best_mandi} for ₹{total_profit}."

        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            max_tokens=100
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in generate_vakeel_brief: {e}")
        return f"Agri-Vakeel: Recommendation successfully processed for {best_mandi}."
