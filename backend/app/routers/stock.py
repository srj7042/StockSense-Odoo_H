from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/stock", tags=["Stock Ledger & Balances"])

@router.get("/movements", response_model=List[schemas.StockMovementOut])
def list_stock_movements(
    product_id: Optional[int] = None,
    sku: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    location_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.StockMovement)

    if product_id:
        query = query.filter(models.StockMovement.product_id == product_id)
    if sku:
        prod = db.query(models.Product).filter(models.Product.sku == sku).first()
        if prod:
            query = query.filter(models.StockMovement.product_id == prod.id)
        else:
            return []
    if movement_type:
        query = query.filter(models.StockMovement.movement_type == movement_type)
    if user_id:
        query = query.filter(models.StockMovement.created_by == user_id)
    if location_id:
        query = query.filter(
            (models.StockMovement.source_location_id == location_id) |
            (models.StockMovement.destination_location_id == location_id)
        )
    elif warehouse_id:
        wh_loc_ids = [l.id for l in db.query(models.Location).filter(models.Location.warehouse_id == warehouse_id).all()]
        query = query.filter(
            (models.StockMovement.source_location_id.in_(wh_loc_ids)) |
            (models.StockMovement.destination_location_id.in_(wh_loc_ids))
        )

    movements = query.order_by(models.StockMovement.created_at.desc()).limit(200).all()
    results = []

    for m in movements:
        prod = db.query(models.Product).filter(models.Product.id == m.product_id).first()
        src_loc = db.query(models.Location).filter(models.Location.id == m.source_location_id).first() if m.source_location_id else None
        dst_loc = db.query(models.Location).filter(models.Location.id == m.destination_location_id).first() if m.destination_location_id else None
        user = db.query(models.User).filter(models.User.id == m.created_by).first()

        results.append(schemas.StockMovementOut(
            id=m.id,
            reference_no=m.reference_no,
            movement_type=m.movement_type,
            product_id=m.product_id,
            product_name=prod.name if prod else "",
            sku=prod.sku if prod else "",
            source_location_name=src_loc.name if src_loc else None,
            destination_location_name=dst_loc.name if dst_loc else None,
            quantity_in=m.quantity_in,
            quantity_out=m.quantity_out,
            balance_after=m.balance_after,
            reason=m.reason,
            created_by_name=user.name if user else "",
            created_at=m.created_at
        ))

    return results
