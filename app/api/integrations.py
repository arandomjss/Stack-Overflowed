from flask import Blueprint, request, jsonify
from app.integrations.linkedin import LinkedInIntegration
from app.database import get_db_connection
import json
from datetime import datetime

integrations_bp = Blueprint('integrations', __name__)

@integrations_bp.route('/import/linkedin', methods=['POST'])
def import_from_linkedin():
    """
    Import skills and courses from LinkedIn
    
    Request body:
    {
        "user_id": "uuid-string",
        "access_token": "optional-for-demo",
        "import_type": "skills" | "courses" | "all"
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        import_type = data.get('import_type', 'all')
        access_token = data.get('access_token', 'demo_token')
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        # Verify user exists
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT email FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_email = dict(user)['email']
        
        # Initialize LinkedIn integration
        linkedin = LinkedInIntegration(access_token)
        
        imported_counts = {
            "skills": 0,
            "courses": 0,
            "total": 0
        }
        
        # Import skills
        if import_type in ['skills', 'all']:
            skills = linkedin.import_skills(user_email)
            
            for skill in skills:
                try:
                    cursor.execute("""
                        INSERT INTO user_skills 
                        (user_id, skill_name, sector_context, confidence, source, acquired_date, evidence)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        user_id,
                        skill['skill_name'],
                        skill['sector_context'],
                        skill['confidence'],
                        'linkedin',
                        skill['acquired_date'],
                        json.dumps(skill['evidence'])
                    ))
                    imported_counts['skills'] += 1
                except Exception as e:
                    # Skip if duplicate (unique constraint)
                    if 'UNIQUE constraint failed' not in str(e):
                        print(f"Error importing skill {skill['skill_name']}: {e}")
        
        # Import courses
        if import_type in ['courses', 'all']:
            courses = linkedin.import_courses(user_email)
            
            for course in courses:
                try:
                    cursor.execute("""
                        INSERT INTO user_courses 
                        (user_id, course_name, platform, sector, completion_date, skills_gained, certificate_url)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        user_id,
                        course['course_name'],
                        course['platform'],
                        course['sector'],
                        course['completion_date'],
                        json.dumps(course['skills_gained']),
                        course['certificate_url']
                    ))
                    imported_counts['courses'] += 1
                except Exception as e:
                    print(f"Error importing course {course['course_name']}: {e}")
        
        # Update user's last_updated timestamp
        cursor.execute("""
            UPDATE users 
            SET last_updated = ? 
            WHERE user_id = ?
        """, (datetime.now().isoformat(), user_id))
        
        conn.commit()
        conn.close()
        
        imported_counts['total'] = imported_counts['skills'] + imported_counts['courses']
        
        return jsonify({
            "status": "success",
            "message": "LinkedIn data imported successfully",
            "imported": imported_counts,
            "source": "linkedin",
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to import LinkedIn data"
        }), 500


@integrations_bp.route('/import/linkedin/preview', methods=['POST'])
def preview_linkedin_import():
    """
    Preview what would be imported from LinkedIn without actually saving
    Useful for user confirmation before import
    """
    try:
        data = request.json
        access_token = data.get('access_token', 'demo_token')
        
        linkedin = LinkedInIntegration(access_token)
        preview_data = linkedin.get_profile_summary()
        
        return jsonify({
            "status": "success",
            "preview": preview_data,
            "counts": {
                "skills": len(preview_data['skills']),
                "courses": len(preview_data['courses']),
                "experience": len(preview_data['experience'])
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to preview LinkedIn data"
        }), 500
