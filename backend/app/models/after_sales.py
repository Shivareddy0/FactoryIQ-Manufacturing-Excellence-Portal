import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Integer, Date, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class RMACase(Base):
    __tablename__ = "rma_cases"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    rma_number = Column(String(100), nullable=False, unique=True)
    reason_code = Column(String(100), nullable=False)  # e.g., Display_Failure, Battery_Fault, RF_Noise
    status = Column(String(50), default="Requested")  # Requested, Shipped, In_Triage, Repairing, Completed, Cancelled
    
    # Extended customer details
    customer_name = Column(String(100), nullable=True)
    customer_email = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    priority = Column(String(50), default="Medium")  # High, Medium, Low
    created_at = Column(Date, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="rma_cases")
    repairs = relationship("Repair", back_populates="rma_case", cascade="all, delete-orphan")

class Warranty(Base):
    __tablename__ = "warranties"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    serial_number = Column(String(100), nullable=False, unique=True)
    expiry_date = Column(Date, nullable=False)
    status = Column(String(50), default="Active")  # Active, Expired, Voided
    claim_count = Column(Integer, default=0)

class Repair(Base):
    __tablename__ = "repairs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rma_case_id = Column(String(36), ForeignKey("rma_cases.id"), nullable=False)
    diagnostics = Column(String(500), nullable=True)
    repair_action = Column(String(500), nullable=True)
    assigned_engineer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="Pending_Diagnostics")  # Pending_Diagnostics, In_Progress, Under_QA, Completed, Scrap
    completion_date = Column(Date, nullable=True)
    
    rma_case = relationship("RMACase", back_populates="repairs")
    assigned_engineer = relationship("User")
    history = relationship("RepairHistory", back_populates="repair", cascade="all, delete-orphan")
    parts_requested = relationship("SparePartRequest", back_populates="repair", cascade="all, delete-orphan")

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_name = Column(String(100), nullable=False)
    complaint_text = Column(String(1000), nullable=False)
    root_cause = Column(String(500), nullable=True)
    resolution = Column(String(500), nullable=True)
    status = Column(String(50), default="Open")  # Open, Investigating, Resolved, Closed
    customer_feedback_score = Column(Integer, nullable=True)  # 1 to 5
    logged_at = Column(Date, default=datetime.utcnow)

class SparePart(Base):
    __tablename__ = "spare_parts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    part_number = Column(String(100), nullable=False, unique=True)
    name = Column(String(150), nullable=False)
    stock = Column(Integer, default=0)
    unit_price = Column(Float, default=0.0)

class SparePartRequest(Base):
    __tablename__ = "spare_part_requests"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repair_id = Column(String(36), ForeignKey("repairs.id"), nullable=False)
    spare_part_id = Column(String(36), ForeignKey("spare_parts.id"), nullable=False)
    quantity_requested = Column(Integer, default=1)
    status = Column(String(50), default="Requested")  # Requested, Approved, Dispatched, Delivered
    
    repair = relationship("Repair", back_populates="parts_requested")
    spare_part = relationship("SparePart")

class RepairHistory(Base):
    __tablename__ = "repair_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repair_id = Column(String(36), ForeignKey("repairs.id"), nullable=False)
    status = Column(String(50), nullable=False)
    comments = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    repair = relationship("Repair", back_populates="history")
