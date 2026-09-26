from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[schemas.AlertOut])
def list_alerts(
    status: Optional[str] = "ACTIVE",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Alert)
    if status:
        query = query.filter(models.Alert.status == status)
    alerts = query.order_by(models.Alert.created_at.desc()).all()

    results = []
    for a in alerts:
        prod = db.query(models.Product).filter(models.Product.id == a.product_id).first()
        loc = db.query(models.Location).filter(models.Location.id == a.location_id).first() if a.location_id else None

        # Calculate current quantity
        current_qty = 0.0
        if a.location_id:
            bal = db.query(models.InventoryBalance).filter(
                models.InventoryBalance.product_id == a.product_id,
                models.InventoryBalance.location_id == a.location_id
            ).first()
            current_qty = bal.quantity if bal else 0.0
        else:
            bals = db.query(models.InventoryBalance).filter(models.InventoryBalance.product_id == a.product_id).all()
            current_qty = sum(b.quantity for b in bals)

        results.append(schemas.AlertOut(
            id=a.id,
            product_id=a.product_id,
            product_name=prod.name if prod else "",
            sku=prod.sku if prod else "",
            location_id=a.location_id,
            location_name=loc.name if loc else "All Locations",
            alert_type=a.alert_type,
            severity=a.severity,
            message=a.message,
            current_quantity=current_qty,
            threshold=prod.reorder_point if prod else 0.0,
            status=a.status,
            created_at=a.created_at
        ))
    return results

@router.put("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "RESOLVED"
    db.commit()
    return {"message": "Alert resolved"}
