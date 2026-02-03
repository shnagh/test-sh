# api/routers/modules.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from .. import models, schemas, auth
# Asegúrate de que estas funciones existan en api/permissions.py
from ..permissions import role_of, is_admin_or_pm, hosp_program_ids, require_admin_or_pm

router = APIRouter(prefix="/modules", tags=["modules"])


# ✅ GET: Leer todos los módulos (Público/Autenticado)
@router.get("/", response_model=List[schemas.ModuleResponse])
def read_modules(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Module).options(joinedload(models.Module.specializations)).all()


# ✅ POST: Crear módulo (Solo Admin/PM/HoSP)
@router.post("/", response_model=schemas.ModuleResponse)
def create_module(p: schemas.ModuleCreate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    r = role_of(current_user)

    # 1. Verificación de Permisos
    if is_admin_or_pm(current_user):
        pass
    elif r == "hosp":
        if p.program_id is None:
            raise HTTPException(status_code=400, detail="program_id is required")
        # Verifica que el HoSP sea dueño del programa
        if p.program_id not in hosp_program_ids(db, current_user):
            raise HTTPException(status_code=403, detail="You can only create modules for your program")
    else:
        # Student / Lecturer no pasan
        raise HTTPException(status_code=403, detail="Only Admins, PMs or HoSPs can create modules")

    # 2. Crear el objeto (excluyendo specialization_ids para manejarlo aparte si fuera necesario)
    # Nota: Si usas Pydantic v1, cambia .model_dump() por .dict()
    module_data = p.model_dump(exclude={"specialization_ids"})
    row = models.Module(**module_data)

    db.add(row)
    db.commit()
    db.refresh(row)
    return row


# ✅ PUT: Editar módulo (Solo Admin/PM/HoSP dueño)
@router.put("/{module_code}", response_model=schemas.ModuleResponse)
def update_module(module_code: str, p: schemas.ModuleUpdate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    # 1. Buscar módulo
    row = db.query(models.Module).filter(models.Module.module_code == module_code).first()
    if not row:
        raise HTTPException(status_code=404, detail="Module not found")

    # 2. Permisos
    r = role_of(current_user)
    if not is_admin_or_pm(current_user):
        # Si no es admin, tiene que ser HoSP Y el módulo debe ser de sus programas
        if r != "hosp" or row.program_id not in hosp_program_ids(db, current_user):
            raise HTTPException(status_code=403, detail="Not authorized to update this module")

    # 3. Actualizar datos
    data = p.model_dump(exclude_unset=True)

    # Manejo de especializaciones (Many-to-Many)
    if "specialization_ids" in data:
        spec_ids = data.pop("specialization_ids")
        if spec_ids is not None:
            specs = db.query(models.Specialization).filter(models.Specialization.id.in_(spec_ids)).all()
            row.specializations = specs

    # Actualizar campos simples
    for k, v in data.items():
        setattr(row, k, v)

    db.commit()
    db.refresh(row)
    return row


# ✅ DELETE: Borrar módulo (Solo Admin/PM)
@router.delete("/{module_code}")
def delete_module(module_code: str, db: Session = Depends(get_db),
                  current_user: models.User = Depends(auth.get_current_user)):
    # Solo Admin/PM pueden borrar
    require_admin_or_pm(current_user)

    row = db.query(models.Module).filter(models.Module.module_code == module_code).first()
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}