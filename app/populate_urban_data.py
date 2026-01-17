import sqlite3

def populate_urban_data(conn):
    cursor = conn.cursor()

    # Insert roles data
    urban_roles = [
        ("Urban Planner", "foundation", "GIS"),
        ("Urban Planner", "core", "Urban Design"),
        ("Urban Planner", "advanced", "Sustainable Development"),
        ("Civil Engineer", "foundation", "AutoCAD"),
        ("Civil Engineer", "core", "Structural Analysis"),
        ("Civil Engineer", "advanced", "Project Management")
    ]
    cursor.executemany('INSERT INTO roles (role_name, category, skill) VALUES (?, ?, ?)', urban_roles)

    # Insert ontology data
    urban_skills = [
        ("GIS"), ("Urban Design"), ("Sustainable Development"),
        ("AutoCAD"), ("Structural Analysis"), ("Project Management")
    ]
    cursor.executemany('INSERT INTO ontology (skill) VALUES (?)', [(skill,) for skill in urban_skills])

    # Insert courses data
    urban_courses = [
        ("GIS", "Coursera", "GIS Fundamentals", "https://www.coursera.org/learn/gis"),
        ("Urban Design", "edX", "Urban Design for the 21st Century", "https://www.edx.org/course/urban-design"),
        ("Sustainable Development", "Udemy", "Sustainable Urban Development", "https://www.udemy.com/course/sustainable-urban-development/"),
        ("AutoCAD", "LinkedIn Learning", "Learning AutoCAD", "https://www.linkedin.com/learning/learning-autocad"),
        ("Structural Analysis", "NPTEL", "Structural Analysis Basics", "https://nptel.ac.in/courses/105/105/105105108/"),
        ("Project Management", "Pluralsight", "Project Management for Engineers", "https://www.pluralsight.com/courses/project-management-engineers")
    ]
    cursor.executemany('INSERT INTO courses (skill, platform, title, url) VALUES (?, ?, ?, ?)', urban_courses)

    conn.commit()

def main():
    conn = sqlite3.connect('skillgenome.db')

    populate_urban_data(conn)

    conn.close()

if __name__ == '__main__':
    main()