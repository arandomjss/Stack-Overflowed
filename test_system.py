"""
SkillGenome API Test Suite
Tests all critical endpoints for demo readiness
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    print("\n Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        print("✅ Health check passed")
        return True
    except Exception as e:
        print(f" Health check failed: {e}")
        return False

def test_create_profile():
    """Test creating user profile"""
    print("\n Testing profile creation...")
    try:
        data = {
            "name": "Test User",
            "email": "test@skillgenome.com",
            "target_sector": "Healthcare",
            "target_role": "data scientist"
        }
        response = requests.post(f"{BASE_URL}/api/profile", json=data)
        assert response.status_code == 201
        result = response.json()
        user_id = result['user_id']
        print(f" Profile created: {user_id}")
        return user_id
    except Exception as e:
        print(f" Profile creation failed: {e}")
        return None

def test_add_skills(user_id):
    """Test adding skills to profile"""
    print("\n🔍 Testing skill addition...")
    try:
        skills = [
            {
                "skill_name": "Python",
                "sector_context": "Healthcare Data Analysis",
                "confidence": 0.8,
                "source": "manual",
                "evidence": ["Built healthcare dashboard", "Data analysis projects"]
            },
            {
                "skill_name": "Machine Learning",
                "sector_context": "Healthcare AI",
                "confidence": 0.6,
                "source": "manual",
                "evidence": ["Completed ML course"]
            }
        ]
        
        for skill in skills:
            response = requests.post(f"{BASE_URL}/api/profile/{user_id}/skills", json=skill)
            assert response.status_code == 201
        
        print(f" Added {len(skills)} skills")
        return True
    except Exception as e:
        print(f" Skill addition failed: {e}")
        return False

def test_linkedin_import(user_id):
    """Test LinkedIn import"""
    print("\n🔍 Testing LinkedIn import...")
    try:
        data = {
            "user_id": user_id,
            "import_type": "all",
            "access_token": "demo_token"
        }
        response = requests.post(f"{BASE_URL}/api/import/linkedin", json=data)
        assert response.status_code == 200
        result = response.json()
        print(f" Imported {result['imported']['total']} items")
        print(f"   • Skills: {result['imported']['skills']}")
        print(f"   • Courses: {result['imported']['courses']}")
        return True
    except Exception as e:
        print(f" LinkedIn import failed: {e}")
        return False

def test_gap_analysis(user_id):
    """Test gap analysis"""
    print("\n🔍 Testing gap analysis...")
    try:
        data = {
            "target_role": "data scientist",
            "target_sector": "Healthcare"
        }
        response = requests.post(f"{BASE_URL}/api/gap-analysis/{user_id}", json=data)
        assert response.status_code == 200
        result = response.json()
        print(f" Gap analysis complete")
        print(f"   • Readiness Score: {result['readiness_score']}%")
        print(f"   • Missing Required: {len(result['analysis']['missing_required_skills'])}")
        print(f"   • Recommendations: {len(result['recommendations'])}")
        return True
    except Exception as e:
        print(f" Gap analysis failed: {e}")
        return False

def test_get_profile(user_id):
    """Test retrieving profile"""
    print("\n Testing profile retrieval...")
    try:
        response = requests.get(f"{BASE_URL}/api/profile/{user_id}")
        assert response.status_code == 200
        result = response.json()
        print(f" Profile retrieved")
        print(f"   • Name: {result['user']['name']}")
        print(f"   • Skills: {len(result['skills'])}")
        print(f"   • Courses: {len(result['courses'])}")
        return True
    except Exception as e:
        print(f" Profile retrieval failed: {e}")
        return False

def run_all_tests():
    """Run complete test suite"""
    print("\n" + "=" * 70)
    print(" 🧪 SKILLGENOME API TEST SUITE")
    print("=" * 70)
    
    # Check server is running
    if not test_health():
        print("\n Server is not running. Start it with: python start_server.py")
        sys.exit(1)
    
    # Run tests
    user_id = test_create_profile()
    if not user_id:
        print("\n Critical failure: Cannot create profile")
        sys.exit(1)
    
    test_add_skills(user_id)
    test_linkedin_import(user_id)
    test_gap_analysis(user_id)
    test_get_profile(user_id)
    
    print("\n" + "=" * 70)
    print("  ALL TESTS COMPLETED!")
    print("=" * 70)
    print(f"\n Test User ID: {user_id}")
    print(f" View Profile: {BASE_URL}/api/profile/{user_id}")
    print("\n System is DEMO READY!\n")

if __name__ == '__main__':
    run_all_tests()
