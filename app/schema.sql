-- SkillGenome Database Schema
-- SQLite database for user profiles, skills, courses, projects, and gap analysis

-- Users table: Core user information
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200),
    target_sector VARCHAR(50),  -- Healthcare, Agriculture, Urban
    target_role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Skills: Skills with sector context (living system)
CREATE TABLE IF NOT EXISTS user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    sector_context VARCHAR(100),  -- e.g., "Python for Healthcare Data"
    confidence REAL CHECK(confidence >= 0 AND confidence <= 1),
    source VARCHAR(50),  -- 'manual', 'resume', 'linkedin', 'course'
    acquired_date TIMESTAMP,
    evidence TEXT,  -- JSON array of project names, course names, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, skill_name, sector_context)
);

-- User Courses: Completed courses and certifications
CREATE TABLE IF NOT EXISTS user_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    platform VARCHAR(100),  -- Coursera, Udemy, etc.
    sector VARCHAR(50),
    completion_date TIMESTAMP,
    skills_gained TEXT,  -- JSON array
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- User Projects: Academic and personal projects
CREATE TABLE IF NOT EXISTS user_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    description TEXT,
    sector VARCHAR(50),
    skills_used TEXT,  -- JSON array
    github_url TEXT,
    date_completed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Skill Gap Analysis: Historical analysis results
CREATE TABLE IF NOT EXISTS skill_gap_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    target_sector VARCHAR(50) NOT NULL,
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    readiness_score REAL CHECK(readiness_score >= 0 AND readiness_score <= 100),
    missing_skills TEXT,  -- JSON array
    weak_skills TEXT,  -- JSON array
    recommendations TEXT,  -- JSON array of next actions
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- User Achievements: Awards, certifications, recognitions
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    achievement_type VARCHAR(50),  -- 'award', 'certification', 'competition'
    title VARCHAR(200) NOT NULL,
    issuer VARCHAR(100),
    date_received TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_user ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_user ON skill_gap_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_date ON skill_gap_analysis(analysis_date DESC);
