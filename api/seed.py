from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models, auth

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

def create_user(email, password, role, lecturer_id=None):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"Creating {role} user: {email}")
        hashed = auth.get_password_hash(password)
        new_user = models.User(
            email=email,
            password_hash=hashed,
            role=role,
            lecturer_id=lecturer_id
        )
        db.add(new_user)
        db.commit()
    else:
        print(f"User {email} already exists.")

# 1. Admin/PM
create_user("pm@icss.com", "password", "pm")

# 2. HoSP (Needs to be linked to a Lecturer ID to work!)
# We'll assume Lecturer ID 1 exists. If not, create a dummy lecturer first.
lecturer = db.query(models.Lecturer).first()
if not lecturer:
    print("Creating dummy lecturer for HoSP linking...")
    lecturer = models.Lecturer(first_name="Prof", last_name="Test", title="Dr.", employment_type="Full time", personal_email="hosp@icss.com")
    db.add(lecturer)
    db.commit()
    db.refresh(lecturer)

create_user("hosp@icss.com", "password", "hosp", lecturer_id=lecturer.id)

# 3. Lecturer
create_user("lecturer@icss.com", "password", "lecturer", lecturer_id=lecturer.id)

# 4. Student
create_user("student@icss.com", "password", "student")

print("✅ Seed complete.")
db.close()