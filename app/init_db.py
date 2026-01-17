from app.models.database import db

def initialize_database():
    db.create_all()
    print("Database initialized successfully!")

if __name__ == "__main__":
    initialize_database()