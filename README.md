# SkillGenome (Career Architect)

SkillGenome is a full-stack “Career Architect” platform that turns a user’s resume + GitHub activity into a living skill profile, then computes role-based gaps and produces an explainable learning roadmap (skills, courses, and pathway phases).

## GitHub Repository Guidelines (IEEE AUSB)

This repository must meet the hackathon submission requirements:

1) **Access**
- The repository must be **Public**.
- Add **IEEE AUSB** as a contributor: https://github.com/IEEE-Ahmedabad-University-SB-Official

2) **README requirements** (fulfilled below)
- Project overview & features
- Tech stack
- Setup steps & how to run locally (copy‑paste commands)
- Environment variable examples
- Test login credentials (if needed)
- Basic error handling
- Confirmation of no secrets in the repo

## Project Overview & Features

- **User profiles**: persist skills, projects, and career goal (sector + target role)
- **Resume analysis**: extract skills from PDF/DOCX
- **GitHub import**: infer skills from repos/languages and save as projects/skills
- **Gap analysis**: compute readiness score + missing/weak skills for a target role
- **Recommendations**: course/video suggestions per skill gap
- **Career Pathways**: role-based skill tree (foundation → core → advanced → projects)

## Tech Stack

**Backend**
- Python + Flask
- SQLite
- NLP/AI: spaCy, KeyBERT, Sentence Transformers
- Parsing: pdfplumber, python-docx

**Frontend**
- React + TypeScript
- Vite
- TailwindCSS
- Framer Motion

## Setup & Run Locally (Copy‑Paste)

### Prerequisites

- Python 3.x
- Node.js 20+ (for Vite)

### 1) Backend setup

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app/init_db.py
python start_server.py
```

Backend runs at:
- `http://localhost:5000`
- Health check: `http://localhost:5000/health`

### 2) Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at (Vite default):
- `http://localhost:5173`

### 3) (Optional) Configure frontend API base URL

If your backend isn’t `http://localhost:5000`, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Environment Variables (Examples)

Create a root `.env` (optional for local dev):

```env
# Flask
FLASK_APP=start_server.py
FLASK_ENV=development
SECRET_KEY=dev_only_change_me

# Optional: GitHub API token (recommended to avoid rate limits)
# NOTE: Token is read from environment only (not stored in UI).
GITHUB_TOKEN=ghp_your_token_here
```

## Test Login Credentials (Demo)

If you want a predictable demo login, run:

register and log in with:
- Username: `varantesting`
- Password: `Varantesting123`
empty profile to test extraction from resume and adding into the profile 

- Username: `xyz`
- Password: `123456`
already made profile with pre defined skills 

## API Smoke Test (Recommended)

With the backend running, execute:

```bash
python test_system.py
```

This creates a sample profile via API, adds skills, runs gap analysis, and prints the generated `user_id`.

## Basic Error Handling / Troubleshooting

### Common API responses

- `400 Bad Request`: missing required JSON fields (e.g., `target_role`)
- `401 Unauthorized`: missing/invalid session (log in again)
- `404 Not Found` / `{"error":"User not found"}`: your browser has a stale `user_id` (log out/log in to refresh)
- `500 Internal Server Error`: check backend terminal logs for the stack trace

### Port already in use (Windows)

```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database reset

```bash
rm skillgenome.db
python app/init_db.py
```

## Confirmation: No Secrets in This Repo

- No secrets are committed intentionally.
- API tokens (e.g., `GITHUB_TOKEN`) must be provided via environment variables and should **never** be committed.
- Recommended: add `.env` files to `.gitignore` (and verify before pushing).

