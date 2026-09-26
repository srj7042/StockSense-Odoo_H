from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/search", tags=["Global Search"])

@router.get("", response_model=List[schemas.GlobalSearchResult])
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = []
    pattern = f"%{q}%"

    # 1. Products
    products = db.query(models.Product).filter(
        (models.Product.name.ilike(pattern)) | (models.Product.sku.ilike(pattern))
    ).limit(5).all()

    for p in products:
        results.append(schemas.GlobalSearchResult(
            type="Product",
            title=p.name,
            subtitle=f"SKU: {p.sku} | Unit: {p.unit}",
            id=str(p.id),
            link=f"/products/{p.id}"
        ))

    # 2. Receipts
    receipts = db.query(models.Receipt).filter(models.Receipt.receipt_no.ilike(pattern)).limit(5).all()
    for r in receipts:
        results.append(schemas.GlobalSearchResult(
            type="Receipt",
            title=r.receipt_no,
            subtitle=f"Status: {r.status} | Dest: {r.destination_location.name if r.destination_location else ''}",
            id=str(r.id),
            link=f"/operations/receipts?id={r.id}"
        ))

    # 3. Deliveries
    deliveries = db.query(models.DeliveryOrder).filter(models.DeliveryOrder.delivery_no.ilike(pattern)).limit(5).all()
    for d in deliveries:
        results.append(schemas.GlobalSearchResult(
            type="Delivery",
            title=d.delivery_no,
            subtitle=f"Status: {d.status} | Ref: {d.customer_ref or ''}",
            id=str(d.id),
            link=f"/operations/deliveries?id={d.id}"
        ))

    # 4. Transfers
    transfers = db.query(models.StockTransfer).filter(models.StockTransfer.transfer_no.ilike(pattern)).limit(5).all()
    for t in transfers:
        results.append(schemas.GlobalSearchResult(
            type="Transfer",
            title=t.transfer_no,
            subtitle=f"Status: {t.status} | From {t.source_location.name if t.source_location else ''} to {t.destination_location.name if t.destination_location else ''}",
            id=str(t.id),
            link=f"/operations/transfers?id={t.id}"
        ))

    # 5. Adjustments
    adjustments = db.query(models.InventoryAdjustment).filter(models.InventoryAdjustment.adjustment_no.ilike(pattern)).limit(5).all()
    for a in adjustments:
        results.append(schemas.GlobalSearchResult(
            type="Adjustment",
            title=a.adjustment_no,
            subtitle=f"Reason: {a.reason} | Status: {a.status}",
            id=str(a.id),
            link=f"/operations/adjustments?id={a.id}"
        ))

    return results
