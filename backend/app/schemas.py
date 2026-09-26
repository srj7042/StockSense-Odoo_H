from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "MANAGER" # MANAGER or STAFF
    phone: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(..., min_length=6)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True

Token.model_rebuild()

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# --- Warehouse & Location Schemas ---
class WarehouseBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    active: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    active: Optional[bool] = None

class LocationBase(BaseModel):
    warehouse_id: int
    parent_location_id: Optional[int] = None
    name: str
    code: str
    active: bool = True

class LocationCreate(LocationBase):
    pass

class LocationOut(LocationBase):
    id: int
    warehouse_name: Optional[str] = None
    parent_name: Optional[str] = None

    class Config:
        from_attributes = True

class WarehouseOut(WarehouseBase):
    id: int
    locations: List[LocationOut] = []

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: int
    unit: str = "pcs"
    reorder_point: float = 10.0
    target_stock: float = 50.0
    opening_stock: Optional[float] = 0.0
    opening_location_id: Optional[int] = None
    active: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    unit: Optional[str] = None
    reorder_point: Optional[float] = None
    target_stock: Optional[float] = None
    active: Optional[bool] = None

class LocationStockOut(BaseModel):
    warehouse_id: int
    warehouse_name: str
    location_id: int
    location_name: str
    quantity: float
    reorder_status: str # OK | LOW | OUT_OF_STOCK

class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    category_id: int
    category_name: Optional[str] = None
    unit: str
    reorder_point: float
    target_stock: float
    total_stock: float = 0.0
    active: bool
    created_at: datetime
    stock_by_location: List[LocationStockOut] = []

    class Config:
        from_attributes = True

# --- Supplier Schemas ---
class SupplierBase(BaseModel):
    name: str
    contact: Optional[str] = None
    active: bool = True

class SupplierCreate(SupplierBase):
    pass

class SupplierOut(SupplierBase):
    id: int

    class Config:
        from_attributes = True

# --- Receipt Schemas ---
class ReceiptItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)

class ReceiptItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    unit: str
    quantity: float

    class Config:
        from_attributes = True

class ReceiptCreate(BaseModel):
    receipt_no: Optional[str] = None
    supplier_id: Optional[int] = None
    destination_location_id: int
    notes: Optional[str] = None
    items: List[ReceiptItemCreate]

class ReceiptOut(BaseModel):
    id: int
    receipt_no: str
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    destination_location_id: int
    destination_location_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    received_at: datetime
    created_by_name: Optional[str] = None
    created_at: datetime
    items: List[ReceiptItemOut] = []

    class Config:
        from_attributes = True

# --- Delivery Schemas ---
class DeliveryItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)

class DeliveryItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    unit: str
    available_stock: float = 0.0
    quantity: float

    class Config:
        from_attributes = True

class DeliveryCreate(BaseModel):
    delivery_no: Optional[str] = None
    source_location_id: int
    customer_ref: Optional[str] = None
    notes: Optional[str] = None
    items: List[DeliveryItemCreate]

class DeliveryOut(BaseModel):
    id: int
    delivery_no: str
    source_location_id: int
    source_location_name: Optional[str] = None
    customer_ref: Optional[str] = None
    status: str
    notes: Optional[str] = None
    delivered_at: datetime
    created_by_name: Optional[str] = None
    created_at: datetime
    items: List[DeliveryItemOut] = []

    class Config:
        from_attributes = True

# --- Transfer Schemas ---
class TransferItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)

class TransferItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    available_stock: float = 0.0
    quantity: float

    class Config:
        from_attributes = True

class TransferCreate(BaseModel):
    transfer_no: Optional[str] = None
    source_location_id: int
    destination_location_id: int
    notes: Optional[str] = None
    items: List[TransferItemCreate]

class TransferOut(BaseModel):
    id: int
    transfer_no: str
    source_location_id: int
    source_location_name: Optional[str] = None
    destination_location_id: int
    destination_location_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    items: List[TransferItemOut] = []

    class Config:
        from_attributes = True

# --- Adjustment Schemas ---
class AdjustmentItemCreate(BaseModel):
    product_id: int
    physical_quantity: float = Field(..., ge=0)

class AdjustmentItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    system_quantity: float
    physical_quantity: float
    delta: float

    class Config:
        from_attributes = True

class AdjustmentCreate(BaseModel):
    adjustment_no: Optional[str] = None
    warehouse_id: int
    location_id: int
    reason: str # Damaged | Lost | Count Correction | Expired | Other
    notes: Optional[str] = None
    items: List[AdjustmentItemCreate]

class AdjustmentOut(BaseModel):
    id: int
    adjustment_no: str
    warehouse_id: int
    warehouse_name: Optional[str] = None
    location_id: int
    location_name: Optional[str] = None
    status: str
    reason: str
    notes: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    items: List[AdjustmentItemOut] = []

    class Config:
        from_attributes = True

# --- Stock Movement / Ledger Schemas ---
class StockMovementOut(BaseModel):
    id: int
    reference_no: str
    movement_type: str
    product_id: int
    product_name: str
    sku: str
    source_location_name: Optional[str] = None
    destination_location_name: Optional[str] = None
    quantity_in: float
    quantity_out: float
    balance_after: float
    reason: Optional[str] = None
    created_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Alerts & Reorder Schemas ---
class AlertOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    current_quantity: float = 0.0
    threshold: float = 0.0
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReorderRuleCreate(BaseModel):
    product_id: int
    location_id: int
    reorder_point: float
    target_stock: float
    preferred_supplier_id: Optional[int] = None
    active: bool = True

class ReorderRuleOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    location_id: int
    location_name: str
    reorder_point: float
    target_stock: float
    available_stock: float
    suggested_order_quantity: float
    preferred_supplier_name: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True

# --- Dashboard & Search Schemas ---
class DashboardKPIs(BaseModel):
    total_products: int
    total_on_hand_units: float
    low_stock_count: int
    out_of_stock_count: int
    pending_receipts_count: int
    pending_deliveries_count: int
    in_progress_transfers_count: int
    recent_adjustments_count: int

class WarehouseStockChartItem(BaseModel):
    warehouse_name: str
    total_stock: float

class MovementTrendChartItem(BaseModel):
    date: str
    inbound: float
    outbound: float

class LowStockRiskChartItem(BaseModel):
    product_name: str
    sku: str
    current_stock: float
    reorder_point: float

class GlobalSearchResult(BaseModel):
    type: str # Product | Receipt | Delivery | Transfer | Adjustment
    title: str
    subtitle: str
    id: str
    link: str
