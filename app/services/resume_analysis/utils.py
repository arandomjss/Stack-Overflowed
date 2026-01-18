
from typing import Dict, Optional, List
import re

def match_role(target_role: str, roles_data: Dict) -> Optional[str]:
    """
    Find the best matching role from roles_data using fuzzy matching.
    Returns the canonical role name or None if no match is found.
    """
    if not target_role:
        return None
        
    target_lower = target_role.lower().strip()
    available_roles = list(roles_data.keys())
    
    # 1. Exact match
    for role in available_roles:
        if role.lower() == target_lower:
            return role
            
    # 2. Contains match
    for role in available_roles:
        role_lower = role.lower()
        if target_lower in role_lower or role_lower in target_lower:
            return role
            
    # 3. Handle common variations (e.g., 'dev' -> 'developer')
    variations = {
        'dev': 'developer',
        'ml': 'machine learning',
        'fe': 'frontend',
        'be': 'backend'
    }
    
    augmented_target = target_lower
    for short, long in variations.items():
        augmented_target = re.sub(rf'\b{short}\b', long, augmented_target)
        
    if augmented_target != target_lower:
        for role in available_roles:
            role_lower = role.lower()
            if augmented_target in role_lower or role_lower in augmented_target:
                return role
                
    return None
