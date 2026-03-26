from api.chat import build_system_prompt
import io

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

def test_language(lang, file):
    file.write(f"\n--- TESTING LANGUAGE: {lang} ---\n")
    prompt = build_system_prompt(mock_context, lang)
    
    if lang == "English":
        # Check if the instruction TO USE the greeting is present (instead of just the string being anywhere)
        if "Address the farmer as 'Ji Kisan Bhai'" in prompt:
            file.write("FAIL: Instructions found TO USE 'Ji Kisan Bhai' in English prompt!\n")
        elif "STRICT RULES FOR ENGLISH" not in prompt:
            file.write("FAIL: Missing English strict rules!\n")
        else:
            file.write("PASS: English prompt looks clean.\n")
            
    if lang == "Hindi":
        if "Address the farmer as 'Ji Kisan Bhai'" not in prompt:
            file.write("FAIL: Missing Hindi greeting instruction in Hindi prompt!\n")
        elif "STRICT RULES FOR HINDI" not in prompt:
            file.write("FAIL: Missing Hindi strict rules!\n")
        else:
            file.write("PASS: Hindi prompt looks clean.\n")

if __name__ == "__main__":
    with io.open("test_results_final_v2.txt", "w", encoding="utf-8") as f:
        test_language("English", f)
        test_language("Hindi", f)
    print("Test complete. Results in test_results_final_v2.txt")
