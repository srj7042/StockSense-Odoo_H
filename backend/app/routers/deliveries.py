from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/deliveries", tags=["Deliveries"])

def _format_delivery(d: models.DeliveryOrder, db: Session) -> schemas.DeliveryOut:
    items = []
    for item in d.items:
        prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        bal = db.query(models.InventoryBalance).filter(
            models.InventoryBalance.product_id == item.product_id,
            models.InventoryBalance.location_id == d.source_location_id
        ).first()
        avail = bal.quantity if bal else 0.0

        items.append(schemas.DeliveryItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=prod.name if prod else "",
            sku=prod.sku if prod else "",
            unit=prod.unit if prod else "",
            available_stock=avail,
            quantity=item.quantity
        ))

    loc = db.query(models.Location).filter(models.Location.id == d.source_location_id).first()
    creator = db.query(models.User).filter(models.User.id == d.created_by).first()

    return schemas.DeliveryOut(
        id=d.id,
        delivery_no=d.delivery_no,
        source_location_id=d.source_location_id,
        source_location_name=loc.name if loc else None,
        customer_ref=d.customer_ref,
        status=d.status,
        notes=d.notes,
        delivered_at=d.delivered_at,
        created_by_name=creator.name if creator else "",
        created_at=d.created_at,
        items=items
    )

@router.get("", response_model=List[schemas.DeliveryOut])
def list_deliveries(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.DeliveryOrder)
    if status:
        query = query.filter(models.DeliveryOrder.status == status)
    deliveries = query.order_by(models.DeliveryOrder.created_at.desc()).all()
    return [_format_delivery(d, db) for d in deliveries]

@router.post("", response_model=schemas.DeliveryOut, status_code=201)
def create_delivery(
    payload: schemas.DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Delivery order must contain at least one product row")

    delivery_no = payload.delivery_no
    if not delivery_no:
        count = db.query(models.DeliveryOrder).count() + 1
        delivery_no = f"DEL-{datetime.utcnow().strftime('%Y%m%d')}-{count:04d}"

    existing = db.query(models.DeliveryOrder).filter(models.DeliveryOrder.delivery_no == delivery_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Delivery number '{delivery_no}' already exists")

    delivery = models.DeliveryOrder(
        delivery_no=delivery_no,
        source_location_id=payload.source_location_id,
        customer_ref=payload.customer_ref,
        status="DRAFT",
        notes=payload.notes,
        delivered_at=datetime.utcnow(),
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(delivery)
    db.flush()

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be > 0")
        d_item = models.DeliveryItem(
            delivery_id=delivery.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(d_item)

    db.commit()
    db.refresh(delivery)
    return _format_delivery(delivery, db)

@router.get("/{delivery_id}", response_model=schemas.DeliveryOut)
def get_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    delivery = db.query(models.DeliveryOrder).filter(models.DeliveryOrder.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery order not found")
    return _format_delivery(delivery, db)

@router.post("/{delivery_id}/post", response_model=schemas.DeliveryOut)
def post_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    posted_delivery = InventoryService.post_delivery(db, delivery_id, current_user.id)
    return _format_delivery(posted_delivery, db)
