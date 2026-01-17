# SkillGenome - Resume Analysis & Course Suggestion

A powerful tool that extracts skills from resumes, suggests relevant courses, and provides a learning roadmap. It bridges the gap between current skills and target role requirements using AI-driven analysis.

## 🚀 Key Features
- **User Profile Management**: Create and manage user profiles with target roles and sectors.
- **Resume Analysis**: Extract skills from PDF/DOCX resumes automatically.
- **Gap Analysis**: specialized algorithms to identify missing skills and provide a readiness score.
- **Smart Recommendations**: Suggests courses and projects to bridge skill gaps.
- **LinkedIn Integration**: Mock capabilities to import skills and courses.
- **Living System**: Tracks user progression over time.

## 🛠️ Tech Stack
- **Backend**: Python, Flask
- **Database**: SQLite (SQLAlchemy)
- **AI/NLP**: spaCy, KeyBERT, Sentence Transformers
- **File Parsing**: pdfplumber, python-docx
- **Testing**: Pytest

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd Stack-Overflowed
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Initialize Database
```bash
python app/init_db.py
```

### 3. Start the Server
```bash
python start_server.py
```
The server will run at: **http://localhost:5000**

## 🧪 How to Test

### Automated System Test
Run the full system verification script:
```bash
python test_system.py
```
This script acts as a test client that:
1. Creates a test user
2. Adds skills
3. Runs gap analysis
4. Verifies all API endpoints

## 🔐 Environment Variables
Create a `.env` file in the root directory (optional for local dev, but recommended for production features):

```env
# Example .env
FLASK_APP=start_server.py
FLASK_ENV=development
SECRET_KEY=your_secret_key_here
# DATABASE_URL=sqlite:///skillgenome.db (defaults to this if not set)
```

## 📚 API Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/profile` | Create a new user profile |
| POST | `/api/resume/analyze` | Upload resume for analysis |
| POST | `/api/gap-analysis/<user_id>` | Run gap analysis for target role |
| post | `/api/profile/<user_id>/skills` | Manually add a skill |

### Example: Run Gap Analysis
```bash
curl -X POST http://localhost:5000/api/gap-analysis/<USER_ID> \
  -H "Content-Type: application/json" \
  -d '{"target_role":"data scientist","target_sector":"Healthcare"}'
```

## 🔧 Troubleshooting / Error Handling

### Port Already in Use
If port 5000 is taken:
```bash
# Windows (PowerShell)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Errors
If you encounter database schema errors, reset the DB:
```bash
rm skillgenome.db
python app/init_db.py
```

### Missing Dependencies
Ensure all packages are up to date:
```bash
pip install -r requirements.txt --upgrade
```

---
