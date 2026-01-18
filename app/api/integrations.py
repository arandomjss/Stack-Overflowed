from flask import Blueprint, request, jsonify
from app.integrations.linkedin import LinkedInIntegration
from app.integrations.github import import_github_profile, parse_github_username
from app.database import get_db_connection
import json
from datetime import datetime
import os
from urllib.parse import parse_qs

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
    """Import projects + inferred skills from GitHub.

    Request body (either works):
    {
      "user_id": "uuid-string",
      "github_username": "username"
    }
    {
      "user_id": "uuid-string",
      "github_url": "https://github.com/username"
    }

    Optional:
    {
      "include_language_breakdown": true
    }
    """
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            data = {}

        if not data and request.form:
            data = request.form.to_dict(flat=True)

        if not data:
            raw = (request.get_data(as_text=True) or '').strip()
            if raw:
                if raw.startswith('{'):
                    try:
                        data = json.loads(raw)
                    except Exception:
                        return jsonify({"error": "Invalid JSON body"}), 400
                else:
                    parsed = parse_qs(raw, keep_blank_values=True)
                    if parsed:
                        data = {k: (v[0] if isinstance(v, list) and v else v) for k, v in parsed.items()}

        user_id = data.get('user_id')
        github_username = data.get('github_username')
        github_url = data.get('github_url')

        include_language_breakdown = str(data.get('include_language_breakdown', 'false')).lower() in {
            '1', 'true', 'yes', 'on'
        }

        if not github_username and github_url:
            github_username = parse_github_username(github_url)
        
        if not user_id or not github_username:
            return jsonify({"error": "user_id and github_username (or github_url) are required"}), 400
        
        # Verify user exists
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            return jsonify({"error": "User not found"}), 404

        user = dict(user)
        
        # Server-side caps to keep token usage under control
        project_limit = int(os.getenv('GITHUB_PROJECT_LIMIT', '10'))
        language_call_limit = int(os.getenv('GITHUB_LANGUAGE_CALL_LIMIT', '0'))

        github_data = import_github_profile(
            github_username,
            project_limit=project_limit,
            include_language_breakdown=include_language_breakdown,
            language_call_limit=language_call_limit,
        )

        if 'error' in github_data and not github_data.get('projects'):
            conn.close()
            return jsonify({
                "error": github_data['error'],
                "imported": {"projects": 0, "skills": 0}
            }), 400

        github_projects = github_data.get('projects') or []
        github_skills = github_data.get('skills') or []
        
        imported_projects = 0
        imported_skills = 0
        
        # Insert projects
        returned_projects = []
        returned_skills = []

        for project in github_projects:
            try:
                # prevent duplicate project rows for same URL
                cursor.execute(
                    "SELECT 1 FROM user_projects WHERE user_id = ? AND github_url = ? LIMIT 1",
                    (user_id, project['url'])
                )
                exists = cursor.fetchone()

                if exists:
                    returned_projects.append(project)
                    continue

                cursor.execute("""
                    INSERT INTO user_projects 
                    (user_id, project_name, description, sector, skills_used, github_url, date_completed)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    project['name'],
                    project['description'],
                    user.get('target_sector', 'Tech'),
                    json.dumps([project.get('language')] + (project.get('topics') or [])),
                    project['url'],
                    project['updated_at']
                ))
                imported_projects += 1
                returned_projects.append(project)
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
                    "GitHub",
                    skill['confidence'],
                    'github',
                    json.dumps([skill['evidence']])
                ))
                imported_skills += 1
                returned_skills.append(skill)
            except Exception as e:
                # Skip duplicates
                returned_skills.append(skill)
                continue
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "imported": {
                "projects": imported_projects,
                "skills": imported_skills
            },
            "github_username": github_username,
            "total_repos": github_data.get('total_repos', 0),
            "projects": returned_projects,
            "skills": returned_skills,
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
        data = request.get_json(silent=True) or {}
        github_username = data.get('github_username')
        github_url = data.get('github_url')
        if not github_username and github_url:
            github_username = parse_github_username(github_url)

        include_language_breakdown = str(data.get('include_language_breakdown', 'false')).lower() in {
            '1', 'true', 'yes', 'on'
        }
        
        if not github_username:
            return jsonify({"error": "github_username is required"}), 400

        project_limit = int(os.getenv('GITHUB_PROJECT_LIMIT', '10'))
        language_call_limit = int(os.getenv('GITHUB_LANGUAGE_CALL_LIMIT', '0'))

        github_data = import_github_profile(
            github_username,
            project_limit=project_limit,
            include_language_breakdown=include_language_breakdown,
            language_call_limit=language_call_limit,
        )

        if 'error' in github_data and not github_data.get('projects'):
            return jsonify({
                "error": github_data['error'],
                "preview": {"projects": [], "skills": []}
            }), 400
        
        return jsonify({
            "status": "success",
            "preview": {
                "projects": github_data.get('projects', []),
                "skills": github_data.get('skills', []),
                "total_repos": github_data.get('total_repos', 0)
            },
            "counts": {
                "projects": len(github_data.get('projects', [])),
                "skills": len(github_data.get('skills', []))
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to preview GitHub data"
        }), 500
