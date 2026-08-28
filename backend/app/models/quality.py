import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, Float, Date, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class NCR(Base):
    __tablename__ = "ncrs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    ncr_number = Column(String(100), nullable=False, unique=True)
    defect_description = Column(String(500), nullable=False)
    defect_type = Column(String(100), nullable=False)  # Solder_Bridge, Component_Missing, Mechanical_Scratch, Functional_Fail
    severity = Column(String(50), nullable=False)  # Critical, Major, Minor
    priority = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    status = Column(String(50), default="Draft")  # Draft, Contained, Under_RCA, 8D_Active, Closed
    logged_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    assigned_engineer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    project = relationship("Project", back_populates="ncrs")
    capa_8d = relationship("CAPA_8D", uselist=False, back_populates="ncr", cascade="all, delete-orphan")
    
    logged_by = relationship("User", foreign_keys=[logged_by_user_id])
    assigned_engineer = relationship("User", foreign_keys=[assigned_engineer_id])

class CAPA_8D(Base):
    __tablename__ = "capa_8ds"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ncr_id = Column(String(36), ForeignKey("ncrs.id"), nullable=False, unique=True)
    containment_actions = Column(String(1000))
    root_cause_5_why = Column(String(1000))  # 5 whys description
    corrective_actions = Column(String(1000))
    preventive_actions = Column(String(1000))
    effectiveness_verified = Column(Boolean, default=False)
    
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String(50), default="Open")  # Open, In_Progress, Verified, Closed
    
    ncr = relationship("NCR", back_populates="capa_8d")
    owner = relationship("User", foreign_keys=[owner_id])

class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    inspector_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    lot_size = Column(Integer, default=100)
    sample_size = Column(Integer, default=10)
    defects_found = Column(Integer, default=0)
    status = Column(String(50), default="Passed")  # Passed, Failed
    
    project = relationship("Project")
    inspector = relationship("User")

class SPCMeasurement(Base):
    __tablename__ = "spc_measurements"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parameter_name = Column(String(100), nullable=False)  # Solder Paste Thickness, Balancing Offset
    value = Column(Float, nullable=False)
    lcl = Column(Float, nullable=False)
    ucl = Column(Float, nullable=False)
    target = Column(Float, nullable=False)
    measured_at = Column(DateTime, default=datetime.utcnow)

class Audit(Base):
    __tablename__ = "audits"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_number = Column(String(100), nullable=False, unique=True)
    auditor_name = Column(String(100), nullable=False)
    audit_date = Column(Date, nullable=False)
    findings_count = Column(Integer, default=0)
    status = Column(String(50), default="Scheduled")  # Scheduled, Completed, Corrective_Action
    score = Column(Float, default=100.0)

class Certification(Base):
    __tablename__ = "certifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    issuer = Column(String(100), nullable=False)
    valid_until = Column(Date, nullable=False)
    status = Column(String(50), default="Active")  # Active, Expired

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    document_number = Column(String(100), nullable=False, unique=True)
    type = Column(String(100), nullable=False)  # SOP, Drawing, Quality Manual, Cert
    revision = Column(String(10), default="A")
    status = Column(String(50), default="Approved")  # Approved, Draft, Superseded
    approved_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
