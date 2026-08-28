import uuid
from sqlalchemy import Column, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Program(Base):
    __tablename__ = "programs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    health = Column(String(20), default="Green")  # Green, Yellow, Red
    customer_account_id = Column(String(36), ForeignKey("customer_accounts.id"), nullable=False)
    
    customer_account = relationship("CustomerAccount", back_populates="programs")
    projects = relationship("Project", back_populates="program", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id = Column(String(36), ForeignKey("programs.id"), nullable=False)
    name = Column(String(100), nullable=False)
    current_stage = Column(String(50), default="R&D")  # R&D, Proto, NPI, Qual, Mass_Prod
    target_date = Column(Date, nullable=False)
    status = Column(String(50), default="Active")  # Active, On_Hold, Completed, Cancelled
    priority = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    
    program = relationship("Program", back_populates="projects")
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    boms = relationship("BOM", back_populates="project", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="project", cascade="all, delete-orphan")
    ncrs = relationship("NCR", back_populates="project", cascade="all, delete-orphan")
    rma_cases = relationship("RMACase", back_populates="project", cascade="all, delete-orphan")
    stage_gate_items = relationship("StageGateChecklist", back_populates="project", cascade="all, delete-orphan")

class Milestone(Base):
    __tablename__ = "milestones"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(100), nullable=False)
    planned_date = Column(Date, nullable=False)
    actual_date = Column(Date, nullable=True)
    status = Column(String(50), default="Not_Started")  # Not_Started, In_Progress, Delayed, Completed
    critical_path = Column(Boolean, default=False)
    
    project = relationship("Project", back_populates="milestones")

class BOM(Base):
    __tablename__ = "boms"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    part_number = Column(String(100), nullable=False, unique=True)
    description = Column(String(250))
    revision = Column(String(10), default="A")
    lifecycle_status = Column(String(50), default="Active")  # Active, NRND, EOL
    
    project = relationship("Project", back_populates="boms")

class StageGateChecklist(Base):
    __tablename__ = "stage_gate_checklists"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    stage = Column(String(50), nullable=False)  # R&D, Proto, NPI, Qual, Mass_Prod
    task_name = Column(String(200), nullable=False)
    is_completed = Column(Boolean, default=False)
    
    project = relationship("Project", back_populates="stage_gate_items")
