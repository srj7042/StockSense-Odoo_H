from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/receipts", tags=["Receipts"])

def _format_receipt(r: models.Receipt, db: Session) -> schemas.ReceiptOut:
    items = []
    for item in r.items:
        prod = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        items.append(schemas.ReceiptItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=prod.name if prod else "",
            sku=prod.sku if prod else "",
            unit=prod.unit if prod else "",
            quantity=item.quantity
        ))

    sup = db.query(models.Supplier).filter(models.Supplier.id == r.supplier_id).first() if r.supplier_id else None
    loc = db.query(models.Location).filter(models.Location.id == r.destination_location_id).first()
    creator = db.query(models.User).filter(models.User.id == r.created_by).first()

    return schemas.ReceiptOut(
        id=r.id,
        receipt_no=r.receipt_no,
        supplier_id=r.supplier_id,
        supplier_name=sup.name if sup else None,
        destination_location_id=r.destination_location_id,
        destination_location_name=loc.name if loc else None,
        status=r.status,
        notes=r.notes,
        received_at=r.received_at,
        created_by_name=creator.name if creator else "",
        created_at=r.created_at,
        items=items
    )

@router.get("", response_model=List[schemas.ReceiptOut])
def list_receipts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Receipt)
    if status:
        query = query.filter(models.Receipt.status == status)
    receipts = query.order_by(models.Receipt.created_at.desc()).all()
    return [_format_receipt(r, db) for r in receipts]

@router.post("", response_model=schemas.ReceiptOut, status_code=201)
def create_receipt(
    payload: schemas.ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Receipt must contain at least one product row")

    receipt_no = payload.receipt_no
    if not receipt_no:
        count = db.query(models.Receipt).count() + 1
        receipt_no = f"REC-{datetime.utcnow().strftime('%Y%m%d')}-{count:04d}"

    existing = db.query(models.Receipt).filter(models.Receipt.receipt_no == receipt_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Receipt number '{receipt_no}' already exists")

    receipt = models.Receipt(
        receipt_no=receipt_no,
        supplier_id=payload.supplier_id,
        destination_location_id=payload.destination_location_id,
        status="DRAFT",
        notes=payload.notes,
        received_at=datetime.utcnow(),
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(receipt)
    db.flush()

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Item quantity must be > 0")
        r_item = models.ReceiptItem(
            receipt_id=receipt.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(r_item)

    db.commit()
    db.refresh(receipt)
    return _format_receipt(receipt, db)

@router.get("/{receipt_id}", response_model=schemas.ReceiptOut)
def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return _format_receipt(receipt, db)

@router.post("/{receipt_id}/post", response_model=schemas.ReceiptOut)
def post_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    posted_receipt = InventoryService.post_receipt(db, receipt_id, current_user.id)
    return _format_receipt(posted_receipt, db)
