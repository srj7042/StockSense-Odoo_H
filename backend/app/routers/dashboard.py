from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timedelta

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/kpis", response_model=schemas.DashboardKPIs)
def get_kpis(
    warehouse_id: Optional[int] = None,
    location_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prod_query = db.query(models.Product).filter(models.Product.active == True)
    if category_id:
        prod_query = prod_query.filter(models.Product.category_id == category_id)
    products = prod_query.all()
    total_products = len(products)

    # Balance calculations filtered by warehouse/location
    bal_query = db.query(models.InventoryBalance)
    if location_id:
        bal_query = bal_query.filter(models.InventoryBalance.location_id == location_id)
    elif warehouse_id:
        loc_ids = [l.id for l in db.query(models.Location).filter(models.Location.warehouse_id == warehouse_id).all()]
        bal_query = bal_query.filter(models.InventoryBalance.location_id.in_(loc_ids))
    if category_id:
        prod_ids = [p.id for p in products]
        bal_query = bal_query.filter(models.InventoryBalance.product_id.in_(prod_ids))

    all_balances = bal_query.all()
    total_on_hand = sum(b.quantity for b in all_balances)

    # Calculate low stock & out of stock
    low_stock = 0
    out_of_stock = 0

    for p in products:
        p_bals = [b for b in all_balances if b.product_id == p.id]
        p_tot = sum(b.quantity for b in p_bals)
        if p_tot == 0:
            out_of_stock += 1
        elif p_tot <= p.reorder_point:
            low_stock += 1

    pending_receipts = db.query(models.Receipt).filter(models.Receipt.status == "DRAFT").count()
    pending_deliveries = db.query(models.DeliveryOrder).filter(models.DeliveryOrder.status == "DRAFT").count()
    in_progress_transfers = db.query(models.StockTransfer).filter(models.StockTransfer.status == "DRAFT").count()
    recent_adjustments = db.query(models.InventoryAdjustment).filter(
        models.InventoryAdjustment.created_at >= datetime.utcnow() - timedelta(days=30)
    ).count()

    return schemas.DashboardKPIs(
        total_products=total_products,
        total_on_hand_units=total_on_hand,
        low_stock_count=low_stock,
        out_of_stock_count=out_of_stock,
        pending_receipts_count=pending_receipts,
        pending_deliveries_count=pending_deliveries,
        in_progress_transfers_count=in_progress_transfers,
        recent_adjustments_count=recent_adjustments
    )

@router.get("/charts")
def get_charts(
    days: int = Query(7, ge=1, le=90),
    warehouse_id: Optional[int] = None,
    location_id: Optional[int] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Stock by Warehouse
    warehouses = db.query(models.Warehouse).filter(models.Warehouse.active == True).all()
    stock_by_wh = []
    for wh in warehouses:
        loc_ids = [l.id for l in wh.locations]
        bal_query = db.query(models.InventoryBalance).filter(models.InventoryBalance.location_id.in_(loc_ids))
        if category_id:
            cat_prod_ids = [p.id for p in db.query(models.Product).filter(models.Product.category_id == category_id).all()]
            bal_query = bal_query.filter(models.InventoryBalance.product_id.in_(cat_prod_ids))
        tot = sum(b.quantity for b in bal_query.all())
        stock_by_wh.append({"warehouse_name": wh.name, "total_stock": tot})

    # 2. Inbound vs Outbound Movement Trend
    start_date = datetime.utcnow().date() - timedelta(days=days - 1)
    trend_data = []

    m_query = db.query(models.StockMovement).filter(
        models.StockMovement.created_at >= datetime.combine(start_date, datetime.min.time())
    )
    if category_id:
        cat_prod_ids = [p.id for p in db.query(models.Product).filter(models.Product.category_id == category_id).all()]
        m_query = m_query.filter(models.StockMovement.product_id.in_(cat_prod_ids))

    movements = m_query.all()

    for i in range(days):
        day_date = start_date + timedelta(days=i)
        day_str = day_date.strftime("%b %d")
        
        in_qty = sum(
            m.quantity_in for m in movements 
            if m.created_at.date() == day_date
        )
        out_qty = sum(
            m.quantity_out for m in movements 
            if m.created_at.date() == day_date
        )
        trend_data.append({
            "date": day_str,
            "inbound": in_qty,
            "outbound": out_qty
        })

    # 3. Low Stock Risk
    products = db.query(models.Product).filter(models.Product.active == True).all()
    low_stock_risk = []
    for p in products:
        bals = db.query(models.InventoryBalance).filter(models.InventoryBalance.product_id == p.id).all()
        tot = sum(b.quantity for b in bals)
        if tot <= p.reorder_point:
            low_stock_risk.append({
                "product_name": p.name,
                "sku": p.sku,
                "current_stock": tot,
                "reorder_point": p.reorder_point
            })

    return {
        "stock_by_warehouse": stock_by_wh,
        "movement_trend": trend_data,
        "low_stock_risk": low_stock_risk[:10]  # top 10
    }
