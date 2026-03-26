from api.chat import build_system_prompt
from engine.logistics import get_loading_instructions, identify_clusters
from engine.decay_logic import calculate_quality_loss
import io

def test_crop_consistency(crop_name, file):
    file.write(f"\n>>>> TESTING CROP: {crop_name} <<<<\n")
    
    # 1. Decay Test (36C for 48h)
    loss = calculate_quality_loss(crop_name, 36, 60, 48)
    file.write(f"Decay Loss (36C/48h): {round(loss, 2)}%\n")
    
    # 2. Loading Advice Test
    advice = get_loading_instructions(crop_name, "Open Trolley", 50)
    file.write(f"Loading Advice: {advice}\n")
    
    # 3. Clustering Test
    clusters = identify_clusters({"lat": 0, "lng": 0}, "Akola", crop=crop_name)
    neighbor_crop = clusters['neighbors'][0]['crop']
    file.write(f"Neighbor Crop: {neighbor_crop}\n")
    
    # 4. Prompt Analogy Test
    mock_context = {"crop": crop_name}
    prompt = build_system_prompt(mock_context, "English")
    if f"Biological Clock\" of your {crop_name}" in prompt:
        file.write("Prompt Analogy: PASS (Dynamic)\n")
    else:
        file.write("Prompt Analogy: FAIL (Static or missing)\n")

if __name__ == "__main__":
    with io.open("test_results_consistency_final.txt", "w", encoding="utf-8") as f:
        test_crop_consistency("Wheat", f)
        test_crop_consistency("Grapes", f)
        test_crop_consistency("Tomato", f)
    print("Test complete. Results in test_results_consistency_final.txt")
