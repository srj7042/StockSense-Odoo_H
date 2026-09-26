from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/warehouses", tags=["Warehouses"])

@router.get("", response_model=List[schemas.WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    whs = db.query(models.Warehouse).order_by(models.Warehouse.name.asc()).all()
    results = []
    for wh in whs:
        locs = [
            schemas.LocationOut(
                id=l.id,
                warehouse_id=l.warehouse_id,
                parent_location_id=l.parent_location_id,
                name=l.name,
                code=l.code,
                active=l.active,
                warehouse_name=wh.name,
                parent_name=l.parent.name if l.parent else None
            ) for l in wh.locations
        ]
        results.append(schemas.WarehouseOut(
            id=wh.id,
            name=wh.name,
            code=wh.code,
            address=wh.address,
            active=wh.active,
            locations=locs
        ))
    return results

@router.post("", response_model=schemas.WarehouseOut, status_code=201)
def create_warehouse(
    payload: schemas.WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Warehouse).filter(models.Warehouse.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Warehouse code '{payload.code}' already exists")
    wh = models.Warehouse(**payload.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return schemas.WarehouseOut(
        id=wh.id, name=wh.name, code=wh.code, address=wh.address, active=wh.active, locations=[]
    )

@router.put("/{warehouse_id}", response_model=schemas.WarehouseOut)
def update_warehouse(
    warehouse_id: int,
    payload: schemas.WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    wh = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(wh, key, value)
    db.commit()
    db.refresh(wh)
    locs = [
        schemas.LocationOut(
            id=l.id, warehouse_id=l.warehouse_id, parent_location_id=l.parent_location_id,
            name=l.name, code=l.code, active=l.active, warehouse_name=wh.name,
            parent_name=l.parent.name if l.parent else None
        ) for l in wh.locations
    ]
    return schemas.WarehouseOut(
        id=wh.id, name=wh.name, code=wh.code, address=wh.address, active=wh.active, locations=locs
    )
