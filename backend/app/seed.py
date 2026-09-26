from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password

def seed_database(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(models.User).filter(models.User.email == "manager@stocksense.com").first():
        print("Database already seeded.")
        return

    print("Seeding database with realistic inventory data...")

    # 1. Users
    manager = models.User(
        name="Sarah Jenkins",
        email="manager@stocksense.com",
        password_hash=hash_password("password123"),
        role="MANAGER",
        phone="+1 555-0192",
        active=True
    )
    staff = models.User(
        name="Alex Rivera",
        email="staff@stocksense.com",
        password_hash=hash_password("password123"),
        role="STAFF",
        phone="+1 555-0194",
        active=True
    )
    db.add(manager)
    db.add(staff)
    db.flush()

    # 2. Warehouses & Locations
    wh1 = models.Warehouse(
        name="Central Logistics Center",
        code="WH-MAIN",
        address="100 Industrial Parkway, Zone B, Metro City",
        active=True
    )
    wh2 = models.Warehouse(
        name="Northside Retail Depot",
        code="WH-NORTH",
        address="450 Commerce Blvd, Suite 12, Northside",
        active=True
    )
    db.add(wh1)
    db.add(wh2)
    db.flush()

    loc1 = models.Location(warehouse_id=wh1.id, name="Aisle A - Bulk Storage", code="WH-MAIN-A1", active=True)
    loc2 = models.Location(warehouse_id=wh1.id, name="Rack B2 - High Density", code="WH-MAIN-B2", active=True)
    loc3 = models.Location(warehouse_id=wh2.id, name="Store Floor Shelf 1", code="WH-NORTH-S1", active=True)
    loc4 = models.Location(warehouse_id=wh2.id, name="Backroom Storage R1", code="WH-NORTH-R1", active=True)
    db.add_all([loc1, loc2, loc3, loc4])
    db.flush()

    # 3. Categories
    cat_elec = models.Category(name="Electronics", description="Consumer electronics and components", active=True)
    cat_hard = models.Category(name="Hardware & Tools", description="Hand tools, power tools, and fasteners", active=True)
    cat_pack = models.Category(name="Packaging & Supplies", description="Shipping boxes, tape, and protective wrap", active=True)
    cat_raw = models.Category(name="Raw Materials", description="Industrial raw sheets, tubes, and stock", active=True)
    cat_off = models.Category(name="Office Equipment", description="Office supplies and computing peripherals", active=True)
    db.add_all([cat_elec, cat_hard, cat_pack, cat_raw, cat_off])
    db.flush()

    # 4. Suppliers
    sup1 = models.Supplier(name="Global Electronics Supply Co", contact="orders@globalelec.com", active=True)
    sup2 = models.Supplier(name="Apex Hardware Distributing", contact="sales@apexhardware.com", active=True)
    sup3 = models.Supplier(name="PacPro Container Corp", contact="support@pacpro.com", active=True)
    db.add_all([sup1, sup2, sup3])
    db.flush()

    # 5. Products
    products_data = [
        {"sku": "SKU-ELEC-001", "name": "Wireless Ergonomic Mouse", "cat": cat_elec.id, "unit": "pcs", "reorder": 15, "target": 60},
        {"sku": "SKU-ELEC-002", "name": "Mechanical Keyboard RGB", "cat": cat_elec.id, "unit": "pcs", "reorder": 10, "target": 40},
        {"sku": "SKU-ELEC-003", "name": "USB-C Multi-Port Hub", "cat": cat_elec.id, "unit": "pcs", "reorder": 20, "target": 80},
        {"sku": "SKU-HARD-101", "name": "Heavy Duty Cordless Drill 20V", "cat": cat_hard.id, "unit": "pcs", "reorder": 8, "target": 25},
        {"sku": "SKU-HARD-102", "name": "Precision Screwdriver Set 32-in-1", "cat": cat_hard.id, "unit": "pcs", "reorder": 12, "target": 50},
        {"sku": "SKU-HARD-103", "name": "Stainless Steel M8 Screws (100 pack)", "cat": cat_hard.id, "unit": "box", "reorder": 25, "target": 100},
        {"sku": "SKU-PACK-201", "name": "Corrugated Shipping Box 12x12x12", "cat": cat_pack.id, "unit": "bundle", "reorder": 50, "target": 200},
        {"sku": "SKU-PACK-202", "name": "Heavy Duty Packing Tape 6-Rolls", "cat": cat_pack.id, "unit": "pack", "reorder": 30, "target": 120},
        {"sku": "SKU-RAW-301", "name": "Aluminum Alloy Sheet 4x8 ft 1/8in", "cat": cat_raw.id, "unit": "sheet", "reorder": 5, "target": 20},
        {"sku": "SKU-RAW-302", "name": "Industrial Polycarbonate Rod 2in", "cat": cat_raw.id, "unit": "meter", "reorder": 10, "target": 40},
        {"sku": "SKU-OFF-401", "name": "Ergonomic Mesh Task Chair", "cat": cat_off.id, "unit": "pcs", "reorder": 5, "target": 15},
        {"sku": "SKU-OFF-402", "name": "Dual Monitor Stand Gas Spring", "cat": cat_off.id, "unit": "pcs", "reorder": 8, "target": 30}
    ]

    product_objs = []
    for p in products_data:
        prod = models.Product(
            sku=p["sku"],
            name=p["name"],
            category_id=p["cat"],
            unit=p["unit"],
            reorder_point=p["reorder"],
            target_stock=p["target"],
            active=True
        )
        db.add(prod)
        product_objs.append(prod)
    db.flush()

    # 6. Initial Balances & Stock Movements
    for i, prod in enumerate(product_objs):
        # Place stock in loc1 (Central Bulk) and loc3 (Northside Shelf)
        qty1 = 45.0 if i % 2 == 0 else 8.0 # some low stock items
        qty3 = 15.0 if i % 3 == 0 else 0.0

        if qty1 > 0:
            b1 = models.InventoryBalance(product_id=prod.id, location_id=loc1.id, quantity=qty1)
            db.add(b1)
            m1 = models.StockMovement(
                reference_no="INIT-BAL-001",
                movement_type="INITIAL_STOCK",
                product_id=prod.id,
                destination_location_id=loc1.id,
                quantity_in=qty1,
                quantity_out=0.0,
                balance_after=qty1,
                reason="System Initialization Opening Balance",
                created_by=manager.id,
                created_at=datetime.utcnow() - timedelta(days=10)
            )
            db.add(m1)

        if qty3 > 0:
            b3 = models.InventoryBalance(product_id=prod.id, location_id=loc3.id, quantity=qty3)
            db.add(b3)
            m3 = models.StockMovement(
                reference_no="INIT-BAL-002",
                movement_type="INITIAL_STOCK",
                product_id=prod.id,
                destination_location_id=loc3.id,
                quantity_in=qty3,
                quantity_out=0.0,
                balance_after=qty3,
                reason="System Initialization Opening Balance",
                created_by=manager.id,
                created_at=datetime.utcnow() - timedelta(days=10)
            )
            db.add(m3)

    db.flush()

    # 7. Sample Posted Receipt
    rec = models.Receipt(
        receipt_no="REC-2026-0001",
        supplier_id=sup1.id,
        destination_location_id=loc1.id,
        status="POSTED",
        notes="Q3 Electronics restocking order",
        received_at=datetime.utcnow() - timedelta(days=3),
        created_by=manager.id,
        posted_by=manager.id,
        posted_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add(rec)
    db.flush()

    item_rec1 = models.ReceiptItem(receipt_id=rec.id, product_id=product_objs[0].id, quantity=50.0)
    item_rec2 = models.ReceiptItem(receipt_id=rec.id, product_id=product_objs[1].id, quantity=20.0)
    db.add_all([item_rec1, item_rec2])

    # 8. Sample Posted Delivery Order
    deliv = models.DeliveryOrder(
        delivery_no="DEL-2026-0001",
        source_location_id=loc1.id,
        customer_ref="Acme Tech Solutions (SO-9921)",
        status="POSTED",
        notes="Standard express delivery",
        delivered_at=datetime.utcnow() - timedelta(days=2),
        created_by=staff.id,
        posted_by=manager.id,
        posted_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(deliv)
    db.flush()

    item_del1 = models.DeliveryItem(delivery_id=deliv.id, product_id=product_objs[0].id, quantity=4.0)
    db.add(item_del1)

    # 9. Sample Draft Transfer
    trf = models.StockTransfer(
        transfer_no="TRF-2026-0001",
        source_location_id=loc1.id,
        destination_location_id=loc3.id,
        status="DRAFT",
        notes="Replenishing Northside store front",
        created_by=staff.id
    )
    db.add(trf)
    db.flush()
    item_trf = models.TransferItem(transfer_id=trf.id, product_id=product_objs[2].id, quantity=10.0)
    db.add(item_trf)

    # 10. Sample Alerts
    alert1 = models.Alert(
        product_id=product_objs[3].id,
        location_id=loc1.id,
        alert_type="LOW_STOCK",
        severity="HIGH",
        message=f"Product '{product_objs[3].name}' stock (8.0 pcs) is below reorder point (10.0 pcs).",
        status="ACTIVE"
    )
    db.add(alert1)

    db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
