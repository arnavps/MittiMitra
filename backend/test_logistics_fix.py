from api.chat import build_system_prompt
import io

mock_context = {
    "status": "GREEN",
    "best_mandi": "Akola",
    "total_net_profit": 15000,
    "net_realization_inr_per_quintal": 2800,
    "yield_quintals": 50,
    "weather": {"temperature_c": 36, "rain_probability_percent": 10},
    "mandi_stats": {"current_price": 2900},
    "shock_alert": {"is_shock": False},
    "transport_type": "Pickup Truck",
    "storage_type": "Shaded",
    "oracle": {"maturity": {"current_maturity_pct": 95}, "verdict": {"verdict": "SELL"}}
}

def test_logistics(file):
    file.write(f"\n--- TESTING LOGISTICS CONTEXT ---\n")
    prompt = build_system_prompt(mock_context, "English")
    
    if "Open Trolley" in prompt:
        # Check if it's used as a default in the principles section
        if "Explain the 100% loss risk for Pickup Truck storage" in prompt:
             file.write("PASS: Correctly used 'Pickup Truck' in principles.\n")
        else:
             file.write("FAIL: Still showing 'Open Trolley' or missing 'Pickup Truck' in principles.\n")
             # Let's see what was actually there
             start_idx = prompt.find("SHELF-LIFE RISK")
             file.write(f"Actual prompt snippet: {prompt[start_idx:start_idx+100]}\n")
    else:
        file.write("PASS: 'Open Trolley' not found in prompt.\n")

if __name__ == "__main__":
    with io.open("test_results_logistics.txt", "w", encoding="utf-8") as f:
        test_logistics(f)
    print("Test complete. Results in test_results_logistics.txt")
