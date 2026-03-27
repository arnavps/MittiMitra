
import os

file_path = r'c:\Users\Arnav Shirwadkar\Desktop\Mains\MittiMitra\backend\api\chat.py'

def fix_everything():
    # Read the file to get the strings we want to preserve/fix
    # Since it's currently broken, let's just use the known correct structure.
    
    # I'll use the 'latin-1' to read it back since I wrote it that way.
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()

    # Now I'll fix the logic and ensure the characters are handled as UTF-8.
    # I'll use a more direct approach: I'll overwrite the file with the correct content 
    # but I'll be careful to use UTF-8 this time.
    
    # Wait, I don't have the FULL content of chat.py in a safe encoding right now.
    # I have chat_snippet.txt in UTF-8.
    # I can use that to reconstruct the function.
    
    print("Fixing encoding issue in chat.py...")
    # I will just re-apply the hardening but with UTF-8 encoding.
    # But first I need to make sure the base content is clean.
    
    # Let's try to read it as latin-1 and then write it as utf-8.
    with open(file_path, 'r', encoding='latin-1') as f:
        clean_content = f.read()
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(clean_content)
        
    print("Converted to UTF-8. Now re-applying hardening.")

if __name__ == "__main__":
    fix_everything()
