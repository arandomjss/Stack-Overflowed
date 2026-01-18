"""
Comprehensive database population script for SkillGenome
Adds extensive roles, skills, courses, and YouTube recommendations
"""
import json
import sqlite3
import os

def create_tables(conn):
    cursor = conn.cursor()

    # Create roles table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT NOT NULL,
        category TEXT NOT NULL,
        skill TEXT NOT NULL,
        sector TEXT -- New field for industry sector
    )
    ''')

    # Create ontology table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ontology (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill TEXT NOT NULL UNIQUE
    )
    ''')

    # Create courses table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill TEXT NOT NULL,
        platform TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        sector TEXT -- New field for industry sector
    )
    ''')

    conn.commit()

def clear_existing_data(conn):
    """Drop existing tables to apply schema changes"""
    cursor = conn.cursor()
    cursor.execute('DROP TABLE IF EXISTS roles')
    cursor.execute('DROP TABLE IF EXISTS ontology')
    cursor.execute('DROP TABLE IF EXISTS courses')
    conn.commit()
    print("✓ Dropped existing tables for schema update")

def populate_comprehensive_ontology(conn):
    """Add comprehensive skill ontology"""
    skills = [
        # Programming Languages
        "python", "java", "javascript", "typescript", "c", "c++", "c#", "ruby", "php", "swift",
        "kotlin", "go", "rust", "scala", "r", "matlab", "perl", "lua", "dart", "elixir",
        
        # Web Technologies
        "html", "css", "react", "angular", "vue.js", "node.js", "express", "next.js", "nuxt.js",
        "django", "flask", "fastapi", "spring boot", "asp.net", "laravel", "ruby on rails",
        "jquery", "bootstrap", "tailwind css", "sass", "webpack", "vite",
        
        # Databases
        "sql", "mysql", "postgresql", "mongodb", "redis", "cassandra", "oracle", "sqlite",
        "dynamodb", "elasticsearch", "neo4j", "firebase", "mariadb", "couchdb",
        
        # Cloud & DevOps
        "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "github actions", "gitlab ci",
        "terraform", "ansible", "puppet", "chef", "circleci", "travis ci", "nginx", "apache",
        
        # Data Science & AI/ML
        "machine learning", "deep learning", "data science", "pandas", "numpy", "scikit-learn",
        "tensorflow", "pytorch", "keras", "opencv", "nlp", "computer vision", "data analysis",
        "statistics", "linear algebra", "calculus", "jupyter", "matplotlib", "seaborn", "plotly",
        
        # Mobile Development
        "android", "ios", "react native", "flutter", "xamarin", "ionic", "mobile development",
        
        # Tools & Version Control
        "git", "github", "gitlab", "bitbucket", "svn", "mercurial", "jira", "confluence",
        "slack", "trello", "asana", "notion",
        
        # Testing
        "unit testing", "integration testing", "jest", "mocha", "pytest", "junit", "selenium",
        "cypress", "test-driven development", "tdd", "bdd",
        
        # Architecture & Design
        "microservices", "rest api", "graphql", "system design", "design patterns", "solid principles",
        "object-oriented programming", "oop", "functional programming", "software architecture",
        "api design", "database design", "scalability", "performance optimization",
        
        # Methodologies
        "agile", "scrum", "kanban", "waterfall", "devops", "ci/cd", "project management",
        
        # Security
        "cybersecurity", "oauth", "jwt", "ssl", "encryption", "penetration testing", "security",
        
        # Soft Skills
        "communication", "teamwork", "problem solving", "critical thinking", "leadership",
        "time management", "collaboration", "presentation skills",
        
        # Computer Science Fundamentals
        "data structures", "algorithms", "operating systems", "computer networks", "compiler design",
        "graph theory", "complexity analysis", "sorting algorithms", "searching algorithms",
        "dynamic programming", "greedy algorithms", "recursion", "trees", "graphs", "hash tables",
        "linked lists", "stacks", "queues", "heaps", "tries",
        
        # Marketing Skills
        "seo", "sem", "content marketing", "social media marketing", "email marketing",
        "google analytics", "copywriting", "brand management", "crm", "growth hacking",
        
        # HR Skills
        "recruitment", "talent acquisition", "performance management", "employee relations",
        "onboarding", "hris", "payroll", "labor law", "organizational development",
        
        # Finance Skills
        "financial modeling", "accounting", "auditing", "risk management", "investment analysis",
        "corporate finance", "budgeting", "wealth management", "taxation", "fintech",
        
        # Design Skills
        "ui design", "ux design", "graphic design", "figma", "adobe xd", "photoshop",
        "illustrator", "wireframing", "prototyping", "user research", "interaction design",
        
        # Healthcare Skills
        "medical coding", "health informatics", "clinical data", "hipaa", "patient care",
        "electronic health records", "telehealth", "medical terminology"
    ]
    
    cursor = conn.cursor()
    for skill in skills:
        try:
            cursor.execute('INSERT OR IGNORE INTO ontology (skill) VALUES (?)', (skill.lower(),))
        except:
            pass
    conn.commit()
    print(f"✓ Added {len(skills)} skills to ontology")

def populate_comprehensive_roles(conn):
    """Add comprehensive role requirements"""
    roles_data = {
        "software engineer": {
            "foundation": ["python", "java", "javascript", "git", "data structures", "algorithms"],
            "core": ["rest api", "sql", "docker", "testing", "oop", "design patterns"],
            "advanced": ["system design", "microservices", "cloud computing", "ci/cd"],
            "projects": ["full stack application", "api development", "database optimization"]
        },
        "frontend developer": {
            "foundation": ["html", "css", "javascript", "git", "responsive design"],
            "core": ["react", "typescript", "webpack", "rest api", "state management"],
            "advanced": ["performance optimization", "pwa", "accessibility", "seo"],
            "projects": ["spa application", "dashboard", "e-commerce site"]
        },
        "backend developer": {
            "foundation": ["python", "java", "sql", "rest api", "git"],
            "core": ["node.js", "express", "postgresql", "mongodb", "authentication"],
            "advanced": ["microservices", "message queues", "caching", "scalability"],
            "projects": ["rest api", "microservice", "authentication system"]
        },
        "full stack developer": {
            "foundation": ["html", "css", "javascript", "python", "sql", "git"],
            "core": ["react", "node.js", "express", "mongodb", "rest api", "docker"],
            "advanced": ["aws", "ci/cd", "system design", "security", "testing"],
            "projects": ["full stack application", "saas platform", "api gateway"]
        },
        "data scientist": {
            "foundation": ["python", "r", "statistics", "sql", "data analysis"],
            "core": ["pandas", "numpy", "matplotlib", "machine learning", "scikit-learn"],
            "advanced": ["deep learning", "tensorflow", "nlp", "big data", "spark"],
            "projects": ["predictive model", "data pipeline", "ml model deployment"]
        },
        "machine learning engineer": {
            "foundation": ["python", "mathematics", "statistics", "algorithms"],
            "core": ["tensorflow", "pytorch", "scikit-learn", "deep learning", "neural networks"],
            "advanced": ["mlops", "model deployment", "distributed training", "transformers"],
            "projects": ["ml pipeline", "model api", "computer vision app"]
        },
        "devops engineer": {
            "foundation": ["linux", "bash", "git", "networking", "python"],
            "core": ["docker", "kubernetes", "jenkins", "terraform", "ansible"],
            "advanced": ["aws", "monitoring", "logging", "security", "infrastructure as code"],
            "projects": ["ci/cd pipeline", "infrastructure automation", "monitoring system"]
        },
        "data analyst": {
            "foundation": ["sql", "excel", "statistics", "data visualization"],
            "core": ["python", "pandas", "tableau", "power bi", "data cleaning"],
            "advanced": ["statistical modeling", "a/b testing", "business intelligence"],
            "projects": ["dashboard", "reporting system", "data analysis pipeline"]
        },
        "mobile developer": {
            "foundation": ["java", "kotlin", "swift", "git", "ui/ux basics"],
            "core": ["android", "ios", "react native", "flutter", "api integration"],
            "advanced": ["performance optimization", "offline storage", "push notifications"],
            "projects": ["mobile app", "cross-platform app", "native app"]
        },
        "cloud architect": {
            "sector": "Technology",
            "foundation": ["linux", "networking", "security", "databases"],
            "core": ["aws", "azure", "docker", "kubernetes", "terraform"],
            "advanced": ["system design", "high availability", "disaster recovery", "cost optimization"],
            "projects": ["cloud migration", "infrastructure design", "multi-region deployment"]
        },
        "digital marketing manager": {
            "sector": "Marketing",
            "foundation": ["seo", "content marketing", "social media marketing", "google analytics"],
            "core": ["email marketing", "crm", "copywriting", "sem"],
            "advanced": ["brand management", "growth hacking", "marketing automation"],
            "projects": ["marketing campaign", "seo audit", "lead generation system"]
        },
        "hr manager": {
            "sector": "HR",
            "foundation": ["recruitment", "employee relations", "onboarding", "communication"],
            "core": ["performance management", "labor law", "hris", "payroll"],
            "advanced": ["organizational development", "strategic hr", "change management"],
            "projects": ["hiring strategy", "performance review system", "employee engagement program"]
        },
        "financial analyst": {
            "sector": "Finance",
            "foundation": ["financial modeling", "accounting", "excel", "statistics"],
            "core": ["investment analysis", "corporate finance", "budgeting", "valuation"],
            "advanced": ["risk management", "market research", "financial reporting"],
            "projects": ["investment portfolio", "budget forecast", "financial statement analysis"]
        },
        "ui/ux designer": {
            "sector": "Design",
            "foundation": ["ui design", "ux design", "figma", "user research"],
            "core": ["wireframing", "prototyping", "visual design", "interaction design"],
            "advanced": ["design systems", "usability testing", "adobe creative suite"],
            "projects": ["mobile app design", "web platform redesign", "design system"]
        },
        "health informatics specialist": {
            "sector": "Healthcare",
            "foundation": ["medical terminology", "health informatics", "data analysis"],
            "core": ["electronic health records", "hipaa", "clinical data", "sql"],
            "advanced": ["healthcare analytics", "interoperability", "telehealth"],
            "projects": ["ehr implementation", "patient data analysis", "health dashboard"]
        }
    }
    
    # Update existing roles to have a default sector
    tech_roles = ["software engineer", "frontend developer", "backend developer", "full stack developer", 
                  "data scientist", "machine learning engineer", "devops engineer", "data analyst", "mobile developer"]
    for role in tech_roles:
        if role in roles_data:
            roles_data[role]["sector"] = "Technology"

    cursor = conn.cursor()
    count = 0
    for role, data in roles_data.items():
        sector = data.get("sector", "General")
        for category, skills in data.items():
            if category == "sector": continue
            for skill in skills:
                cursor.execute(
                    'INSERT INTO roles (role_name, category, skill, sector) VALUES (?, ?, ?, ?)',
                    (role, category, skill.lower(), sector)
                )
                count += 1
    conn.commit()
    print(f"✓ Added {count} role-skill mappings for {len(roles_data)} roles")

def populate_comprehensive_courses(conn):
    """Add comprehensive course recommendations"""
    courses_data = {
        "python": [
            {"platform": "Coursera", "title": "Python for Everybody", "url": "https://www.coursera.org/specializations/python"},
            {"platform": "Udemy", "title": "Complete Python Bootcamp", "url": "https://www.udemy.com/course/complete-python-bootcamp/"},
            {"platform": "edX", "title": "Introduction to Python", "url": "https://www.edx.org/learn/python"},
            {"platform": "Codecademy", "title": "Learn Python 3", "url": "https://www.codecademy.com/learn/learn-python-3"}
        ],
        "java": [
            {"platform": "Coursera", "title": "Java Programming and Software Engineering", "url": "https://www.coursera.org/specializations/java-programming"},
            {"platform": "Udemy", "title": "Java Programming Masterclass", "url": "https://www.udemy.com/course/java-the-complete-java-developer-course/"},
            {"platform": "Pluralsight", "title": "Java Fundamentals", "url": "https://www.pluralsight.com/courses/java-fundamentals"}
        ],
        "javascript": [
            {"platform": "Udemy", "title": "The Complete JavaScript Course", "url": "https://www.udemy.com/course/the-complete-javascript-course/"},
            {"platform": "Coursera", "title": "JavaScript for Beginners", "url": "https://www.coursera.org/learn/javascript-basics"},
            {"platform": "freeCodeCamp", "title": "JavaScript Algorithms and Data Structures", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/"}
        ],
        "react": [
            {"platform": "Udemy", "title": "React - The Complete Guide", "url": "https://www.udemy.com/course/react-the-complete-guide/"},
            {"platform": "Coursera", "title": "Front-End Web Development with React", "url": "https://www.coursera.org/learn/front-end-react"},
            {"platform": "Scrimba", "title": "Learn React for Free", "url": "https://scrimba.com/learn/learnreact"}
        ],
        "node.js": [
            {"platform": "Udemy", "title": "The Complete Node.js Developer Course", "url": "https://www.udemy.com/course/the-complete-nodejs-developer-course/"},
            {"platform": "Coursera", "title": "Server-side Development with NodeJS", "url": "https://www.coursera.org/learn/server-side-nodejs"},
            {"platform": "Pluralsight", "title": "Node.js Fundamentals", "url": "https://www.pluralsight.com/courses/nodejs-fundamentals"}
        ],
        "docker": [
            {"platform": "Udemy", "title": "Docker Mastery", "url": "https://www.udemy.com/course/docker-mastery/"},
            {"platform": "Coursera", "title": "Introduction to Docker", "url": "https://www.coursera.org/learn/docker-fundamentals"},
            {"platform": "Pluralsight", "title": "Docker Deep Dive", "url": "https://www.pluralsight.com/courses/docker-deep-dive"}
        ],
        "kubernetes": [
            {"platform": "Udemy", "title": "Kubernetes for the Absolute Beginners", "url": "https://www.udemy.com/course/learn-kubernetes/"},
            {"platform": "Linux Foundation", "title": "Kubernetes Fundamentals (LFS158)", "url": "https://training.linuxfoundation.org/training/kubernetes-fundamentals/"},
            {"platform": "Coursera", "title": "Getting Started with Google Kubernetes Engine", "url": "https://www.coursera.org/learn/google-kubernetes-engine"}
        ],
        "aws": [
            {"platform": "AWS", "title": "AWS Cloud Practitioner Essentials", "url": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/"},
            {"platform": "Udemy", "title": "AWS Certified Solutions Architect", "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate/"},
            {"platform": "Coursera", "title": "AWS Fundamentals", "url": "https://www.coursera.org/specializations/aws-fundamentals"}
        ],
        "machine learning": [
            {"platform": "Coursera", "title": "Machine Learning by Andrew Ng", "url": "https://www.coursera.org/learn/machine-learning"},
            {"platform": "Udemy", "title": "Machine Learning A-Z", "url": "https://www.udemy.com/course/machinelearning/"},
            {"platform": "edX", "title": "Machine Learning Fundamentals", "url": "https://www.edx.org/learn/machine-learning"}
        ],
        "data science": [
            {"platform": "Coursera", "title": "Data Science Specialization", "url": "https://www.coursera.org/specializations/jhu-data-science"},
            {"platform": "Udemy", "title": "Python for Data Science and Machine Learning", "url": "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/"},
            {"platform": "DataCamp", "title": "Data Scientist with Python", "url": "https://www.datacamp.com/tracks/data-scientist-with-python"}
        ],
        "sql": [
            {"platform": "Coursera", "title": "SQL for Data Science", "url": "https://www.coursera.org/learn/sql-for-data-science"},
            {"platform": "Udemy", "title": "The Complete SQL Bootcamp", "url": "https://www.udemy.com/course/the-complete-sql-bootcamp/"},
            {"platform": "Mode", "title": "SQL Tutorial", "url": "https://mode.com/sql-tutorial/"}
        ],
        "git": [
            {"platform": "Udemy", "title": "Git Complete: Definitive Guide", "url": "https://www.udemy.com/course/git-complete/"},
            {"platform": "GitHub", "title": "Git and GitHub for Beginners", "url": "https://lab.github.com/"},
            {"platform": "Pluralsight", "title": "Git Fundamentals", "url": "https://www.pluralsight.com/courses/git-fundamentals"}
        ],
        "data structures": [
            {"platform": "Coursera", "title": "Data Structures and Algorithms", "url": "https://www.coursera.org/specializations/data-structures-algorithms"},
            {"platform": "Udemy", "title": "Master the Coding Interview: Data Structures + Algorithms", "url": "https://www.udemy.com/course/master-the-coding-interview-data-structures-algorithms/"},
            {"platform": "edX", "title": "Data Structures Fundamentals", "url": "https://www.edx.org/learn/data-structures"}
        ],
        "algorithms": [
            {"platform": "Coursera", "title": "Algorithms Specialization", "url": "https://www.coursera.org/specializations/algorithms"},
            {"platform": "MIT OpenCourseWare", "title": "Introduction to Algorithms", "url": "https://ocw.mit.edu/courses/introduction-to-algorithms/"},
            {"platform": "Udemy", "title": "JavaScript Algorithms and Data Structures", "url": "https://www.udemy.com/course/js-algorithms-and-data-structures-masterclass/"}
        ],
        "typescript": [
            {"platform": "Udemy", "title": "Understanding TypeScript", "url": "https://www.udemy.com/course/understanding-typescript/"},
            {"platform": "Pluralsight", "title": "TypeScript Fundamentals", "url": "https://www.pluralsight.com/courses/typescript"},
            {"platform": "Coursera", "title": "TypeScript for React Developers", "url": "https://www.coursera.org/learn/typescript"}
        ],
        "mongodb": [
            {"platform": "MongoDB University", "title": "MongoDB Basics", "url": "https://university.mongodb.com/"},
            {"platform": "Udemy", "title": "MongoDB - The Complete Developer's Guide", "url": "https://www.udemy.com/course/mongodb-the-complete-developers-guide/"},
            {"platform": "Coursera", "title": "Introduction to MongoDB", "url": "https://www.coursera.org/learn/introduction-mongodb"}
        ],
        "html": [
            {"platform": "Codecademy", "title": "Learn HTML", "url": "https://www.codecademy.com/learn/learn-html"},
            {"platform": "freeCodeCamp", "title": "Responsive Web Design", "url": "https://www.freecodecamp.org/learn/responsive-web-design/"},
            {"platform": "Udemy", "title": "HTML5 and CSS3 for Beginners", "url": "https://www.udemy.com/course/html-css-for-beginners/"}
        ],
        "css": [
            {"platform": "Codecademy", "title": "Learn CSS", "url": "https://www.codecademy.com/learn/learn-css"},
            {"platform": "Udemy", "title": "Advanced CSS and Sass", "url": "https://www.udemy.com/course/advanced-css-and-sass/"},
            {"platform": "freeCodeCamp", "title": "CSS Flexbox and Grid", "url": "https://www.freecodecamp.org/learn/"}
        ],
        "rest api": [
            {"platform": "Udemy", "title": "REST APIs with Flask and Python", "url": "https://www.udemy.com/course/rest-api-flask-and-python/"},
            {"platform": "Pluralsight", "title": "REST API Design", "url": "https://www.pluralsight.com/courses/rest-api-design"},
            {"platform": "Coursera", "title": "Building Web APIs with ASP.NET", "url": "https://www.coursera.org/learn/web-api"}
        ],
        "system design": [
            {"platform": "Udemy", "title": "System Design Interview Course", "url": "https://www.udemy.com/course/system-design-interview/"},
            {"platform": "Coursera", "title": "Software Architecture and Design", "url": "https://www.coursera.org/learn/software-architecture"},
            {"platform": "educative.io", "title": "Grokking the System Design Interview", "url": "https://www.educative.io/courses/grokking-the-system-design-interview"}
        ],
        "seo": [
            {"platform": "HubSpot", "title": "SEO Certification", "url": "https://academy.hubspot.com/courses/seo-training"},
            {"platform": "Coursera", "title": "Search Engine Optimization Specialization", "url": "https://www.coursera.org/specializations/seo"}
        ],
        "recruitment": [
            {"platform": "LinkedIn Learning", "title": "Technical Recruiting", "url": "https://www.linkedin.com/learning/technical-recruiting"},
            {"platform": "Coursera", "title": "Recruiting and Talent Acquisition", "url": "https://www.coursera.org/learn/recruiting-talent-acquisition"}
        ],
        "financial modeling": [
            {"platform": "Udemy", "title": "Complete Financial Analyst Training", "url": "https://www.udemy.com/course/the-complete-financial-analyst-course/"},
            {"platform": "Coursera", "title": "Finance & Quantitative Modeling", "url": "https://www.coursera.org/specializations/finance-quantitative-modeling-introduction"}
        ],
        "figma": [
            {"platform": "Udemy", "title": "Figma UI/UX Design", "url": "https://www.udemy.com/course/figma-ux-ui-design-complete-course/"},
            {"platform": "Coursera", "title": "Google UX Design Professional Certificate", "url": "https://www.coursera.org/professional-certificates/google-ux-design"}
        ],
        "health informatics": [
            {"platform": "Coursera", "title": "Health Informatics Specialization", "url": "https://www.coursera.org/specializations/health-informatics"},
            {"platform": "edX", "title": "Health Informatics Fundamentals", "url": "https://www.edx.org/learn/health-informatics"}
        ]
    }
    
    # Assign sectors to skills for better filtering later
    skill_sectors = {
        "seo": "Marketing", "recruitment": "HR", "financial modeling": "Finance", 
        "figma": "Design", "health informatics": "Healthcare"
    }

    cursor = conn.cursor()
    count = 0
    for skill, courses in courses_data.items():
        sector = skill_sectors.get(skill.lower(), "Technology")
        for course in courses:
            cursor.execute(
                'INSERT INTO courses (skill, platform, title, url, sector) VALUES (?, ?, ?, ?, ?)',
                (skill.lower(), course['platform'], course['title'], course['url'], sector)
            )
            count += 1
    conn.commit()
    print(f"✓ Added {count} course recommendations")

def verify_data(conn):
    """Verify the populated data"""
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) FROM ontology')
    ontology_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM roles')
    roles_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM courses')
    courses_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(DISTINCT role_name) FROM roles')
    unique_roles = cursor.fetchone()[0]
    
    print(f"\n📊 Database Statistics:")
    print(f"  • Skills in ontology: {ontology_count}")
    print(f"  • Role-skill mappings: {roles_count}")
    print(f"  • Unique roles: {unique_roles}")
    print(f"  • Course recommendations: {courses_count}")

def main():
    # Get the database path
    db_path = 'skillgenome.db'
    
    print("🚀 Starting comprehensive database population...")
    
    conn = sqlite3.connect(db_path)
    
    # Clear existing data (drop tables)
    clear_existing_data(conn)
    
    # Create tables
    create_tables(conn)
    print("✓ Created tables with updated schema")
    
    # Populate data
    populate_comprehensive_ontology(conn)
    populate_comprehensive_roles(conn)
    populate_comprehensive_courses(conn)
    
    # Verify
    verify_data(conn)
    
    conn.close()
    
    print("\n✅ Database population complete!")
    print(f"📁 Database location: {db_path}")

if __name__ == '__main__':
    main()
