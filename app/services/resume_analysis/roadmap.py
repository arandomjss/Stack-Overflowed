import json
import os
from typing import List, Dict, Set
from app.models.schemas import Skill, RoadmapPhase, RoadmapSkill

from app.database import get_db_connection
from typing import Dict, List

def _load_roles() -> Dict:
    conn = get_db_connection()
    roles_data = {}
    try:
        # Structure: role -> category -> list of skills
        rows = conn.execute('SELECT role_name, category, skill FROM roles').fetchall()
        
        for row in rows:
            role = row['role_name']
            category = row['category']
            skill = row['skill']
            
            if role not in roles_data:
                roles_data[role] = {}
            if category not in roles_data[role]:
                roles_data[role][category] = []
                
            roles_data[role][category].append(skill)
            
    finally:
        conn.close()
    return roles_data

def _get_user_skills(scored_skills: List[Skill], threshold: float = 0.3) -> Set[str]:
    return {skill.name.lower() for skill in scored_skills if skill.confidence >= threshold}

def generate_roadmap(scored_skills: List[Skill], target_role: str) -> List[RoadmapPhase]:
    roles_data = _load_roles()
    
    if target_role not in roles_data:
        target_role = list(roles_data.keys())[0]
    
    role_requirements = roles_data[target_role]
    user_skills = _get_user_skills(scored_skills)
    
    foundation_skills = []
    core_skills = []
    advanced_skills = []
    project_skills = []
    
    for phase_name, required_skills in role_requirements.items():
        for skill in required_skills:
            skill_lower = skill.lower()
            if skill_lower not in user_skills:
                skill_obj = RoadmapSkill(name=skill, courses=[])
                if phase_name == "foundation":
                    foundation_skills.append(skill_obj)
                elif phase_name == "core":
                    core_skills.append(skill_obj)
                elif phase_name == "advanced":
                    advanced_skills.append(skill_obj)
                elif phase_name == "projects":
                    project_skills.append(skill_obj)
            else:
                user_skill = next((s for s in scored_skills if s.name.lower() == skill_lower), None)
                if user_skill and user_skill.confidence < 0.6:
                    skill_obj = RoadmapSkill(name=skill, courses=[])
                    if phase_name == "foundation":
                        foundation_skills.append(skill_obj)
                    elif phase_name == "core":
                        core_skills.append(skill_obj)
                    elif phase_name == "advanced":
                        advanced_skills.append(skill_obj)
                    elif phase_name == "projects":
                        project_skills.append(skill_obj)
    
    roadmap = []
    if foundation_skills:
        roadmap.append(RoadmapPhase(phase="foundation", skills=foundation_skills))
    if core_skills:
        roadmap.append(RoadmapPhase(phase="core", skills=core_skills))
    if advanced_skills:
        roadmap.append(RoadmapPhase(phase="advanced", skills=advanced_skills))
    if project_skills:
        roadmap.append(RoadmapPhase(phase="projects", skills=project_skills))
    
    return roadmap
