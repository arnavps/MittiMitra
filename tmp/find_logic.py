
import re

file_path = r'c:\Users\Arnav Shirwadkar\Desktop\Mains\MittiMitra\backend\api\chat.py'

def analyze_file():
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        print(f"Total lines: {len(lines)}")
        for i, line in enumerate(lines):
            # Check for function or variable definitions that might correspond to extraction
            if 'extract' in line.lower() and ('def ' in line or '=' in line):
                print(f"Line {i+1}: {line.strip()}")
            if 'ONBOARDING_STRINGS_BACKEND' in line:
                print(f"Line {i+1}: ONBOARDING_STRINGS_BACKEND found")
            if 'PRIORITY' in line:
                print(f"Line {i+1}: {line.strip()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_file()
