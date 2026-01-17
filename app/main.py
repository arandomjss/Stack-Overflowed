from flask import Flask, render_template, jsonify
from app.api import resume
from app.api.user_profile import profile_bp
from app.api.integrations import integrations_bp
from app.routes.gap_analysis import gap_analysis_bp
from app.routes import auth_bp
from app.models.database import db
import os

app = Flask(__name__, template_folder='../templates')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///skillgenome.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

db.init_app(app)

# Configure CORS properly for preflight requests
from flask_cors import CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:5174"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Register all blueprints
app.register_blueprint(resume.bp, url_prefix="/api/resume")
app.register_blueprint(profile_bp, url_prefix="/api")
app.register_blueprint(integrations_bp, url_prefix="/api")
app.register_blueprint(gap_analysis_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix="/auth")

# Initialize database tables with SQLAlchemy
with app.app_context():
    db.create_all()

@app.route("/", methods=["GET"])
def root():
    """Serve the test interface"""
    return render_template("index.html")

@app.route("/api", methods=["GET"])
def api_info():
    """API documentation endpoint"""
    return jsonify({
        "status": "ok",
        "service": "SkillGenome API",
        "version": "1.0.0",
        "endpoints": {
            "user_profiles": "/api/profile",
            "resume_analysis": "/api/resume/analyze",
            "gap_analysis": "/api/gap-analysis/<user_id>",
            "linkedin_import": "/api/import/linkedin",
            "health": "/health",
            "test_interface": "/"
        }
    }), 200

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    print("=" * 60)
    print(" SkillGenome Backend Server Starting...")
    print("=" * 60)
    print("Server: http://localhost:5000")
    print("Health: http://localhost:5000/health")
    print("API Docs: See /api endpoints")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
