from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# Work Order Schemas
class WorkOrderBase(BaseModel):
    work_order_number: str
    quantity_ordered: int
    quantity_completed: int = 0
    status: str = "Released"

class WorkOrderCreate(WorkOrderBase):
    project_id: str

class WorkOrderUpdate(BaseModel):
    work_order_number: Optional[str] = None
    quantity_ordered: Optional[int] = None
    quantity_completed: Optional[int] = None
    status: Optional[str] = None

class WorkOrderOut(WorkOrderBase):
    id: str
    project_id: str
    project_name: Optional[str] = None

    class Config:
        from_attributes = True

# Machine Schemas
class MachineOut(BaseModel):
    id: str
    production_line_id: str
    name: str
    type: str
    status: str
    downtime_reason: Optional[str] = None

    class Config:
        from_attributes = True

class MachineUpdate(BaseModel):
    status: str
    downtime_reason: Optional[str] = None

# Production Line Schemas
class ProductionLineOut(BaseModel):
    id: str
    name: str
    status: str
    oee: float
    yield_rate: float
    downtime_minutes: int
    machines: List[MachineOut] = []

    class Config:
        from_attributes = True

# Shift Summary Schemas
class ShiftSummaryOut(BaseModel):
    id: str
    shift_name: str
    date: date
    output_units: int
    defect_units: int
    downtime_minutes: int

    class Config:
        from_attributes = True

# Dashboard stats schemas
class TrendPoint(BaseModel):
    date: str
    output: int
    defects: int

class BottleneckPoint(BaseModel):
    id: str
    machine_name: str
    line_name: str
    type: str
    status: str
    failure_count: int = 0
    downtime_reason: Optional[str] = None

class CapacityUtilizationPoint(BaseModel):
    line_name: str
    utilization: float

class ProductionDashboardStats(BaseModel):
    total_work_orders: int
    active_wip: int
    average_oee: float
    average_yield: float
    total_downtime: int
    production_trends: List[TrendPoint]
    bottlenecks: List[BottleneckPoint]
    utilization: List[CapacityUtilizationPoint]
