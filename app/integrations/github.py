"""
GitHub Integration - Real API Implementation
Free tier: 5000 requests/hour, no auth needed for public data
"""
import requests

def import_github_projects(username):
    """
    Import user's GitHub repositories as projects
    """
    try:
        url = f"https://api.github.com/users/{username}/repos"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 404:
            return {"error": "GitHub user not found", "projects": []}
        
        if response.status_code != 200:
            return {"error": f"GitHub API error: {response.status_code}", "projects": []}
        
        repos = response.json()
        
        projects = []
        skills_extracted = set()
        
        for repo in repos[:10]:  # Limit to 10 most recent
            # Extract languages as skills
            if repo.get('language'):
                skills_extracted.add(repo['language'])
            
            # Extract topics as skills
            if repo.get('topics'):
                for topic in repo['topics']:
                    skills_extracted.add(topic.title())
            
            projects.append({
                "name": repo['name'],
                "description": repo['description'] or "No description",
                "url": repo['html_url'],
                "language": repo.get('language', 'Unknown'),
                "topics": repo.get('topics', []),
                "stars": repo.get('stargazers_count', 0),
                "updated_at": repo.get('updated_at')
            })
        
        return {
            "projects": projects,
            "skills_extracted": sorted(list(skills_extracted)),
            "total_repos": len(repos)
        }
    
    except Exception as e:
        return {"error": str(e), "projects": []}


def import_github_skills(username):
    """
    Extract skills from GitHub profile languages
    """
    try:
        url = f"https://api.github.com/users/{username}/repos"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return []
        
        repos = response.json()
        
        # Count language usage
        language_count = {}
        total_repos = len(repos)
        
        for repo in repos:
            lang = repo.get('language')
            if lang:
                language_count[lang] = language_count.get(lang, 0) + 1
        
        # Convert to skills with confidence based on usage
        skills = []
        for lang, count in language_count.items():
            confidence = min(count / total_repos, 1.0)  # Cap at 1.0
            skills.append({
                "name": lang,
                "confidence": round(confidence, 2),
                "source": "github",
                "evidence": f"Used in {count}/{total_repos} repositories"
            })
        
        # Sort by confidence
        skills.sort(key=lambda x: x['confidence'], reverse=True)
        
        return skills
    
    except Exception as e:
        return []
