import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from app.core.database import Base

class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    work_order_number = Column(String(100), nullable=False, unique=True)
    quantity_ordered = Column(Integer, nullable=False)
    quantity_completed = Column(Integer, default=0)
    status = Column(String(50), default="Released")  # Released, In_Production, Paused, Closed
    
    project = relationship("Project", back_populates="work_orders")
    telemetry = relationship("StationTelemetry", back_populates="work_order", cascade="all, delete-orphan")

class StationTelemetry(Base):
    __tablename__ = "station_telemetry"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=False)
    station_name = Column(String(100), nullable=False)  # AOI, X-Ray, Functional_Test, Manual_Assembly
    parts_passed = Column(Integer, default=0)
    parts_failed = Column(Integer, default=0)
    recorded_at = Column(DateTime, nullable=False)
    
    work_order = relationship("WorkOrder", back_populates="telemetry")

class ProductionLine(Base):
    __tablename__ = "production_lines"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)  # Line 1 SMT, Line 2 Composite, Line 3 Panels
    status = Column(String(50), default="Running")  # Running, Stopped, Idle
    oee = Column(Float, default=85.0)
    yield_rate = Column(Float, default=98.5)
    downtime_minutes = Column(Integer, default=0)
    
    machines = relationship("Machine", back_populates="production_line", cascade="all, delete-orphan")

class Machine(Base):
    __tablename__ = "machines"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    production_line_id = Column(String(36), ForeignKey("production_lines.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(100), nullable=False)  # SMT, Reflow, AOI, Functional_Test, Packaging
    status = Column(String(50), default="Active")  # Active, Error, Offline
    downtime_reason = Column(String(200), nullable=True)
    
    production_line = relationship("ProductionLine", back_populates="machines")

class ShiftSummary(Base):
    __tablename__ = "shift_summaries"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shift_name = Column(String(50), nullable=False)  # Shift A (Day), Shift B (Evening), Shift C (Night)
    date = Column(Date, nullable=False)
    output_units = Column(Integer, default=0)
    defect_units = Column(Integer, default=0)
    downtime_minutes = Column(Integer, default=0)
