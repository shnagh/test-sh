from pydantic import BaseModel, Field, EmailStr, ConfigDict, computed_field
from typing import List, Optional, Dict, Any, Literal


# --- AUTH & USER ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


# --- AVAILABILITY ---
class AvailabilityResponse(BaseModel):
    id: int
    lecturer_id: int
    schedule_data: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)


class AvailabilityUpdate(BaseModel):
    lecturer_id: int
    schedule_data: Dict[str, Any]


# --- PROGRAMS ---
class StudyProgramCreate(BaseModel):
    name: str
    acronym: str
    head_of_program_id: Optional[int] = None  # ✅ ID Based
    start_date: str
    total_ects: int
    level: str = "Bachelor"
    status: bool = True
    location: Optional[str] = None
    degree_type: Optional[str] = None


class StudyProgramResponse(BaseModel):
    id: int
    name: str
    acronym: str
    start_date: str
    total_ects: int
    level: str
    status: bool
    location: Optional[str] = None
    degree_type: Optional[str] = None
    head_of_program_id: Optional[int] = None

    # ✅ COMPUTED: Fetches name from DB relation so Frontend sees "Prof X" not "5"
    head_lecturer: Optional['LecturerResponse'] = None

    @computed_field
    def head_of_program(self) -> str:
        if self.head_lecturer:
            return f"{self.head_lecturer.title} {self.head_lecturer.first_name} {self.head_lecturer.last_name}"
        return "Unknown"

    model_config = ConfigDict(from_attributes=True)


# ... [Keep Specialization, Module, Lecturer, Group, Room, Constraint schemas exactly as is] ...
# Paste existing schemas here
class SpecializationCreate(BaseModel):
    name: str
    acronym: str
    start_date: str
    status: bool = True
    program_id: int


class SpecializationResponse(SpecializationCreate):
    id: int
    study_program: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# --- MODULES ---
class ModuleCreate(BaseModel):
    module_code: str
    name: str
    ects: int
    room_type: str
    semester: int
    assessment_type: Optional[str] = None
    category: Optional[str] = None
    program_id: Optional[int] = None
    specialization_ids: List[int] = []


class ModuleResponse(BaseModel):
    module_code: str
    name: str
    ects: int
    room_type: str
    semester: int
    assessment_type: Optional[str] = None
    category: Optional[str] = None
    program_id: Optional[int] = None

    specializations: List[SpecializationResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- LECTURERS ---
class LecturerCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    title: str
    employment_type: str
    personal_email: Optional[str] = None
    mdh_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    teaching_load: Optional[str] = None


class LecturerResponse(LecturerCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- GROUPS ---
class GroupCreate(BaseModel):
    name: str
    size: int
    description: Optional[str] = None
    email: Optional[str] = None
    program: Optional[str] = None
    parent_group: Optional[str] = None


class GroupResponse(GroupCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- ROOMS ---
class RoomCreate(BaseModel):
    name: str
    capacity: int
    type: str
    status: bool
    equipment: Optional[str] = None
    location: Optional[str] = None


class RoomResponse(RoomCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- CONSTRAINTS ---
class ConstraintTypeResponse(BaseModel):
    id: int
    name: str
    active: bool
    model_config = ConfigDict(from_attributes=True)


class SchedulerConstraintCreate(BaseModel):
    constraint_type_id: int
    hardness: str
    weight: Optional[int] = None
    scope: str
    target_id: Optional[int] = None
    config: Dict[str, Any] = {}
    is_enabled: bool = True
    notes: Optional[str] = None


class SchedulerConstraintResponse(SchedulerConstraintCreate):
    id: int
    constraint_type: Optional[ConstraintTypeResponse] = None
    model_config = ConfigDict(from_attributes=True)