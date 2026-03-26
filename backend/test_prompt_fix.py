from api.chat import build_system_prompt

mock_context = {
    "status": "GREEN",
    "best_mandi": "Akola",
    "total_net_profit": 15000,
    "net_realization_inr_per_quintal": 2800,
    "yield_quintals": 50,
    "weather": {"temperature_c": 32, "rain_probability_percent": 10},
    "mandi_stats": {"current_price": 2900},
    "shock_alert": {"is_shock": False},
    "oracle": {"maturity": {"current_maturity_pct": 95}, "verdict": {"verdict": "SELL"}}
}

def test_language(lang):
    print(f"\n--- TESTING LANGUAGE: {lang} ---")
    prompt = build_system_prompt(mock_context, lang)
    
    # Check for English constraints
    if lang == "English":
        if "Ji Kisan Bhai" in prompt:
            print("FAIL: Found Hindi greeting in English prompt!")
        elif "STRICT RULES FOR ENGLISH" not in prompt:
            print("FAIL: Missing English strict rules!")
        else:
            print("PASS: English prompt looks clean.")
            
    # Check for Hindi constraints
    if lang == "Hindi":
        if "Ji Kisan Bhai" not in prompt:
            print("FAIL: Missing Hindi greeting in Hindi prompt!")
        elif "STRICT RULES FOR HINDI" not in prompt:
            print("FAIL: Missing Hindi strict rules!")
        else:
            print("PASS: Hindi prompt looks clean.")

if __name__ == "__main__":
    test_language("English")
    test_language("Hindi")
