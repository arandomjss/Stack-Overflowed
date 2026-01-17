"""
LinkedIn Integration for SkillGenome
Mock implementation for hackathon demo
In production, this would use OAuth + LinkedIn API
"""

import json
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random

class LinkedInIntegration:
    """Mock LinkedIn API integration for skill import"""
    
    def __init__(self, access_token: str = None):
        self.access_token = access_token
        self.base_url = "https://api.linkedin.com/v2"
    
    def import_skills(self, user_email: str = None) -> List[Dict[str, Any]]:
        """
        Import skills from LinkedIn profile
        Returns list of skills with endorsements and confidence scores
        
        For demo: Returns realistic mock data
        In production: Would call LinkedIn API
        """
        
        # Mock skill data for demo
        mock_skills = [
            {
                "skill_name": "Python",
                "endorsements": 45,
                "confidence": 0.9,
                "sector_context": "Software Development",
                "source": "linkedin",
                "acquired_date": (datetime.now() - timedelta(days=730)).isoformat(),
                "evidence": ["5 projects", "3 certifications"]
            },
            {
                "skill_name": "Data Analysis",
                "endorsements": 32,
                "confidence": 0.85,
                "sector_context": "Healthcare Data",
                "source": "linkedin",
                "acquired_date": (datetime.now() - timedelta(days=545)).isoformat(),
                "evidence": ["Healthcare Analytics Course", "2 projects"]
            },
            {
                "skill_name": "Machine Learning",
                "endorsements": 28,
                "confidence": 0.8,
                "sector_context": "Healthcare AI",
                "source": "linkedin",
                "acquired_date": (datetime.now() - timedelta(days=365)).isoformat(),
                "evidence": ["ML Specialization", "Kaggle competitions"]
            },
            {
                "skill_name": "SQL",
                "endorsements": 38,
                "confidence": 0.88,
                "sector_context": "Database Management",
                "source": "linkedin",
                "acquired_date": (datetime.now() - timedelta(days=900)).isoformat(),
                "evidence": ["Database projects", "Work experience"]
            },
            {
                "skill_name": "Flask",
                "endorsements": 15,
                "confidence": 0.7,
                "sector_context": "Backend Development",
                "source": "linkedin",
                "acquired_date": (datetime.now() - timedelta(days=200)).isoformat(),
                "evidence": ["3 API projects"]
            },
            {
                "skill_name": "Docker",
                "endorsements": 12,
                "confidence": 0.65,
                "sector_context": "DevOps",
                "source": "linkedin",
                "acquired_date": (datetime.now() - timedelta(days=180)).isoformat(),
                "evidence": ["Container deployment experience"]
            }
        ]
        
        # Simulate API delay
        import time
        time.sleep(0.5)
        
        return mock_skills
    
    def import_courses(self, user_email: str = None) -> List[Dict[str, Any]]:
        """
        Import completed courses/certifications from LinkedIn Learning
        Returns list of courses with completion dates
        """
        
        mock_courses = [
            {
                "course_name": "Machine Learning Specialization",
                "platform": "Coursera (via LinkedIn)",
                "sector": "Healthcare",
                "completion_date": (datetime.now() - timedelta(days=200)).isoformat(),
                "skills_gained": ["Machine Learning", "Python", "TensorFlow"],
                "certificate_url": "https://coursera.org/verify/mock123"
            },
            {
                "course_name": "Healthcare Data Analytics",
                "platform": "LinkedIn Learning",
                "sector": "Healthcare",
                "completion_date": (datetime.now() - timedelta(days=150)).isoformat(),
                "skills_gained": ["Data Analysis", "Healthcare Domain Knowledge", "SQL"],
                "certificate_url": "https://linkedin.com/learning/cert/mock456"
            },
            {
                "course_name": "Advanced Python Programming",
                "platform": "LinkedIn Learning",
                "sector": "Software Development",
                "completion_date": (datetime.now() - timedelta(days=300)).isoformat(),
                "skills_gained": ["Python", "OOP", "Design Patterns"],
                "certificate_url": "https://linkedin.com/learning/cert/mock789"
            }
        ]
        
        return mock_courses
    
    def import_experience(self, user_email: str = None) -> List[Dict[str, Any]]:
        """
        Import work experience from LinkedIn profile
        Returns list of positions with skills used
        """
        
        mock_experience = [
            {
                "title": "Software Engineering Intern",
                "company": "TechHealth Solutions",
                "sector": "Healthcare",
                "duration_months": 6,
                "skills_used": ["Python", "Flask", "SQL", "Healthcare Data"],
                "description": "Developed healthcare data analytics dashboard"
            },
            {
                "title": "Research Assistant",
                "company": "University Medical Center",
                "sector": "Healthcare",
                "duration_months": 8,
                "skills_used": ["Data Analysis", "Python", "Research Methods"],
                "description": "Analyzed patient outcome data for clinical research"
            }
        ]
        
        return mock_experience
    
    def validate_token(self) -> bool:
        """
        Validate LinkedIn access token
        For demo: Always returns True
        """
        # In production, would validate OAuth token
        return True
    
    def get_profile_summary(self, user_email: str = None) -> Dict[str, Any]:
        """
        Get complete profile summary from LinkedIn
        Aggregates skills, courses, and experience
        """
        
        return {
            "skills": self.import_skills(user_email),
            "courses": self.import_courses(user_email),
            "experience": self.import_experience(user_email),
            "import_timestamp": datetime.now().isoformat(),
            "source": "linkedin_mock"
        }
