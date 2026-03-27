
import re

file_path = r'c:\Users\Arnav Shirwadkar\Desktop\Mains\MittiMitra\backend\api\chat.py'

def analyze_file():
    try:
        with open(file_path, 'r', encoding='latin-1') as f:
            lines = f.readlines()
            
        print(f"Total lines: {len(lines)}")
        for i, line in enumerate(lines):
            if line.strip().startswith('def '):
                print(f"Line {i+1}: {line.strip()}")
            if 'PRIORITY LIST:' in line:
                print(f"Line {i+1}: Found PRIORITY LIST")
            if 'def onboarding_extract' in line:
                print(f"Line {i+1}: Found onboarding_extract")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_file()
