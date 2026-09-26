from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/adjustments", tags=["Inventory Adjustments"])

def _format_adjustment(a: models.InventoryAdjustment, db: Session) -> schemas.AdjustmentOut:
    items = []
    for item in a.items:
        prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        items.append(schemas.AdjustmentItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=prod.name if prod else "",
            sku=prod.sku if prod else "",
            system_quantity=item.system_quantity,
            physical_quantity=item.physical_quantity,
            delta=item.delta
        ))

    wh = db.query(models.Warehouse).filter(models.Warehouse.id == a.warehouse_id).first()
    loc = db.query(models.Location).filter(models.Location.id == a.location_id).first()
    creator = db.query(models.User).filter(models.User.id == a.created_by).first()

    return schemas.AdjustmentOut(
        id=a.id,
        adjustment_no=a.adjustment_no,
        warehouse_id=a.warehouse_id,
        warehouse_name=wh.name if wh else None,
        location_id=a.location_id,
        location_name=loc.name if loc else None,
        status=a.status,
        reason=a.reason,
        notes=a.notes,
        created_by_name=creator.name if creator else "",
        created_at=a.created_at,
        items=items
    )

@router.get("", response_model=List[schemas.AdjustmentOut])
def list_adjustments(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.InventoryAdjustment)
    if status:
        query = query.filter(models.InventoryAdjustment.status == status)
    adjustments = query.order_by(models.InventoryAdjustment.created_at.desc()).all()
    return [_format_adjustment(a, db) for a in adjustments]

@router.post("", response_model=schemas.AdjustmentOut, status_code=201)
def create_adjustment(
    payload: schemas.AdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not payload.reason:
        raise HTTPException(status_code=400, detail="Adjustment reason is mandatory")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Adjustment must contain at least one product row")

    adj_no = payload.adjustment_no
    if not adj_no:
        count = db.query(models.InventoryAdjustment).count() + 1
        adj_no = f"ADJ-{datetime.utcnow().strftime('%Y%m%d')}-{count:04d}"

    existing = db.query(models.InventoryAdjustment).filter(models.InventoryAdjustment.adjustment_no == adj_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Adjustment number '{adj_no}' already exists")

    adj = models.InventoryAdjustment(
        adjustment_no=adj_no,
        warehouse_id=payload.warehouse_id,
        location_id=payload.location_id,
        status="DRAFT",
        reason=payload.reason,
        notes=payload.notes,
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(adj)
    db.flush()

    for item in payload.items:
        bal = db.query(models.InventoryBalance).filter(
            models.InventoryBalance.product_id == item.product_id,
            models.InventoryBalance.location_id == payload.location_id
        ).first()
        sys_qty = bal.quantity if bal else 0.0
        delta = item.physical_quantity - sys_qty

        a_item = models.AdjustmentItem(
            adjustment_id=adj.id,
            product_id=item.product_id,
            system_quantity=sys_qty,
            physical_quantity=item.physical_quantity,
            delta=delta
        )
        db.add(a_item)

    db.commit()
    db.refresh(adj)
    return _format_adjustment(adj, db)

@router.get("/{adjustment_id}", response_model=schemas.AdjustmentOut)
def get_adjustment(
    adjustment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    adj = db.query(models.InventoryAdjustment).filter(models.InventoryAdjustment.id == adjustment_id).first()
    if not adj:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    return _format_adjustment(adj, db)

@router.post("/{adjustment_id}/post", response_model=schemas.AdjustmentOut)
def post_adjustment(
    adjustment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    posted_adj = InventoryService.post_adjustment(db, adjustment_id, current_user.id)
    return _format_adjustment(posted_adj, db)
