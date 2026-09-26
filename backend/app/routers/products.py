from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[schemas.ProductOut])
def list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    stock_status: Optional[str] = None, # OK | LOW | OUT_OF_STOCK
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Product)
    if active_only:
        query = query.filter(models.Product.active == True)
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Product.name.ilike(search_pattern)) | 
            (models.Product.sku.ilike(search_pattern))
        )

    products = query.order_by(models.Product.created_at.desc()).all()
    results = []

    for prod in products:
        # Calculate stock by location
        balances = db.query(models.InventoryBalance).filter(models.InventoryBalance.product_id == prod.id).all()
        total_stock = sum(b.quantity for b in balances)

        loc_stocks = []
        for b in balances:
            loc = db.query(models.Location).filter(models.Location.id == b.location_id).first()
            if loc:
                status_str = "OK"
                if b.quantity == 0:
                    status_str = "OUT_OF_STOCK"
                elif b.quantity <= prod.reorder_point:
                    status_str = "LOW"
                loc_stocks.append(schemas.LocationStockOut(
                    warehouse_id=loc.warehouse_id,
                    warehouse_name=loc.warehouse.name if loc.warehouse else "",
                    location_id=loc.id,
                    location_name=loc.name,
                    quantity=b.quantity,
                    reorder_status=status_str
                ))

        # Filter by stock status if requested
        overall_status = "OK"
        if total_stock == 0:
            overall_status = "OUT_OF_STOCK"
        elif total_stock <= prod.reorder_point:
            overall_status = "LOW"

        if stock_status and stock_status != overall_status:
            continue

        cat = db.query(models.Category).filter(models.Category.id == prod.category_id).first()
        prod_out = schemas.ProductOut(
            id=prod.id,
            sku=prod.sku,
            name=prod.name,
            category_id=prod.category_id,
            category_name=cat.name if cat else "",
            unit=prod.unit,
            reorder_point=prod.reorder_point,
            target_stock=prod.target_stock,
            total_stock=total_stock,
            active=prod.active,
            created_at=prod.created_at,
            stock_by_location=loc_stocks
        )
        results.append(prod_out)

    return results

@router.post("", response_model=schemas.ProductOut, status_code=201)
def create_product(
    payload: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Product).filter(models.Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"SKU '{payload.sku}' already exists.")

    category = db.query(models.Category).filter(models.Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid Category ID.")

    prod = models.Product(
        sku=payload.sku,
        name=payload.name,
        category_id=payload.category_id,
        unit=payload.unit,
        reorder_point=payload.reorder_point,
        target_stock=payload.target_stock,
        active=payload.active,
        created_at=datetime.utcnow()
    )
    db.add(prod)
    db.flush()

    # Process optional opening stock
    if payload.opening_stock and payload.opening_stock > 0:
        if not payload.opening_location_id:
            raise HTTPException(status_code=400, detail="Opening location is required when setting opening stock.")
        loc = db.query(models.Location).filter(models.Location.id == payload.opening_location_id).first()
        if not loc:
            raise HTTPException(status_code=400, detail="Invalid opening location ID.")

        bal = InventoryService.get_or_create_balance(db, prod.id, loc.id)
        bal.quantity += payload.opening_stock
        bal.updated_at = datetime.utcnow()

        movement = models.StockMovement(
            reference_no=f"INIT-{prod.sku}",
            movement_type="INITIAL_STOCK",
            product_id=prod.id,
            destination_location_id=loc.id,
            quantity_in=payload.opening_stock,
            quantity_out=0.0,
            balance_after=bal.quantity,
            reason="Opening Stock during Product Creation",
            created_by=current_user.id,
            created_at=datetime.utcnow()
        )
        db.add(movement)

    db.commit()
    db.refresh(prod)

    # Return created product
    balances = db.query(models.InventoryBalance).filter(models.InventoryBalance.product_id == prod.id).all()
    total_stock = sum(b.quantity for b in balances)
    loc_stocks = [
        schemas.LocationStockOut(
            warehouse_id=b.location.warehouse_id if b.location else 0,
            warehouse_name=b.location.warehouse.name if b.location and b.location.warehouse else "",
            location_id=b.location_id,
            location_name=b.location.name if b.location else "",
            quantity=b.quantity,
            reorder_status="OK" if b.quantity > prod.reorder_point else ("OUT_OF_STOCK" if b.quantity == 0 else "LOW")
        ) for b in balances
    ]

    return schemas.ProductOut(
        id=prod.id,
        sku=prod.sku,
        name=prod.name,
        category_id=prod.category_id,
        category_name=category.name,
        unit=prod.unit,
        reorder_point=prod.reorder_point,
        target_stock=prod.target_stock,
        total_stock=total_stock,
        active=prod.active,
        created_at=prod.created_at,
        stock_by_location=loc_stocks
    )

@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    balances = db.query(models.InventoryBalance).filter(models.InventoryBalance.product_id == prod.id).all()
    total_stock = sum(b.quantity for b in balances)
    loc_stocks = [
        schemas.LocationStockOut(
            warehouse_id=b.location.warehouse_id if b.location else 0,
            warehouse_name=b.location.warehouse.name if b.location and b.location.warehouse else "",
            location_id=b.location_id,
            location_name=b.location.name if b.location else "",
            quantity=b.quantity,
            reorder_status="OK" if b.quantity > prod.reorder_point else ("OUT_OF_STOCK" if b.quantity == 0 else "LOW")
        ) for b in balances
    ]
    cat = db.query(models.Category).filter(models.Category.id == prod.category_id).first()

    return schemas.ProductOut(
        id=prod.id,
        sku=prod.sku,
        name=prod.name,
        category_id=prod.category_id,
        category_name=cat.name if cat else "",
        unit=prod.unit,
        reorder_point=prod.reorder_point,
        target_stock=prod.target_stock,
        total_stock=total_stock,
        active=prod.active,
        created_at=prod.created_at,
        stock_by_location=loc_stocks
    )

@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.sku and payload.sku != prod.sku:
        existing = db.query(models.Product).filter(models.Product.sku == payload.sku).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"SKU '{payload.sku}' is already taken.")
        prod.sku = payload.sku

    if payload.name:
        prod.name = payload.name
    if payload.category_id:
        prod.category_id = payload.category_id
    if payload.unit:
        prod.unit = payload.unit
    if payload.reorder_point is not None:
        prod.reorder_point = payload.reorder_point
    if payload.target_stock is not None:
        prod.target_stock = payload.target_stock
    if payload.active is not None:
        prod.active = payload.active

    db.commit()
    return get_product(product_id, db, current_user)
