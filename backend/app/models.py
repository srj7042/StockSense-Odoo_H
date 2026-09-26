from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="MANAGER", nullable=False) # MANAGER | STAFF
    phone = Column(String(50), nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class OTPToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    unit = Column(String(20), default="pcs", nullable=False)
    reorder_point = Column(Float, default=10.0, nullable=False)
    target_stock = Column(Float, default=50.0, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    category = relationship("Category", back_populates="products")
    balances = relationship("InventoryBalance", back_populates="product", cascade="all, delete-orphan")
    movements = relationship("StockMovement", back_populates="product")

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    address = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    locations = relationship("Location", back_populates="warehouse", cascade="all, delete-orphan")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    parent_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    active = Column(Boolean, default=True, nullable=False)

    warehouse = relationship("Warehouse", back_populates="locations")
    parent = relationship("Location", remote_side=[id], backref="sub_locations")
    balances = relationship("InventoryBalance", back_populates="location")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    contact = Column(String(100), nullable=True)
    active = Column(Boolean, default=True, nullable=False)

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(50), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    destination_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    status = Column(String(20), default="DRAFT", nullable=False) # DRAFT | POSTED | CANCELLED
    notes = Column(Text, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    posted_at = Column(DateTime, nullable=True)

    destination_location = relationship("Location")
    supplier = relationship("Supplier")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("ReceiptItem", back_populates="receipt", cascade="all, delete-orphan")

class ReceiptItem(Base):
    __tablename__ = "receipt_items"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)

    receipt = relationship("Receipt", back_populates="items")
    product = relationship("Product")

class DeliveryOrder(Base):
    __tablename__ = "delivery_orders"

    id = Column(Integer, primary_key=True, index=True)
    delivery_no = Column(String(50), unique=True, index=True, nullable=False)
    source_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    customer_ref = Column(String(150), nullable=True)
    status = Column(String(20), default="DRAFT", nullable=False) # DRAFT | POSTED | CANCELLED
    notes = Column(Text, nullable=True)
    delivered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    posted_at = Column(DateTime, nullable=True)

    source_location = relationship("Location")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("DeliveryItem", back_populates="delivery_order", cascade="all, delete-orphan")

class DeliveryItem(Base):
    __tablename__ = "delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("delivery_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)

    delivery_order = relationship("DeliveryOrder", back_populates="items")
    product = relationship("Product")

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, index=True)
    transfer_no = Column(String(50), unique=True, index=True, nullable=False)
    source_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    destination_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    status = Column(String(20), default="DRAFT", nullable=False) # DRAFT | POSTED | CANCELLED
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    posted_at = Column(DateTime, nullable=True)

    source_location = relationship("Location", foreign_keys=[source_location_id])
    destination_location = relationship("Location", foreign_keys=[destination_location_id])
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("TransferItem", back_populates="transfer", cascade="all, delete-orphan")

class TransferItem(Base):
    __tablename__ = "transfer_items"

    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("stock_transfers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)

    transfer = relationship("StockTransfer", back_populates="items")
    product = relationship("Product")

class InventoryAdjustment(Base):
    __tablename__ = "inventory_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    adjustment_no = Column(String(50), unique=True, index=True, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    status = Column(String(20), default="DRAFT", nullable=False) # DRAFT | POSTED | CANCELLED
    reason = Column(String(100), nullable=False) # Damaged | Lost | Count Correction | Expired | Other
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    posted_at = Column(DateTime, nullable=True)

    warehouse = relationship("Warehouse")
    location = relationship("Location")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("AdjustmentItem", back_populates="adjustment", cascade="all, delete-orphan")

class AdjustmentItem(Base):
    __tablename__ = "adjustment_items"

    id = Column(Integer, primary_key=True, index=True)
    adjustment_id = Column(Integer, ForeignKey("inventory_adjustments.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    system_quantity = Column(Float, nullable=False)
    physical_quantity = Column(Float, nullable=False)
    delta = Column(Float, nullable=False)

    adjustment = relationship("InventoryAdjustment", back_populates="items")
    product = relationship("Product")

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    reference_no = Column(String(50), index=True, nullable=False)
    movement_type = Column(String(30), index=True, nullable=False) 
    # RECEIPT_IN | DELIVERY_OUT | TRANSFER_OUT | TRANSFER_IN | ADJUSTMENT_IN | ADJUSTMENT_OUT | INITIAL_STOCK
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    source_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    destination_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    quantity_in = Column(Float, default=0.0, nullable=False)
    quantity_out = Column(Float, default=0.0, nullable=False)
    balance_after = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    product = relationship("Product", back_populates="movements")
    source_location = relationship("Location", foreign_keys=[source_location_id])
    destination_location = relationship("Location", foreign_keys=[destination_location_id])
    creator = relationship("User", foreign_keys=[created_by])

class InventoryBalance(Base):
    __tablename__ = "inventory_balances"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    quantity = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    product = relationship("Product", back_populates="balances")
    location = relationship("Location", back_populates="balances")

    __table_args__ = (
        UniqueConstraint("product_id", "location_id", name="uix_product_location"),
    )

class ReorderRule(Base):
    __tablename__ = "reorder_rules"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    reorder_point = Column(Float, nullable=False)
    target_stock = Column(Float, nullable=False)
    preferred_supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    active = Column(Boolean, default=True, nullable=False)

    product = relationship("Product")
    location = relationship("Location")
    preferred_supplier = relationship("Supplier")

    __table_args__ = (
        UniqueConstraint("product_id", "location_id", name="uix_reorder_product_location"),
    )

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    alert_type = Column(String(30), nullable=False) # LOW_STOCK | OUT_OF_STOCK | REORDER_REQUIRED | LARGE_ADJUSTMENT | REPEATED_ADJUSTMENT
    severity = Column(String(20), default="MEDIUM", nullable=False) # LOW | MEDIUM | HIGH | CRITICAL
    message = Column(Text, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False) # ACTIVE | RESOLVED | DISMISSED
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)

    product = relationship("Product")
    location = relationship("Location")
