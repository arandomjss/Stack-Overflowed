from flask import Blueprint, request, jsonify
from app.database import get_db_connection
import json
import os
from datetime import datetime

gap_analysis_bp = Blueprint('gap_analysis', __name__)

@gap_analysis_bp.route('/gap-analysis/<user_id>', methods=['POST'])
def analyze_gaps(user_id):
    """
    Analyze skill gaps for a user against target role
    
    Request body:
    {
        "target_role": "data scientist",
        "target_sector": "Healthcare"
    }
    """
    try:
        data = request.json
        target_role = data.get('target_role')
        target_sector = data.get('target_sector', 'Healthcare')
        
        if not target_role:
            return jsonify({"error": "target_role is required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Verify user exists
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # 2. Get user's current skills
        cursor.execute("""
            SELECT skill_name, sector_context, confidence, source, evidence
            FROM user_skills 
            WHERE user_id = ?
        """, (user_id,))
        
        user_skills = []
        for row in cursor.fetchall():
            skill_dict = dict(row)
            try:
                skill_dict['evidence'] = json.loads(skill_dict['evidence']) if skill_dict['evidence'] else []
            except:
                skill_dict['evidence'] = []
            user_skills.append(skill_dict)
        
        # 3. Load role requirements from database
        from app.services.resume_analysis.roadmap import _load_roles
        from app.services.resume_analysis.utils import match_role
        
        roles_data = _load_roles()
        matched_role_name = match_role(target_role, roles_data)
        
        if not matched_role_name:
            return jsonify({
                "error": f"Role '{target_role}' not found",
                "available_roles": list(roles_data.keys())
            }), 404

        role_requirements = roles_data[matched_role_name]
        # Override target_role with matched canonical name for consistency
        target_role = matched_role_name

        
        # 4. Calculate gaps using scorer
        # Extract required skills from role
        required_skills = role_requirements.get('foundation', []) + role_requirements.get('core', [])
        preferred_skills = role_requirements.get('advanced', []) + role_requirements.get('projects', [])
        
        # Map user skills to skill names with fuzzy matching
        user_skill_names = {skill['skill_name'].lower(): skill['confidence'] for skill in user_skills}
        
        def find_matching_skill(required_skill, user_skills_dict):
            """Check if user has skill with exact or partial match"""
            required_lower = required_skill.lower()
            
            # Exact match
            if required_lower in user_skills_dict:
                return user_skills_dict[required_lower]
            
            # Partial match - check if required skill is contained in any user skill
            for user_skill, confidence in user_skills_dict.items():
                if required_lower in user_skill or user_skill in required_lower:
                    return confidence
            
            return None
        
        # Calculate gaps
        missing_required = []
        missing_preferred = []
        weak_skills = []
        
        for skill in required_skills:
            confidence = find_matching_skill(skill, user_skill_names)
            
            if confidence is None:
                missing_required.append({
                    "skill": skill,
                    "priority": "high",
                    "reason": "Required for role"
                })
            elif confidence < 0.5:
                weak_skills.append({
                    "skill": skill,
                    "current_confidence": confidence,
                    "reason": "Needs improvement"
                })
        
        for skill in preferred_skills:
            confidence = find_matching_skill(skill, user_skill_names)
            
            if confidence is None:
                missing_preferred.append({
                    "skill": skill,
                    "priority": "medium",
                    "reason": "Preferred for competitive advantage"
                })
        
        # Calculate readiness score
        total_required = len(required_skills)
        matched_required = sum(1 for skill in required_skills if find_matching_skill(skill, user_skill_names) is not None and find_matching_skill(skill, user_skill_names) >= 0.5)
        
        readiness_score = (matched_required / total_required * 100) if total_required > 0 else 0
        
        # 5. Generate recommendations
        recommendations = generate_recommendations(
            missing_required, 
            missing_preferred, 
            weak_skills,
            target_sector,
            target_role
        )
        
        # 6. Store analysis result
        cursor.execute("""
            INSERT INTO skill_gap_analysis 
            (user_id, target_role, target_sector, readiness_score, missing_skills, weak_skills, recommendations)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            target_role,
            target_sector,
            readiness_score,
            json.dumps(missing_required + missing_preferred),
            json.dumps(weak_skills),
            json.dumps(recommendations)
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "user_id": user_id,
            "target_role": target_role,
            "target_sector": target_sector,
            "readiness_score": round(readiness_score, 2),
            "analysis": {
                "missing_required_skills": missing_required,
                "missing_preferred_skills": missing_preferred,
                "weak_skills": weak_skills
            },
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "message": "Failed to perform gap analysis"
        }), 500


@gap_analysis_bp.route('/gap-analysis/<user_id>/history', methods=['GET'])
def get_analysis_history(user_id):
    """Get historical gap analysis for a user to track progression"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, target_role, target_sector, readiness_score, 
                   missing_skills, weak_skills, recommendations, analysis_date
            FROM skill_gap_analysis
            WHERE user_id = ?
            ORDER BY analysis_date DESC
            LIMIT 10
        """, (user_id,))
        
        history = []
        for row in cursor.fetchall():
            analysis = dict(row)
            analysis['missing_skills'] = json.loads(analysis['missing_skills'])
            analysis['weak_skills'] = json.loads(analysis['weak_skills'])
            analysis['recommendations'] = json.loads(analysis['recommendations'])
            history.append(analysis)
        
        conn.close()
        
        return jsonify({
            "user_id": user_id,
            "history": history,
            "total_analyses": len(history)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def generate_recommendations(missing_required, missing_preferred, weak_skills, sector, role):
    """Generate actionable recommendations based on gaps"""
    
    recommendations = []
    
    # Load course recommendations from database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Recommend courses for missing required skills (HIGH PRIORITY)
    for skill_obj in missing_required[:3]:  # Top 3 missing
        skill = skill_obj['skill']
        
        # Find relevant courses from database
        cursor.execute("""
            SELECT platform, title, url FROM courses 
            WHERE LOWER(skill) = LOWER(?)
            LIMIT 1
        """, (skill,))
        
        course = cursor.fetchone()
        
        if course:
            recommendations.append({
                "type": "course",
                "priority": "high",
                "skill": skill,
                "action": f"Complete course: {course['title']}",
                "courses": [{
                    "platform": course['platform'],
                    "title": course['title'],
                    "url": course['url']
                }],
                "reason": f"Critical skill gap - {skill} is required for {role}"
            })
    
    # Recommend practice for weak skills
    for weak in weak_skills[:2]:
        recommendations.append({
            "type": "project",
            "priority": "medium",
            "skill": weak['skill'],
            "action": f"Build a project using {weak['skill']}",
            "courses": [],
            "estimated_time": "2-4 weeks",
            "reason": f"Strengthen existing knowledge (current: {weak['current_confidence']:.0%})"
        })
    
    # Recommend courses for preferred skills
    for skill_obj in missing_preferred[:2]:
        skill = skill_obj['skill']
        
        # Find course from database
        cursor.execute("""
            SELECT platform, title, url FROM courses 
            WHERE LOWER(skill) = LOWER(?)
            LIMIT 1
        """, (skill,))
        
        course = cursor.fetchone()
        
        if course:
            recommendations.append({
                "type": "course",
                "priority": "low",
                "skill": skill,
                "action": f"Learn {skill} to increase competitiveness",
                "courses": [{
                    "platform": course['platform'],
                    "title": course['title'],
                    "url": course['url']
                }],
                "reason": "Preferred skill for role advancement"
            })
    
    conn.close()
    return recommendations


@gap_analysis_bp.route('/roles', methods=['GET'])
def get_roles():
    """Get list of available roles"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT role_name FROM roles ORDER BY role_name")
        roles = [row['role_name'] for row in cursor.fetchall()]
        conn.close()
        return jsonify({"roles": roles}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500