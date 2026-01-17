"""
SkillGenome Server Startup Script
Initializes database and starts Flask server
"""

import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.init_db import init_database

def start_server():
    """Initialize database and start server"""
    
    print("\n" + "=" * 70)
    print(" SKILLGENOME - Holistic Skill Intelligence Platform")
    print("=" * 70)
    
    # Check if database exists, if not initialize it
    db_path = os.path.join(os.path.dirname(__file__), 'skillgenome.db')
    
    if not os.path.exists(db_path):
        print("\nDatabase not found. Initializing...")
        init_database()
    else:
        print("\nDatabase found")
    
    print("\nStarting Flask Server...")
    print("=" * 70)
    print("\nSERVER INFO:")
    print(f"   * Base URL: http://localhost:5000")
    print(f"   * Health Check: http://localhost:5000/health")
    print("\nAPI ENDPOINTS:")
    print("   * POST /api/profile - Create user profile")
    print("   * GET  /api/profile/<user_id> - Get user profile")
    print("   * POST /api/profile/<user_id>/skills - Add skill")
    print("   * POST /api/resume/analyze - Analyze resume")
    print("   * POST /api/gap-analysis/<user_id> - Analyze skill gaps")
    print("   * POST /api/import/linkedin - Import from LinkedIn")
    print("   * GET  /api/import/linkedin/preview - Preview import")
    print("\n" + "=" * 70)
    print("\nServer running in DEBUG mode")
    print("   Press CTRL+C to stop\n")
    print("=" * 70 + "\n")
    
    # Start Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    start_server()
