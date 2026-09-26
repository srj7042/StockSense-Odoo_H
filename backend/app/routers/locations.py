from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/locations", tags=["Locations"])

@router.get("", response_model=List[schemas.LocationOut])
def list_locations(
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Location)
    if warehouse_id:
        query = query.filter(models.Location.warehouse_id == warehouse_id)
    locs = query.order_by(models.Location.name.asc()).all()

    return [
        schemas.LocationOut(
            id=l.id,
            warehouse_id=l.warehouse_id,
            parent_location_id=l.parent_location_id,
            name=l.name,
            code=l.code,
            active=l.active,
            warehouse_name=l.warehouse.name if l.warehouse else "",
            parent_name=l.parent.name if l.parent else None
        ) for l in locs
    ]

@router.post("", response_model=schemas.LocationOut, status_code=201)
def create_location(
    payload: schemas.LocationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Location).filter(models.Location.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Location code '{payload.code}' already exists")
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == payload.warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=400, detail="Invalid Warehouse ID")

    loc = models.Location(**payload.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)

    return schemas.LocationOut(
        id=loc.id,
        warehouse_id=loc.warehouse_id,
        parent_location_id=loc.parent_location_id,
        name=loc.name,
        code=loc.code,
        active=loc.active,
        warehouse_name=wh.name,
        parent_name=loc.parent.name if loc.parent else None
    )
