# api/routers/groups.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas, auth
from ..permissions import role_of, is_admin_or_pm, group_payload_in_hosp_domain, group_is_in_hosp_domain

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=List[schemas.GroupResponse])
def read_groups(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # ✅ Sin condiciones: si el token es válido, cualquier rol ve la lista.
    return db.query(models.Group).all()


@router.delete("/{id}")
def delete_group(id: int, db: Session = Depends(get_db),
                 current_user: models.User = Depends(auth.get_current_user)):
    # ❌ Aquí sí bloqueamos: solo Admin/PM
    if not is_admin_or_pm(current_user):
        raise HTTPException(status_code=403, detail="Only Admin/PM can delete")

    row = db.query(models.Group).filter(models.Group.id == id).first()
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}