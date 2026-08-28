from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class UserMin(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True

class ProjectMin(BaseModel):
    id: str
    name: str
    
    class Config:
        from_attributes = True

# Spare Part schemas
class SparePartOut(BaseModel):
    id: str
    part_number: str
    name: str
    stock: int
    unit_price: float
    
    class Config:
        from_attributes = True

# Spare Part Request schemas
class SparePartRequestCreate(BaseModel):
    spare_part_id: str
    quantity_requested: int = 1

class SparePartRequestOut(BaseModel):
    id: str
    repair_id: str
    spare_part_id: str
    quantity_requested: int
    status: str
    spare_part: Optional[SparePartOut] = None
    
    class Config:
        from_attributes = True

# Repair History schemas
class RepairHistoryOut(BaseModel):
    id: str
    repair_id: str
    status: str
    comments: Optional[str] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Repair schemas
class RepairBase(BaseModel):
    diagnostics: Optional[str] = None
    repair_action: Optional[str] = None
    status: str = "Pending_Diagnostics"
    completion_date: Optional[date] = None

class RepairCreate(RepairBase):
    rma_case_id: str
    assigned_engineer_id: Optional[str] = None

class RepairUpdate(BaseModel):
    diagnostics: Optional[str] = None
    repair_action: Optional[str] = None
    assigned_engineer_id: Optional[str] = None
    status: Optional[str] = None
    completion_date: Optional[date] = None

class RepairOut(RepairBase):
    id: str
    rma_case_id: str
    assigned_engineer_id: Optional[str] = None
    assigned_engineer: Optional[UserMin] = None
    history: List[RepairHistoryOut] = []
    parts_requested: List[SparePartRequestOut] = []
    
    class Config:
        from_attributes = True

# Warranty schemas
class WarrantyOut(BaseModel):
    id: str
    serial_number: str
    expiry_date: date
    status: str
    claim_count: int
    
    class Config:
        from_attributes = True

# Complaint schemas
class ComplaintCreate(BaseModel):
    customer_name: str
    complaint_text: str
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    status: str = "Open"
    customer_feedback_score: Optional[int] = None

class ComplaintOut(ComplaintCreate):
    id: str
    logged_at: date
    
    class Config:
        from_attributes = True

# RMA Case schemas
class RMACaseBase(BaseModel):
    rma_number: str
    reason_code: str
    status: str = "Requested"
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    serial_number: Optional[str] = None
    priority: str = "Medium"
    created_at: date

class RMACaseCreate(RMACaseBase):
    project_id: str

class RMACaseUpdate(BaseModel):
    reason_code: Optional[str] = None
    status: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    serial_number: Optional[str] = None
    priority: Optional[str] = None

class RMACaseOut(RMACaseBase):
    id: str
    project_id: str
    project: Optional[ProjectMin] = None
    repairs: List[RepairOut] = []
    
    class Config:
        from_attributes = True

# Dashboard stats
class RMATrendPoint(BaseModel):
    date: str
    count: int

class WarrantyClaimsPoint(BaseModel):
    month: str
    claims: int

class RepairTimePoint(BaseModel):
    range: str
    count: int

class ComplaintCategoryPoint(BaseModel):
    category: str
    count: int

class AfterSalesDashboardStats(BaseModel):
    open_rmas: int
    closed_rmas: int
    warranty_claims: int
    repair_success_rate: float
    average_repair_time: float
    pending_diagnostics: int
    spare_parts_requests_count: int
    rma_trends: List[RMATrendPoint]
    warranty_claims_by_month: List[WarrantyClaimsPoint]
    repair_time_distribution: List[RepairTimePoint]
    complaints_categories: List[ComplaintCategoryPoint]

class RMAList(BaseModel):
    items: List[RMACaseOut]
    total: int
    page: int
    limit: int
    pages: int
