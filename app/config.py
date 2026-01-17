import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///skillgenome.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # API Keys
    GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '')
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')

    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')