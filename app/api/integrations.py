from flask import Blueprint, request, jsonify
from app.integrations.linkedin import LinkedInIntegration
from app.integrations.github import import_github_projects, import_github_skills
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


@integrations_bp.route('/import/github', methods=['POST'])
def import_from_github():
    """
    Import projects and skills from GitHub (REAL API - Free)
    
    Request body:
    {
        "user_id": "uuid-string",
        "github_username": "username"
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        github_username = data.get('github_username')
        
        if not user_id or not github_username:
            return jsonify({"error": "user_id and github_username are required"}), 400
        
        # Verify user exists
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        # Import projects from GitHub
        github_data = import_github_projects(github_username)
        
        if 'error' in github_data and not github_data['projects']:
            conn.close()
            return jsonify({
                "error": github_data['error'],
                "imported": {"projects": 0, "skills": 0}
            }), 400
        
        # Import skills
        github_skills = import_github_skills(github_username)
        
        imported_projects = 0
        imported_skills = 0
        
        # Insert projects
        for project in github_data['projects']:
            try:
                cursor.execute("""
                    INSERT INTO user_projects 
                    (user_id, project_name, description, sector, skills_used, github_url, date_completed)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    project['name'],
                    project['description'],
                    user.get('target_sector', 'Tech'),
                    json.dumps([project['language']] + project['topics']),
                    project['url'],
                    project['updated_at']
                ))
                imported_projects += 1
            except Exception as e:
                # Skip duplicates
                continue
        
        # Insert skills
        for skill in github_skills:
            try:
                cursor.execute("""
                    INSERT INTO user_skills 
                    (user_id, skill_name, sector_context, confidence, source, evidence)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    skill['name'],
                    f"GitHub: {skill['evidence']}",
                    skill['confidence'],
                    'github',
                    json.dumps([skill['evidence']])
                ))
                imported_skills += 1
            except Exception as e:
                # Skip duplicates
                continue
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "imported": {
                "projects": imported_projects,
                "skills": imported_skills
            },
            "total_repos": github_data.get('total_repos', 0),
            "message": f"Imported {imported_projects} projects and {imported_skills} skills from GitHub"
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "message": "Failed to import GitHub data"
        }), 500


@integrations_bp.route('/import/github/preview', methods=['POST'])
def preview_github_data():
    """
    Preview what would be imported from GitHub before importing
    """
    try:
        data = request.json
        github_username = data.get('github_username')
        
        if not github_username:
            return jsonify({"error": "github_username is required"}), 400
        
        github_data = import_github_projects(github_username)
        github_skills = import_github_skills(github_username)
        
        if 'error' in github_data and not github_data['projects']:
            return jsonify({
                "error": github_data['error'],
                "preview": {"projects": [], "skills": []}
            }), 400
        
        return jsonify({
            "status": "success",
            "preview": {
                "projects": github_data['projects'],
                "skills": github_skills,
                "total_repos": github_data.get('total_repos', 0)
            },
            "counts": {
                "projects": len(github_data['projects']),
                "skills": len(github_skills)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to preview GitHub data"
        }), 500
