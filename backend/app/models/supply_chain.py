import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, Date, Integer, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    rating = Column(String(5), default="A")  # A, B, C, D
    on_time_delivery_rate = Column(Float, default=1.0)
    defect_rate_ppm = Column(Float, default=0.0)
    
    # Contact information
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    contact_name = Column(String(100), nullable=True)
    
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier", cascade="all, delete-orphan")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    supplier_id = Column(String(36), ForeignKey("suppliers.id"), nullable=False)
    po_number = Column(String(100), nullable=False, unique=True)
    status = Column(String(50), default="Issued")  # Issued, Shipped, In_Inspection, Completed, Cancelled
    order_date = Column(Date, nullable=False)
    delivery_date = Column(Date, nullable=True)
    
    # New extended columns
    approval_status = Column(String(50), default="Pending_Approval")  # Pending_Approval, Approved, Rejected
    delivery_eta = Column(Date, nullable=True)
    priority = Column(String(50), default="Medium")  # High, Medium, Low
    total_amount = Column(Float, default=0.0)
    
    supplier = relationship("Supplier", back_populates="purchase_orders")
    shipments = relationship("Shipment", back_populates="purchase_order", cascade="all, delete-orphan")
    inspections = relationship("IncomingInspection", back_populates="purchase_order", cascade="all, delete-orphan")

class Warehouse(Base):
    __tablename__ = "warehouses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    location = Column(String(200), nullable=True)

class Material(Base):
    __tablename__ = "materials"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    part_number = Column(String(100), nullable=False, unique=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)  # PCB, Chipset, Connector, Packaging, etc.
    unit_of_measure = Column(String(20), default="pcs")
    unit_price = Column(Float, default=0.0)

class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=False)
    batch_lot_number = Column(String(100), nullable=True)
    available_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=0)
    reorder_level = Column(Integer, default=0)
    
    material = relationship("Material")
    warehouse = relationship("Warehouse")

class Shipment(Base):
    __tablename__ = "shipments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id"), nullable=False)
    carrier_name = Column(String(100), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    status = Column(String(50), default="In_Transit")  # In_Transit, Delivered, Customs_Hold, Pending_Pickup
    transit_progress = Column(Float, default=0.0)  # Percentage (0 to 100)
    eta = Column(Date, nullable=True)
    
    purchase_order = relationship("PurchaseOrder", back_populates="shipments")

class IncomingInspection(Base):
    __tablename__ = "incoming_inspections"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id"), nullable=False)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    inspection_date = Column(Date, nullable=False)
    qty_received = Column(Integer, default=0)
    qty_accepted = Column(Integer, default=0)
    qty_rejected = Column(Integer, default=0)
    defect_reason = Column(String(500), nullable=True)
    inspector_name = Column(String(100), nullable=True)
    status = Column(String(50), default="Pending")  # Passed, Failed, Pending
    
    purchase_order = relationship("PurchaseOrder", back_populates="inspections")
    material = relationship("Material")
