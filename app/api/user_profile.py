from flask import Blueprint, request, jsonify
from app.database import get_db_connection
import json
import uuid
from datetime import datetime

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile', methods=['POST'])
def create_profile():
    """Create new user profile"""
    try:
        data = request.json
        user_id = str(uuid.uuid4())
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO users (user_id, name, email, target_sector, target_role)
            VALUES (?, ?, ?, ?, ?)
        """, (
            user_id,
            data.get('name'),
            data.get('email'),
            data.get('target_sector'),
            data.get('target_role')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "user_id": user_id,
            "message": "Profile created successfully"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@profile_bp.route('/profile/<user_id>', methods=['GET'])
def get_profile(user_id):
    """Get complete user profile with skills, courses, and projects"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user info
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get skills
        cursor.execute("""
            SELECT skill_name, sector_context, confidence, source, acquired_date, evidence
            FROM user_skills WHERE user_id = ?
            ORDER BY confidence DESC
        """, (user_id,))
        skills = [dict(row) for row in cursor.fetchall()]
        
        # Get courses
        cursor.execute("""
            SELECT course_name, platform, sector, completion_date, skills_gained
            FROM user_courses WHERE user_id = ?
            ORDER BY completion_date DESC
        """, (user_id,))
        courses = [dict(row) for row in cursor.fetchall()]
        
        # Get projects
        cursor.execute("""
            SELECT project_name, description, sector, skills_used, github_url, date_completed
            FROM user_projects WHERE user_id = ?
            ORDER BY date_completed DESC
        """, (user_id,))
        projects = [dict(row) for row in cursor.fetchall()]
        
        # Get latest gap analysis
        cursor.execute("""
            SELECT target_role, target_sector, readiness_score, analysis_date
            FROM skill_gap_analysis WHERE user_id = ?
            ORDER BY analysis_date DESC LIMIT 1
        """, (user_id,))
        latest_analysis = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            "user": dict(user),
            "skills": skills,
            "courses": courses,
            "projects": projects,
            "latest_analysis": dict(latest_analysis) if latest_analysis else None
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route('/profile/<user_id>', methods=['PUT'])
def update_profile(user_id):
    """Update user profile information"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build dynamic update query
        updates = []
        values = []
        
        for field in ['name', 'target_sector', 'target_role']:
            if field in data:
                updates.append(f"{field} = ?")
                values.append(data[field])
        
        if not updates:
            return jsonify({"error": "No fields to update"}), 400
        
        updates.append("last_updated = ?")
        values.append(datetime.now().isoformat())
        values.append(user_id)
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = ?"
        cursor.execute(query, values)
        
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "message": "Profile updated"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route('/profile/<user_id>/skills/bulk', methods=['POST'])
def bulk_add_skills(user_id):
    """Add multiple skills to user profile"""
    try:
        data = request.json
        skills = data.get('skills', [])
        
        if not skills:
            return jsonify({"error": "No skills provided"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify user exists
        cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        for skill in skills:
            cursor.execute("""
                INSERT INTO user_skills 
                (user_id, skill_name, sector_context, confidence, source, acquired_date, evidence)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                skill.get('skill_name'),
                skill.get('sector_context'),
                skill.get('confidence', 0.5),
                skill.get('source', 'manual'),
                skill.get('acquired_date'),
                json.dumps(skill.get('evidence', []))
            ))
            
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": f"Added {len(skills)} skills successfully"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@profile_bp.route('/profile/<user_id>/skills/<int:skill_id>', methods=['PUT'])
def update_skill(user_id, skill_id):
    """Update an existing skill (e.g. confidence score)"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute("SELECT id FROM user_skills WHERE id = ? AND user_id = ?", (skill_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Skill not found or does not belong to user"}), 404
            
        updates = []
        values = []
        
        for field in ['confidence', 'sector_context', 'evidence']:
            if field in data:
                updates.append(f"{field} = ?")
                val = json.dumps(data[field]) if field == 'evidence' else data[field]
                values.append(val)
                
        if not updates:
            conn.close()
            return jsonify({"error": "No fields to update"}), 400
            
        values.append(skill_id)
        values.append(user_id)
        
        query = f"UPDATE user_skills SET {', '.join(updates)} WHERE id = ? AND user_id = ?"
        cursor.execute(query, values)
        
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "message": "Skill updated"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route('/profile/<user_id>/skills/<int:skill_id>', methods=['DELETE'])
def delete_skill(user_id, skill_id):
    """Remove a skill from user profile"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify ownership
        cursor.execute("SELECT id FROM user_skills WHERE id = ? AND user_id = ?", (skill_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Skill not found"}), 404
            
        cursor.execute("DELETE FROM user_skills WHERE id = ? AND user_id = ?", (skill_id, user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "message": "Skill deleted"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route('/profile/<user_id>/skills', methods=['GET'])
def get_skills(user_id):
    """Get all skills for a user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, skill_name, sector_context, confidence, source, 
                   acquired_date, evidence, created_at
            FROM user_skills 
            WHERE user_id = ?
            ORDER BY confidence DESC, created_at DESC
        """, (user_id,))
        
        skills = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            "user_id": user_id,
            "skills": skills,
            "total": len(skills)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route('/profile/<user_id>/courses', methods=['POST'])
def add_course(user_id):
    """Add completed course to user profile"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO user_courses 
            (user_id, course_name, platform, sector, completion_date, skills_gained, certificate_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            data.get('course_name'),
            data.get('platform'),
            data.get('sector'),
            data.get('completion_date'),
            json.dumps(data.get('skills_gained', [])),
            data.get('certificate_url')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": "Course added successfully"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@profile_bp.route('/profile/<user_id>/projects', methods=['POST'])
def add_project(user_id):
    """Add project to user profile"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO user_projects 
            (user_id, project_name, description, sector, skills_used, github_url, date_completed)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            data.get('project_name'),
            data.get('description'),
            data.get('sector'),
            json.dumps(data.get('skills_used', [])),
            data.get('github_url'),
            data.get('date_completed')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": "Project added successfully"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@profile_bp.route('/profiles', methods=['GET'])
def list_profiles():
    """List all user profiles (for demo/testing)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT user_id, name, email, target_sector, target_role, created_at
            FROM users
            ORDER BY created_at DESC
        """)
        
        profiles = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            "profiles": profiles,
            "total": len(profiles)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
