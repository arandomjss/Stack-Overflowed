import sqlite3
import os

def init_database():
    """Initialize SQLite database with schema"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, '..', 'skillgenome.db')
    schema_path = os.path.join(base_dir, 'schema.sql')
    
    print("=" * 60)
    print(" Initializing SkillGenome Database")
    print("=" * 60)
    print(f" Database location: {os.path.abspath(db_path)}")
    print(f" Schema file: {schema_path}")
    
    # Read schema file
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema = f.read()
    
    # Create database and execute schema
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.executescript(schema)
    conn.commit()
    
    # Verify tables created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("\n Database initialized successfully!")
    print(f" Tables created: {len(tables)}")
    for table in tables:
        print(f"   • {table[0]}")
    
    conn.close()
    print("=" * 60)
    return db_path

if __name__ == '__main__':
    init_database()