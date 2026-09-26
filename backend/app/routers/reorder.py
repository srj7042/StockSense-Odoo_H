from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/reorder", tags=["Reorder Rules"])

@router.get("/rules", response_model=List[schemas.ReorderRuleOut])
def list_reorder_rules(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Fetch configured rules or dynamically compute for low/out-of-stock products
    products = db.query(models.Product).filter(models.Product.active == True).all()
    results = []

    for p in products:
        balances = db.query(models.InventoryBalance).filter(models.InventoryBalance.product_id == p.id).all()
        locations = db.query(models.Location).filter(models.Location.active == True).all()

        for loc in locations:
            bal = next((b for b in balances if b.location_id == loc.id), None)
            avail = bal.quantity if bal else 0.0

            if avail <= p.reorder_point:
                rule = db.query(models.ReorderRule).filter(
                    models.ReorderRule.product_id == p.id,
                    models.ReorderRule.location_id == loc.id
                ).first()

                reorder_pt = rule.reorder_point if rule else p.reorder_point
                target_stk = rule.target_stock if rule else p.target_stock
                sup = db.query(models.Supplier).filter(models.Supplier.id == rule.preferred_supplier_id).first() if rule and rule.preferred_supplier_id else None

                suggested = max(0.0, target_stk - avail)

                results.append(schemas.ReorderRuleOut(
                    id=rule.id if rule else p.id * 1000 + loc.id,
                    product_id=p.id,
                    product_name=p.name,
                    sku=p.sku,
                    location_id=loc.id,
                    location_name=loc.name,
                    reorder_point=reorder_pt,
                    target_stock=target_stk,
                    available_stock=avail,
                    suggested_order_quantity=suggested,
                    preferred_supplier_name=sup.name if sup else "Default Supplier",
                    active=rule.active if rule else True
                ))

    return results

@router.post("/rules", response_model=schemas.ReorderRuleOut, status_code=201)
def create_or_update_reorder_rule(
    payload: schemas.ReorderRuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rule = db.query(models.ReorderRule).filter(
        models.ReorderRule.product_id == payload.product_id,
        models.ReorderRule.location_id == payload.location_id
    ).first()

    if not rule:
        rule = models.ReorderRule(**payload.model_dump())
        db.add(rule)
    else:
        rule.reorder_point = payload.reorder_point
        rule.target_stock = payload.target_stock
        rule.preferred_supplier_id = payload.preferred_supplier_id
        rule.active = payload.active

    db.commit()
    db.refresh(rule)

    prod = db.query(models.Product).filter(models.Product.id == rule.product_id).first()
    loc = db.query(models.Location).filter(models.Location.id == rule.location_id).first()
    bal = db.query(models.InventoryBalance).filter(
        models.InventoryBalance.product_id == rule.product_id,
        models.InventoryBalance.location_id == rule.location_id
    ).first()
    avail = bal.quantity if bal else 0.0
    sup = db.query(models.Supplier).filter(models.Supplier.id == rule.preferred_supplier_id).first() if rule.preferred_supplier_id else None

    return schemas.ReorderRuleOut(
        id=rule.id,
        product_id=rule.product_id,
        product_name=prod.name if prod else "",
        sku=prod.sku if prod else "",
        location_id=rule.location_id,
        location_name=loc.name if loc else "",
        reorder_point=rule.reorder_point,
        target_stock=rule.target_stock,
        available_stock=avail,
        suggested_order_quantity=max(0.0, rule.target_stock - avail),
        preferred_supplier_name=sup.name if sup else "Default Supplier",
        active=rule.active
    )
