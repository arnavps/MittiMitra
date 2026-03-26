
import sys

def read_lines(file_path, start_line, end_line):
    for enc in ['utf-8', 'latin-1', 'utf-16', 'windows-1252']:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                lines = f.readlines()
                for i in range(start_line - 1, min(end_line, len(lines))):
                    print(f"{i+1}: {lines[i]}", end='')
                break
        except Exception as e:
            continue

if __name__ == "__main__":
    if len(sys.argv) > 1:
        start = int(sys.argv[1])
        end = int(sys.argv[2])
        read_lines(r'c:\Users\Arnav Shirwadkar\Desktop\Mains\MittiMitra\backend\api\chat.py', start, end)
    else:
        read_lines(r'c:\Users\Arnav Shirwadkar\Desktop\Mains\MittiMitra\backend\api\chat.py', 320, 500)
