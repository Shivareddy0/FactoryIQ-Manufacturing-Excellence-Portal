from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# User basic info for nested models
class UserMin(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True

# Project basic info
class ProjectMin(BaseModel):
    id: str
    name: str
    
    class Config:
        from_attributes = True

# CAPA Schemas
class CAPABase(BaseModel):
    containment_actions: Optional[str] = None
    root_cause_5_why: Optional[str] = None
    corrective_actions: Optional[str] = None
    preventive_actions: Optional[str] = None
    effectiveness_verified: bool = False
    due_date: Optional[date] = None
    status: str = "Open"

class CAPACreate(CAPABase):
    ncr_id: str
    owner_id: Optional[str] = None

class CAPAUpdate(CAPABase):
    owner_id: Optional[str] = None

class CAPAOut(CAPABase):
    id: str
    ncr_id: str
    owner_id: Optional[str] = None
    owner: Optional[UserMin] = None
    
    class Config:
        from_attributes = True

# NCR Schemas
class NCRBase(BaseModel):
    ncr_number: str
    defect_description: str
    defect_type: str
    severity: str
    priority: str = "Medium"
    status: str = "Draft"

class NCRCreate(NCRBase):
    project_id: str
    assigned_engineer_id: Optional[str] = None

class NCRUpdate(BaseModel):
    defect_description: Optional[str] = None
    defect_type: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_engineer_id: Optional[str] = None

class NCROut(NCRBase):
    id: str
    project_id: str
    project: Optional[ProjectMin] = None
    logged_by_user_id: str
    assigned_engineer_id: Optional[str] = None
    logged_by: Optional[UserMin] = None
    assigned_engineer: Optional[UserMin] = None
    capa_8d: Optional[CAPAOut] = None
    
    class Config:
        from_attributes = True

# Inspection Schemas
class InspectionCreate(BaseModel):
    project_id: str
    date: date
    lot_size: int
    sample_size: int
    defects_found: int
    status: str = "Passed"

class InspectionOut(InspectionCreate):
    id: str
    inspector_id: str
    inspector: Optional[UserMin] = None
    project: Optional[ProjectMin] = None
    
    class Config:
        from_attributes = True

# SPC Schemas
class SPCCreate(BaseModel):
    parameter_name: str
    value: float
    lcl: float
    ucl: float
    target: float

class SPCOut(SPCCreate):
    id: str
    measured_at: datetime
    
    class Config:
        from_attributes = True

# Audit Schemas
class AuditCreate(BaseModel):
    audit_number: str
    auditor_name: str
    audit_date: date
    findings_count: int = 0
    status: str = "Scheduled"
    score: float = 100.0

class AuditOut(AuditCreate):
    id: str
    
    class Config:
        from_attributes = True

# Certification Schemas
class CertificationOut(BaseModel):
    id: str
    name: str
    issuer: str
    valid_until: date
    status: str
    
    class Config:
        from_attributes = True

# Document Schemas
class DocumentOut(BaseModel):
    id: str
    title: str
    document_number: str
    type: str
    revision: str
    status: str
    approved_by: Optional[str] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard stats sub-schemas
class DefectParetoPoint(BaseModel):
    defect_type: str
    count: int

class DefectStationPoint(BaseModel):
    station_name: str
    count: int

class DefectShiftPoint(BaseModel):
    shift_name: str
    count: int

class DefectCustomerPoint(BaseModel):
    customer_name: str
    count: int

class QualityDashboardStats(BaseModel):
    open_ncrs: int
    closed_ncrs: int
    capas_in_progress: int
    defect_ppm: int
    first_pass_yield: float
    customer_complaints: int
    supplier_defects: int
    audit_compliance_rate: float
    defect_pareto: List[DefectParetoPoint]
    defect_stations: List[DefectStationPoint]
    defect_shifts: List[DefectShiftPoint]
    defect_customers: List[DefectCustomerPoint]

class NCRList(BaseModel):
    items: List[NCROut]
    total: int
    page: int
    limit: int
    pages: int
