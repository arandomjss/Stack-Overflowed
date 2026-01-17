from flask import Blueprint, request, jsonify
import jwt
import uuid
import hashlib
import bcrypt as bcrypt_lib
from datetime import datetime, timedelta
from app.database import get_db_connection

SECRET_KEY = "your_secret_key"  # Replace with a secure key

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """Hash password with SHA-256 first to bypass bcrypt's 72-byte limit, then use bcrypt"""
    # SHA-256 the password first (produces fixed 64-char hex string)
    sha_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    # Then bcrypt the SHA hash
    return bcrypt_lib.hashpw(sha_hash.encode('utf-8'), bcrypt_lib.gensalt()).decode('utf-8')

def verify_password(password, password_hash):
    """Verify password by SHA-256 hashing first, then bcrypt verification"""
    sha_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return bcrypt_lib.checkpw(sha_hash.encode('utf-8'), password_hash.encode('utf-8'))

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    name = data.get('name', username)  # Optional name field

    if not username or not password or not email:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if username already exists
        cursor.execute("SELECT user_id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Username already exists"}), 400

        # Create new user
        new_user_id = str(uuid.uuid4())
        password_hash = hash_password(password)
        
        cursor.execute("""
            INSERT INTO users (user_id, username, name, email, password_hash)
            VALUES (?, ?, ?, ?, ?)
        """, (new_user_id, username, name, email, password_hash))
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": "User registered successfully", "user_id": new_user_id}), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT user_id, password_hash FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()
        
        if not user or not user['password_hash']:
            return jsonify({"error": "Invalid credentials"}), 401
        
        if not verify_password(password, user['password_hash']):
            return jsonify({"error": "Invalid credentials"}), 401

        token = jwt.encode({
            "user_id": user['user_id'],
            "exp": datetime.utcnow() + timedelta(hours=1)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({"token": token, "user_id": user['user_id']}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/protected', methods=['GET'])
def protected():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"error": "Token is missing"}), 401

    try:
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
            
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = decoded.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({"error": "Invalid token"}), 401
            
        return jsonify({"message": "Access granted", "user": user['username']}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500