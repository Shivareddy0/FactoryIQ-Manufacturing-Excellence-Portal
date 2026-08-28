from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# Supplier schemas
class SupplierBase(BaseModel):
    name: str
    rating: str = "A"
    on_time_delivery_rate: float = 1.0
    defect_rate_ppm: float = 0.0
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_name: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    rating: Optional[str] = None
    on_time_delivery_rate: Optional[float] = None
    defect_rate_ppm: Optional[float] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_name: Optional[str] = None

class SupplierOut(SupplierBase):
    id: str
    
    class Config:
        from_attributes = True

# Purchase Order schemas
class PurchaseOrderBase(BaseModel):
    po_number: str
    status: str = "Issued"
    order_date: date
    delivery_date: Optional[date] = None
    approval_status: str = "Pending_Approval"
    delivery_eta: Optional[date] = None
    priority: str = "Medium"
    total_amount: float = 0.0

class PurchaseOrderCreate(PurchaseOrderBase):
    supplier_id: str

class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    delivery_date: Optional[date] = None
    approval_status: Optional[str] = None
    delivery_eta: Optional[date] = None
    priority: Optional[str] = None
    total_amount: Optional[float] = None

class PurchaseOrderOut(PurchaseOrderBase):
    id: str
    supplier_id: str
    supplier: Optional[SupplierOut] = None
    
    class Config:
        from_attributes = True

# Warehouse schemas
class WarehouseOut(BaseModel):
    id: str
    name: str
    location: Optional[str] = None
    
    class Config:
        from_attributes = True

# Material schemas
class MaterialOut(BaseModel):
    id: str
    part_number: str
    name: str
    category: str
    unit_of_measure: str
    unit_price: float
    
    class Config:
        from_attributes = True

# Inventory schemas
class InventoryBase(BaseModel):
    available_stock: int
    reserved_stock: int = 0
    minimum_stock: int = 0
    reorder_level: int = 0
    batch_lot_number: Optional[str] = None

class InventoryCreate(InventoryBase):
    material_id: str
    warehouse_id: str

class InventoryUpdate(BaseModel):
    available_stock: Optional[int] = None
    reserved_stock: Optional[int] = None
    minimum_stock: Optional[int] = None
    reorder_level: Optional[int] = None
    batch_lot_number: Optional[str] = None

class InventoryOut(InventoryBase):
    id: str
    material_id: str
    warehouse_id: str
    material: Optional[MaterialOut] = None
    warehouse: Optional[WarehouseOut] = None
    
    class Config:
        from_attributes = True

# Shipment schemas
class ShipmentOut(BaseModel):
    id: str
    purchase_order_id: str
    carrier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    status: str
    transit_progress: float
    eta: Optional[date] = None
    purchase_order: Optional[PurchaseOrderOut] = None
    
    class Config:
        from_attributes = True

# Incoming Inspection schemas
class IncomingInspectionCreate(BaseModel):
    purchase_order_id: str
    material_id: str
    inspection_date: date
    qty_received: int
    qty_accepted: int
    qty_rejected: int
    defect_reason: Optional[str] = None
    inspector_name: Optional[str] = None
    status: str = "Pending"

class IncomingInspectionOut(IncomingInspectionCreate):
    id: str
    material: Optional[MaterialOut] = None
    
    class Config:
        from_attributes = True

# SCM Dashboard metrics
class SupplierRatingPoint(BaseModel):
    supplier_name: str
    rating: float

class SCMInventoryValuePoint(BaseModel):
    category: str
    value: float

class POStatusCount(BaseModel):
    status: str
    count: int

class LowStockMaterial(BaseModel):
    part_number: str
    name: str
    available_stock: int
    minimum_stock: int

class SCMDashboardStats(BaseModel):
    total_suppliers: int
    active_pos: int
    delayed_shipments: int
    inventory_value: float
    low_stock_items_count: int
    on_time_delivery_rate: float
    incoming_inspection_pass_rate: float
    average_supplier_rating: str
    supplier_ratings: List[SupplierRatingPoint]
    inventory_by_category: List[SCMInventoryValuePoint]
    po_by_status: List[POStatusCount]
    low_stock_materials: List[LowStockMaterial]

class SupplierList(BaseModel):
    items: List[SupplierOut]
    total: int
    page: int
    limit: int
    pages: int

class POList(BaseModel):
    items: List[PurchaseOrderOut]
    total: int
    page: int
    limit: int
    pages: int
