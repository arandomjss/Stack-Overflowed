from flask import Blueprint, request, jsonify
from typing import List, Dict
from app.models.schemas import Skill
from app.services.resume_analysis.roadmap import generate_roadmap
from app.services.resume_analysis.course_mapper import map_courses_to_skills
from app.services.readiness import build_skill_conf_map_from_request, compute_role_readiness

recommendations_bp = Blueprint("recommendations", __name__)

# Simulated YouTube videos for skills (in production, use YouTube Data API)
YOUTUBE_VIDEOS = {
    "python": [
        {"title": "Python Full Course for Beginners", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=rfscVS0vtbw", "duration": "4:26:52"},
        {"title": "Python Tutorial - Python for Beginners", "channel": "Programming with Mosh", "url": "https://youtube.com/watch?v=_uQrJ0TkZlc", "duration": "6:14:07"}
    ],
    "java": [
        {"title": "Java Tutorial for Beginners", "channel": "Programming with Mosh", "url": "https://youtube.com/watch?v=eIrMbAQSU34", "duration": "2:18:35"},
        {"title": "Java Full Course", "channel": "Amigoscode", "url": "https://youtube.com/watch?v=Qgl81fPcLc8", "duration": "10:00:00"}
    ],
    "javascript": [
        {"title": "JavaScript Tutorial for Beginners", "channel": "Programming with Mosh", "url": "https://youtube.com/watch?v=W6NZfCO5SIk", "duration": "1:00:00"},
        {"title": "JavaScript Full Course", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=PkZNo7MFNFg", "duration": "3:26:42"}
    ],
    "react": [
        {"title": "React Course - Beginner's Tutorial", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=bMknfKXIFA8", "duration": "11:55:27"},
        {"title": "React Tutorial for Beginners", "channel": "Programming with Mosh", "url": "https://youtube.com/watch?v=Ke90Tje7VS0", "duration": "1:48:48"}
    ],
    "node.js": [
        {"title": "Node.js Tutorial for Beginners", "channel": "Programming with Mosh", "url": "https://youtube.com/watch?v=TlB_eWDSMt4", "duration": "1:16:54"},
        {"title": "Node.js Full Course", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=Oe421EPjeBE", "duration": "8:16:48"}
    ],
    "sql": [
        {"title": "SQL Tutorial - Full Database Course", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=HXV3zeQKqGY", "duration": "4:20:44"},
        {"title": "MySQL Tutorial for Beginners", "channel": "Programming with Mosh", "url": "https://youtube.com/watch?v=7S_tz1z_5bA", "duration": "3:10:43"}
    ],
    "git": [
        {"title": "Git and GitHub for Beginners", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=RGOj5yH7evk", "duration": "1:08:41"},
        {"title": "Git Tutorial for Beginners", "channel": "Programming with Mosh", "url": "https://youtube.com/watch?v=8JJ101D3knE", "duration": "1:09:13"}
    ],
    "docker": [
        {"title": "Docker Tutorial for Beginners", "channel": "Programming with Mosh", "url": "https://youtube.com/watch?v=pTFZFxd4hOI", "duration": "1:15:16"},
        {"title": "Docker Full Course", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=fqMOX6JJhGo", "duration": "2:10:07"}
    ],
    "kubernetes": [
        {"title": "Kubernetes Tutorial for Beginners", "channel": "TechWorld with Nana", "url": "https://youtube.com/watch?v=X48VuDVv0do", "duration": "3:53:17"},
        {"title": "Kubernetes Course - Full Beginners Tutorial", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=d6WC5n9G_sM", "duration": "3:26:45"}
    ],
    "aws": [
        {"title": "AWS Certified Cloud Practitioner Training", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=SOTamWNgDKc", "duration": "4:08:08"},
        {"title": "AWS Tutorial For Beginners", "channel": "Simplilearn", "url": "https://youtube.com/watch?v=k1RI5locZE4", "duration": "9:56:08"}
    ],
    "data structures": [
        {"title": "Data Structures Easy to Advanced", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=RBSGKlAvoiM", "duration": "9:30:00"},
        {"title": "Data Structures Full Course", "channel": "Simplilearn", "url": "https://youtube.com/watch?v=AT14lCXuMKI", "duration": "10:17:21"}
    ],
    "algorithms": [
        {"title": "Algorithms and Data Structures Tutorial", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=8hly31xKli0", "duration": "5:00:00"},
        {"title": "Introduction to Algorithms", "channel": "MIT OpenCourseWare", "url": "https://youtube.com/watch?v=ZA-tUyM_y7s", "duration": "47:26"}
    ],
    "machine learning": [
        {"title": "Machine Learning Course for Beginners", "channel": "freeCodeCamp", "url": "https://youtube.com/watch?v=NWONeJKn6kc", "duration": "2:45:42"},
        {"title": "Machine Learning Full Course", "channel": "Simplilearn", "url": "https://youtube.com/watch?v=GwIo3gDZCVQ", "duration": "10:54:52"}
    ]
}

def get_youtube_videos(skill: str) -> List[Dict]:
    """Get YouTube video recommendations for a skill"""
    skill_lower = skill.lower()
    
    # Direct match
    if skill_lower in YOUTUBE_VIDEOS:
        return YOUTUBE_VIDEOS[skill_lower]
    
    # Partial match
    for key, videos in YOUTUBE_VIDEOS.items():
        if key in skill_lower or skill_lower in key:
            return videos
    
    # Default fallback
    return [
        {"title": f"Learn {skill}", "channel": "Various", "url": f"https://youtube.com/results?search_query={skill}+tutorial", "duration": "N/A"}
    ]

@recommendations_bp.route("/recommendations", methods=["POST"])
def get_recommendations():
    """
    Get personalized course and video recommendations based on skills and target role
    
    Request body:
    {
        "skills": [{"name": "python", "confidence": 0.8}, ...],
        "target_role": "software engineer" (optional)
    }
    """
    data = request.get_json()
    
    if not data or "skills" not in data:
        return jsonify({"error": "Skills are required"}), 400
    
    try:
        # Parse skills
        skills = [Skill(name=s["name"], confidence=s["confidence"]) for s in data["skills"]]
        target_role = data.get("target_role", "software engineer")

        # Load canonical role requirements (for consistent readiness)
        from app.services.resume_analysis.roadmap import _load_roles
        from app.services.resume_analysis.utils import match_role

        roles_data = _load_roles()
        matched_role = match_role(target_role, roles_data) or target_role
        if matched_role not in roles_data and 'software engineer' in roles_data:
            matched_role = 'software engineer'

        role_requirements = roles_data.get(matched_role)
        
        # Generate roadmap (identifies skill gaps)
        roadmap_phases = generate_roadmap(skills, target_role)
        
        # Map courses to skills
        roadmap_with_courses = map_courses_to_skills(roadmap_phases)
        
        # Build response with courses, videos, and priority
        recommendations = []
        
        for phase in roadmap_with_courses:
            for skill in phase.skills:
                # Get YouTube videos for this skill
                videos = get_youtube_videos(skill.name)
                
                # Determine priority based on phase
                priority_map = {
                    "foundation": "high",
                    "core": "medium",
                    "advanced": "low",
                    "projects": "medium"
                }
                
                recommendation = {
                    "skill_name": skill.name,
                    "phase": phase.phase,
                    "priority": priority_map.get(phase.phase, "medium"),
                    "courses": [
                        {
                            "platform": course.platform,
                            "title": course.title,
                            "url": course.url
                        }
                        for course in skill.courses
                    ],
                    "videos": videos[:2],  # Top 2 videos
                    "reason": f"Required for {target_role} role in {phase.phase} phase"
                }
                
                recommendations.append(recommendation)
        
        # Calculate readiness score (shared definition used across the app)
        skill_conf = build_skill_conf_map_from_request(data["skills"])
        readiness_score = compute_role_readiness(role_requirements or {}, skill_conf)["readiness_score"]
        
        return jsonify({
            "readiness_score": readiness_score,
            "target_role": matched_role,
            "recommendations": recommendations,
            "summary": {
                "total_skills_needed": sum(len(phase.skills) for phase in roadmap_with_courses),
                "current_skills": len(skills),
                "courses_available": sum(len(r["courses"]) for r in recommendations),
                "videos_available": sum(len(r["videos"]) for r in recommendations)
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@recommendations_bp.route("/recommendations/summary", methods=["GET"])
def get_recommendations_summary():
    """Get a quick summary of available recommendations"""
    return jsonify({
        "total_courses": 100,  # This would come from database
        "total_videos": len(YOUTUBE_VIDEOS) * 2,
        "platforms": ["Coursera", "Udemy", "edX", "Pluralsight", "YouTube"],
        "supported_skills": list(YOUTUBE_VIDEOS.keys())
    })
