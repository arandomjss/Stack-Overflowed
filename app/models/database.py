from flask_sqlalchemy import SQLAlchemy
from passlib.hash import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.String(50), primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200))
    target_sector = db.Column(db.String(50))
    target_role = db.Column(db.String(100))
    
    def get_id(self):
        return self.user_id

    def set_password(self, password):
        self.password_hash = bcrypt.hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.verify(password, self.password_hash)