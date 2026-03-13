import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = "postgresql://postgres.xqsancvpphgtfucdpqls:Team_Technexis12345@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

def fix_name():
    try:
        print("Connecting to DB to fix name...")
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Update name from Hindi to English for the demo user
        cur.execute("UPDATE profiles SET name = 'Arnav' WHERE phone = '9999999999';")
        
        conn.commit()
        print("Successfully updated name to 'Arnav' for 9999999999")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    fix_name()
