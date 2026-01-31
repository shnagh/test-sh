from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

# RELATIVE IMPORTS
from . import models
from . import schemas
from . import auth
from .database import engine, get_db

# Initialize DB Tables
try:
    models.Base.metadata.create_all(bind=engine)
    print("✅ DB connected.")
except Exception as e:
    print("❌ DB Startup Error:", e)

app = FastAPI(title="Study Program Backend", root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root(): return {"message": "Backend Online"}


# --- 🛠️ SMART SEED & MIGRATION ENDPOINT ---
@app.get("/seed")
def seed_users(db: Session = Depends(get_db)):
    log = []

    # 1. Create PM/Admin User
    if not db.query(models.User).filter(models.User.email == "pm@icss.com").first():
        hashed = auth.get_password_hash("password")
        db.add(models.User(email="pm@icss.com", password_hash=hashed, role="pm"))
        log.append("✅ PM User Created (pm@icss.com)")

    # 2. DATA MIGRATION: Connect Program Text Names to Lecturer IDs
    # This fixes the "Unknown" Head of Program issue by filling head_of_program_id
    programs = db.query(models.StudyProgram).all()
    for prog in programs:
        # Check if we have a name but no ID link
        if not prog.head_of_program_id and hasattr(prog, 'head_of_program') and prog.head_of_program:
            parts = prog.head_of_program.strip().split(" ")
            if len(parts) >= 1:
                last_name = parts[-1]
                lecturer = db.query(models.Lecturer).filter(models.Lecturer.last_name.ilike(last_name)).first()
                if lecturer:
                    prog.head_of_program_id = lecturer.id
                    db.add(prog)
                    log.append(f"🔧 MIGRATION: Linked '{prog.name}' to Lecturer ID {lecturer.id}")

    # 3. Create HoSP User (Linked to Mohammed/ID 1)
    if not db.query(models.User).filter(models.User.email == "hosp@icss.com").first():
        lecturer = db.query(models.Lecturer).filter(models.Lecturer.id == 1).first()
        if lecturer:
            hashed = auth.get_password_hash("password")
            db.add(models.User(email="hosp@icss.com", password_hash=hashed, role="hosp", lecturer_id=lecturer.id))
            log.append("✅ HoSP User Created")

    # 4. Create Student User
    if not db.query(models.User).filter(models.User.email == "student@icss.com").first():
        hashed = auth.get_password_hash("password")
        db.add(models.User(email="student@icss.com", password_hash=hashed, role="student"))
        log.append("✅ Student User Created")

    db.commit()
    return {"status": "Seed & Migration Complete", "changes": log}


# --- HELPER: Permission Checks ---
def check_admin_or_pm(user: models.User):
    # Case-insensitive check to support "PM" and "pm" roles
    if user.role.lower() not in ["admin", "pm"]:
        raise HTTPException(status_code=403, detail="Admin or PM privileges required")


def check_is_hosp_for_program(user: models.User, program: models.StudyProgram):
    role = user.role.lower()
    if role in ["admin", "pm"]:
        return True
    if role == "hosp":
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        if not user.lecturer_id or user.lecturer_id != program.head_of_program_id:
            raise HTTPException(status_code=403, detail="You can only edit programs you lead.")
        return True
    raise HTTPException(status_code=403, detail="Permission denied")


# --- AUTH ---
@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email/password")
    access_token = auth.create_access_token(data={
        "sub": user.email,
        "role": user.role,
        "lecturer_id": user.lecturer_id
    })
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


# --- PROGRAMS ---
@app.get("/study-programs/", response_model=List[schemas.StudyProgramResponse])
def read_programs(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.StudyProgram).options(joinedload(models.StudyProgram.head_lecturer)).all()


@app.post("/study-programs/", response_model=schemas.StudyProgramResponse)
def create_program(p: schemas.StudyProgramCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    check_admin_or_pm(current_user)
    row = models.StudyProgram(**p.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return row


@app.put("/study-programs/{id}", response_model=schemas.StudyProgramResponse)
def update_program(id: int, p: schemas.StudyProgramCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    row = db.query(models.StudyProgram).filter(models.StudyProgram.id == id).first()
    if not row: raise HTTPException(404)
    check_is_hosp_for_program(current_user, row)
    for k, v in p.model_dump().items(): setattr(row, k, v)
    db.commit(); db.refresh(row)
    return row


@app.delete("/study-programs/{id}")
def delete_program(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    check_admin_or_pm(current_user)
    row = db.query(models.StudyProgram).filter(models.StudyProgram.id == id).first()
    if row: db.delete(row); db.commit()
    return {"ok": True}


# --- LECTURERS ---
@app.get("/lecturers/", response_model=List[schemas.LecturerResponse])
def read_lecturers(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Lecturer).all()


@app.put("/lecturers/{id}", response_model=schemas.LecturerResponse)
def update_lecturer(id: int, l: schemas.LecturerCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    row = db.query(models.Lecturer).filter(models.Lecturer.id == id).first()
    if not row: raise HTTPException(404)
    if current_user.role.lower() == "lecturer":
        if current_user.lecturer_id != id: raise HTTPException(403, "You can only update your own profile")
        if l.personal_email: row.personal_email = l.personal_email
        if l.phone: row.phone = l.phone
        db.commit(); db.refresh(row)
        return row
    check_admin_or_pm(current_user)
    for k, v in l.model_dump().items(): setattr(row, k, v)
    db.commit(); db.refresh(row)
    return row


# --- MODULES ---
@app.get("/modules/", response_model=List[schemas.ModuleResponse])
def read_modules(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Module).options(joinedload(models.Module.specializations)).all()


# --- SPECIALIZATIONS ---
@app.get("/specializations/", response_model=List[schemas.SpecializationResponse])
def read_specs(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Specialization).all()


@app.post("/specializations/", response_model=schemas.SpecializationResponse)
def create_spec(s: schemas.SpecializationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    program = db.query(models.StudyProgram).filter(models.StudyProgram.id == s.program_id).first()
    if not program: raise HTTPException(404, "Program not found")
    check_is_hosp_for_program(current_user, program)
    row = models.Specialization(**s.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return row


# --- GROUPS ---
@app.get("/groups/", response_model=List[schemas.GroupResponse])
def read_groups(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Group).all()


@app.post("/groups/", response_model=schemas.GroupResponse)
def create_group(g: schemas.GroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role.lower() == "student": raise HTTPException(403)
    row = models.Group(**g.model_dump())
    db.add(row); db.commit(); db.refresh(row)
    return row


# --- ROOMS ---
@app.get("/rooms/", response_model=List[schemas.RoomResponse])
def read_rooms(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Room).all()


# --- AVAILABILITY ---
@app.post("/availabilities/update")
def update_availability(payload: schemas.AvailabilityUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    role = current_user.role.lower()
    if role == "lecturer":
        if current_user.lecturer_id != payload.lecturer_id:
            raise HTTPException(403, "You can only edit your own availability")
    elif role not in ["admin", "pm"]:
        raise HTTPException(403, "Not permitted")

    existing = db.query(models.LecturerAvailability).filter(
        models.LecturerAvailability.lecturer_id == payload.lecturer_id
    ).first()
    if existing:
        existing.schedule_data = payload.schedule_data
        db.commit(); db.refresh(existing)
        return existing
    else:
        new_entry = models.LecturerAvailability(**payload.model_dump())
        db.add(new_entry); db.commit(); db.refresh(new_entry)
        return new_entry


# --- CONSTRAINTS ---
@app.get("/scheduler-constraints/", response_model=List[schemas.SchedulerConstraintResponse])
def read_scheduler_constraints(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.SchedulerConstraint).all()