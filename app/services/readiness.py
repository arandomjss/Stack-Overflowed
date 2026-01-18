from __future__ import annotations

from typing import Dict, Iterable, Optional, Tuple


def _find_matching_confidence(required_skill: str, user_skills_dict: Dict[str, float]) -> Optional[float]:
    required_lower = (required_skill or '').strip().lower()
    if not required_lower:
        return None

    if required_lower in user_skills_dict:
        return user_skills_dict[required_lower]

    for user_skill, confidence in user_skills_dict.items():
        if required_lower in user_skill or user_skill in required_lower:
            return confidence

    return None


def build_skill_conf_map_from_rows(rows: Iterable[dict]) -> Dict[str, float]:
    """Build a lowercase skill->confidence map from DB-like dict rows."""
    out: Dict[str, float] = {}
    for row in rows:
        name = str(row.get('skill_name') or '').strip()
        if not name:
            continue
        key = name.lower()
        conf = row.get('confidence')
        try:
            conf_val = float(conf) if conf is not None else 0.0
        except Exception:
            conf_val = 0.0
        if key not in out or conf_val > out[key]:
            out[key] = conf_val
    return out


def build_skill_conf_map_from_request(skills: Iterable[dict]) -> Dict[str, float]:
    """Build a lowercase skill->confidence map from request skills {name, confidence}."""
    out: Dict[str, float] = {}
    for s in skills:
        name = str(s.get('name') or '').strip()
        if not name:
            continue
        key = name.lower()
        conf = s.get('confidence')
        try:
            conf_val = float(conf) if conf is not None else 0.0
        except Exception:
            conf_val = 0.0
        if key not in out or conf_val > out[key]:
            out[key] = conf_val
    return out


def compute_role_readiness(
    role_requirements: dict,
    user_skill_conf: Dict[str, float],
    *,
    phases: Tuple[str, ...] = ('foundation', 'core', 'advanced', 'projects'),
    complete_threshold: float = 0.5,
) -> Dict[str, float]:
    """Compute readiness as % of role skills with confidence >= threshold.

    - complete: confidence >= threshold
    - weak: 0 < confidence < threshold
    - missing: confidence is None

    Returns counts + readiness_score in [0, 100].
    """

    complete = weak = missing = 0

    for phase in phases:
        skills = role_requirements.get(phase, []) or []
        for required_skill in skills:
            c = _find_matching_confidence(str(required_skill), user_skill_conf)
            if c is None:
                missing += 1
            elif c < complete_threshold:
                weak += 1
            else:
                complete += 1

    total = complete + weak + missing
    readiness_score = round((complete / total) * 100, 2) if total > 0 else 0.0

    return {
        'skills_total': total,
        'skills_complete': complete,
        'skills_weak': weak,
        'skills_missing': missing,
        'readiness_score': readiness_score,
    }


def compute_core_fit(
    role_requirements: dict,
    user_skill_conf: Dict[str, float],
    *,
    phases: Tuple[str, ...] = ('foundation', 'core'),
    complete_threshold: float = 0.5,
) -> Dict[str, float]:
    """Compute fit as % of core skills satisfied (confidence >= threshold)."""

    matched = total = 0
    for phase in phases:
        skills = role_requirements.get(phase, []) or []
        for required_skill in skills:
            total += 1
            c = _find_matching_confidence(str(required_skill), user_skill_conf)
            if c is not None and c >= complete_threshold:
                matched += 1

    fit_score = round((matched / total) * 100, 2) if total > 0 else 0.0
    return {
        'fit_score': fit_score,
        'matched_required': matched,
        'total_required': total,
    }
