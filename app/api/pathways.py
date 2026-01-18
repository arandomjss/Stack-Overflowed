from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Tuple

from flask import Blueprint, jsonify, request

from app.database import get_db_connection
from app.services.resume_analysis.roadmap import _load_roles
from app.services.resume_analysis.utils import match_role


pathways_bp = Blueprint('pathways', __name__)


def _find_matching_confidence(required_skill: str, user_skills_dict: Dict[str, float]) -> Optional[float]:
    """Find a user's confidence for a required skill using exact or partial match."""
    required_lower = (required_skill or '').strip().lower()
    if not required_lower:
        return None

    if required_lower in user_skills_dict:
        return user_skills_dict[required_lower]

    for user_skill, confidence in user_skills_dict.items():
        if required_lower in user_skill or user_skill in required_lower:
            return confidence

    return None


def _safe_json_loads(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return default


def _get_user_skill_map(user_id: str) -> Tuple[Dict[str, float], Dict[str, List[str]]]:
    """Return (skill_name->confidence, skill_name->evidence list). Keys are lowercased."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT skill_name, confidence, evidence
            FROM user_skills
            WHERE user_id = ?
            """,
            (user_id,),
        )

        skill_to_conf: Dict[str, float] = {}
        skill_to_evidence: Dict[str, List[str]] = {}

        for row in cursor.fetchall():
            name = str(row['skill_name'] or '').strip()
            if not name:
                continue
            key = name.lower()
            conf = row['confidence']
            try:
                conf_val = float(conf) if conf is not None else 0.0
            except Exception:
                conf_val = 0.0

            # Keep max confidence if duplicates exist
            if key not in skill_to_conf or conf_val > skill_to_conf[key]:
                skill_to_conf[key] = conf_val

            evidence_raw = None
            try:
                evidence_raw = row['evidence']
            except Exception:
                evidence_raw = None

            evidence_list = _safe_json_loads(evidence_raw, [])
            if isinstance(evidence_list, list):
                skill_to_evidence[key] = [str(x) for x in evidence_list]
            else:
                skill_to_evidence[key] = []

        return skill_to_conf, skill_to_evidence
    finally:
        conn.close()


def _get_courses_for_skill(skill: str, limit: int = 2) -> List[Dict[str, str]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT platform, title, url
            FROM courses
            WHERE LOWER(skill) = LOWER(?)
            LIMIT ?
            """,
            (skill, limit),
        )
        return [
            {
                'platform': row['platform'],
                'title': row['title'],
                'url': row['url'],
            }
            for row in cursor.fetchall()
        ]
    finally:
        conn.close()


@pathways_bp.route('/pathways/tree', methods=['GET'])
def get_pathway_tree():
    """Return a role-based skill pathway tree with completion statuses.

    Query params:
      - user_id (required)
      - target_role (optional; defaults to user's target_role; fallback 'software engineer')
      - target_sector (optional; defaults to user's target_sector; fallback 'Healthcare')
    """
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({'error': 'User not found'}), 404
            user = dict(user)
        finally:
            conn.close()

        target_role = (request.args.get('target_role') or user.get('target_role') or 'software engineer').strip()
        target_sector = (request.args.get('target_sector') or user.get('target_sector') or 'Healthcare').strip()

        roles_data = _load_roles()
        available_roles = sorted(list(roles_data.keys()))

        matched_role = match_role(target_role, roles_data)
        if not matched_role:
            matched_role = 'software engineer' if 'software engineer' in roles_data else (available_roles[0] if available_roles else None)

        if not matched_role or matched_role not in roles_data:
            return jsonify({'error': 'No roles available in database'}), 500

        role_requirements = roles_data[matched_role]

        skill_to_conf, skill_to_evidence = _get_user_skill_map(user_id)

        phases_out: List[Dict[str, Any]] = []
        complete = weak = missing = 0

        # Keep stable ordering across phases
        for phase_name in ['foundation', 'core', 'advanced', 'projects']:
            required_skills = role_requirements.get(phase_name, []) or []
            skills_out: List[Dict[str, Any]] = []

            for skill in required_skills:
                confidence = _find_matching_confidence(skill, skill_to_conf)

                if confidence is None:
                    status = 'missing'
                    missing += 1
                elif confidence < 0.5:
                    status = 'weak'
                    weak += 1
                else:
                    status = 'complete'
                    complete += 1

                skill_key = str(skill).strip().lower()
                skills_out.append(
                    {
                        'name': skill,
                        'status': status,
                        'confidence': confidence,
                        'evidence': skill_to_evidence.get(skill_key, []),
                        'courses': _get_courses_for_skill(skill) if status != 'complete' else [],
                    }
                )

            phases_out.append({'phase': phase_name, 'skills': skills_out})

        total = complete + weak + missing
        readiness_score = round((complete / total) * 100, 2) if total > 0 else 0.0

        # "Which jobs can you get": score other roles by foundation+core match
        suggested_roles: List[Dict[str, Any]] = []
        for role_name, reqs in roles_data.items():
            req_skills = (reqs.get('foundation', []) or []) + (reqs.get('core', []) or [])
            if not req_skills:
                continue

            matched_required = 0
            for req in req_skills:
                c = _find_matching_confidence(req, skill_to_conf)
                if c is not None and c >= 0.5:
                    matched_required += 1

            fit_score = (matched_required / len(req_skills)) * 100
            suggested_roles.append(
                {
                    'role': role_name,
                    'fit_score': round(fit_score, 2),
                    'matched_required': matched_required,
                    'total_required': len(req_skills),
                }
            )

        suggested_roles.sort(key=lambda r: r['fit_score'], reverse=True)
        suggested_roles = suggested_roles[:5]

        return jsonify(
            {
                'user_id': user_id,
                'target_sector': target_sector,
                'target_role_input': target_role,
                'target_role': matched_role,
                'available_roles': available_roles,
                'stats': {
                    'skills_total': total,
                    'skills_complete': complete,
                    'skills_weak': weak,
                    'skills_missing': missing,
                    'readiness_score': readiness_score,
                },
                'pathway': {
                    'phases': phases_out,
                },
                'suggested_roles': suggested_roles,
            }
        ), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
