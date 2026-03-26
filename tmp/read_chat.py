
import sys

def read_lines(file_path, start_line, end_line):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i in range(start_line - 1, min(end_line, len(lines))):
                print(f"{i+1}: {lines[i]}", end='')
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    read_lines(r'c:\Users\Arnav Shirwadkar\Desktop\Mains\MittiMitra\backend\api\chat.py', 300, 600)
