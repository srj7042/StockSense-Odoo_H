from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/transfers", tags=["Internal Transfers"])

def _format_transfer(t: models.StockTransfer, db: Session) -> schemas.TransferOut:
    items = []
    for item in t.items:
        prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        bal = db.query(models.InventoryBalance).filter(
            models.InventoryBalance.product_id == item.product_id,
            models.InventoryBalance.location_id == t.source_location_id
        ).first()
        avail = bal.quantity if bal else 0.0

        items.append(schemas.TransferItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=prod.name if prod else "",
            sku=prod.sku if prod else "",
            available_stock=avail,
            quantity=item.quantity
        ))

    src = db.query(models.Location).filter(models.Location.id == t.source_location_id).first()
    dst = db.query(models.Location).filter(models.Location.id == t.destination_location_id).first()
    creator = db.query(models.User).filter(models.User.id == t.created_by).first()

    return schemas.TransferOut(
        id=t.id,
        transfer_no=t.transfer_no,
        source_location_id=t.source_location_id,
        source_location_name=src.name if src else None,
        destination_location_id=t.destination_location_id,
        destination_location_name=dst.name if dst else None,
        status=t.status,
        notes=t.notes,
        created_by_name=creator.name if creator else "",
        created_at=t.created_at,
        items=items
    )

@router.get("", response_model=List[schemas.TransferOut])
def list_transfers(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.StockTransfer)
    if status:
        query = query.filter(models.StockTransfer.status == status)
    transfers = query.order_by(models.StockTransfer.created_at.desc()).all()
    return [_format_transfer(t, db) for t in transfers]

@router.post("", response_model=schemas.TransferOut, status_code=201)
def create_transfer(
    payload: schemas.TransferCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if payload.source_location_id == payload.destination_location_id:
        raise HTTPException(status_code=400, detail="Source and destination locations cannot be the same")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Transfer must contain at least one product row")

    transfer_no = payload.transfer_no
    if not transfer_no:
        count = db.query(models.StockTransfer).count() + 1
        transfer_no = f"TRF-{datetime.utcnow().strftime('%Y%m%d')}-{count:04d}"

    existing = db.query(models.StockTransfer).filter(models.StockTransfer.transfer_no == transfer_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Transfer number '{transfer_no}' already exists")

    transfer = models.StockTransfer(
        transfer_no=transfer_no,
        source_location_id=payload.source_location_id,
        destination_location_id=payload.destination_location_id,
        status="DRAFT",
        notes=payload.notes,
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(transfer)
    db.flush()

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be > 0")
        t_item = models.TransferItem(
            transfer_id=transfer.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(t_item)

    db.commit()
    db.refresh(transfer)
    return _format_transfer(transfer, db)

@router.get("/{transfer_id}", response_model=schemas.TransferOut)
def get_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    transfer = db.query(models.StockTransfer).filter(models.StockTransfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Stock transfer not found")
    return _format_transfer(transfer, db)

@router.post("/{transfer_id}/post", response_model=schemas.TransferOut)
def post_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    posted_transfer = InventoryService.post_transfer(db, transfer_id, current_user.id)
    return _format_transfer(posted_transfer, db)
