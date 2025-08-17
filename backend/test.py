import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os

load_dotenv()

def test_database_connection():
    try:
        # Get database URL from environment variable
        db_url = os.getenv("DATABASE_URL")
        print(f"🔗 Testing connection to: {db_url}")

        # Connect to the database
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        # Test basic query
        cur.execute("SELECT 1")
        result = cur.fetchone()
        print(f"✅ Basic query test passed (result: {result[0]})")

        # Get database version
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"📊 Database version: {version[0]}")

        # Get current database
        cur.execute("SELECT current_database();")
        current_db = cur.fetchone()
        print(f"📊 Current database: {current_db[0]}")

        # Get current user
        cur.execute("SELECT current_user;")
        current_user = cur.fetchone()
        print(f"👤 Current user: {current_user[0]}")

        # Get all tables from all schemas
        cur.execute("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name;
        """)
        tables = cur.fetchall()
        
        print("\n📋 Available tables:")
        current_schema = None
        for schema, table in tables:
            if schema != current_schema:
                print(f"\nSchema: {schema}")
                current_schema = schema
            print(f"  - {table}")

        print(f"\nTotal number of tables: {len(tables)}")

        cur.close()
        conn.close()
        print("\n🎉 All database tests passed!")

    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")

if __name__ == "__main__":
    test_database_connection()