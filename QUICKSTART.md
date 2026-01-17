# SkillGenome - Quick Start Guide

## 🚀 Setup (First Time Only)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Initialize Database

```bash
python app/init_db.py
```

---

## 🎯 Start Server

```bash
python start_server.py
```

Server runs at: **http://localhost:5000**

---

## 🧪 Test System

In a new terminal (while server is running):

```bash
python test_system.py
```

This will:
- Create a test user
- Add skills manually
- Import from LinkedIn (mock)
- Run gap analysis
- Verify all endpoints work

---

## 📚 API Endpoints

### **User Profile Management**

#### Create Profile
```bash
POST /api/profile
{
  "name": "John Doe",
  "email": "john@example.com",
  "target_sector": "Healthcare",
  "target_role": "data scientist"
}
```

#### Get Profile
```bash
GET /api/profile/<user_id>
```

#### Add Skill
```bash
POST /api/profile/<user_id>/skills
{
  "skill_name": "Python",
  "sector_context": "Healthcare Data Analysis",
  "confidence": 0.8,
  "source": "manual",
  "evidence": ["Project 1", "Course completion"]
}
```

#### Add Course
```bash
POST /api/profile/<user_id>/courses
{
  "course_name": "Machine Learning Specialization",
  "platform": "Coursera",
  "sector": "Healthcare",
  "completion_date": "2024-01-15",
  "skills_gained": ["ML", "Python", "TensorFlow"]
}
```

#### Add Project
```bash
POST /api/profile/<user_id>/projects
{
  "project_name": "Healthcare Dashboard",
  "description": "Patient data analytics platform",
  "sector": "Healthcare",
  "skills_used": ["Python", "Flask", "SQL"],
  "date_completed": "2024-02-01"
}
```

---

### **Resume Analysis**

```bash
POST /api/resume/analyze
Form Data:
- file: <resume.pdf>
- target_role: "data scientist"
```

---

### **Gap Analysis**

```bash
POST /api/gap-analysis/<user_id>
{
  "target_role": "data scientist",
  "target_sector": "Healthcare"
}
```

**Returns:**
- Readiness score (0-100)
- Missing required skills
- Missing preferred skills
- Weak skills needing improvement
- Actionable recommendations

#### Get Analysis History
```bash
GET /api/gap-analysis/<user_id>/history
```

---

### **LinkedIn Integration**

#### Import Skills & Courses
```bash
POST /api/import/linkedin
{
  "user_id": "<user_id>",
  "import_type": "all",
  "access_token": "demo_token"
}
```

#### Preview Import (No Save)
```bash
POST /api/import/linkedin/preview
{
  "access_token": "demo_token"
}
```

---

## 🎬 Demo Flow (For Judges)

### **Scenario 1: New User Journey**

1. **Create Profile**
```bash
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@uni.edu","target_sector":"Healthcare","target_role":"data scientist"}'
```

2. **Import from LinkedIn** (use user_id from step 1)
```bash
curl -X POST http://localhost:5000/api/import/linkedin \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<USER_ID>","import_type":"all"}'
```

3. **Run Gap Analysis**
```bash
curl -X POST http://localhost:5000/api/gap-analysis/<USER_ID> \
  -H "Content-Type: application/json" \
  -d '{"target_role":"data scientist","target_sector":"Healthcare"}'
```

4. **View Profile**
```bash
curl http://localhost:5000/api/profile/<USER_ID>
```

---

### **Scenario 2: Resume Upload**

```bash
curl -X POST http://localhost:5000/api/resume/analyze \
  -F "file=@resume.pdf" \
  -F "target_role=data scientist"
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (use PID from above)
taskkill /PID <PID> /F
```

### Database Issues
```bash
# Reinitialize database
rm skillgenome.db
python app/init_db.py
```

### Missing Dependencies
```bash
pip install -r requirements.txt --upgrade
```

---

## 📊 Available Roles & Sectors

### Healthcare
- data scientist
- ml engineer
- healthcare data analyst

### Agriculture
- agricultural data scientist
- precision farming specialist

### Urban
- urban planner
- smart city analyst

*(See `app/services/resume_analysis/roles.json` for complete list)*

---

## 🎯 Key Features for Demo

1. ✅ **User Profile System** - Create and manage user profiles
2. ✅ **Skill Tracking** - Add skills with sector context
3. ✅ **LinkedIn Import** - Mock integration (shows real capability)
4. ✅ **Resume Analysis** - Extract skills from PDF/DOCX
5. ✅ **Gap Analysis** - Identify missing skills & readiness score
6. ✅ **Recommendations** - Actionable next steps (courses/projects)
7. ✅ **Living System** - Track progression over time

---

## 🏆 Judge-Facing Highlights

**System Intelligence:**
- Sector-specific skill contextualization
- Evidence-based skill confidence scoring
- Explainable gap analysis
- Prioritized recommendations

**Technical Quality:**
- Clean REST API design
- Proper database schema
- External integration capability (LinkedIn)
- Comprehensive error handling

**Demo Readiness:**
- End-to-end test suite
- Clear API documentation
- Realistic mock data
- Fast response times

---

## 📝 Next Steps (If Time Permits)

- [ ] Add more sector-specific roles
- [ ] Enhance recommendation engine
- [ ] Build simple web dashboard
- [ ] Add skill progression timeline visualization
- [ ] Deploy to cloud (Railway/Render)

---

**Built with ❤️ for Emerging Sector Skill Intelligence**
