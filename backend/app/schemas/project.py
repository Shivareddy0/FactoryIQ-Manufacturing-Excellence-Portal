from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# Program Schemas
class ProgramOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    health: str
    customer_account_id: str

    class Config:
        from_attributes = True

# Milestone Schemas
class MilestoneBase(BaseModel):
    name: str
    planned_date: date
    actual_date: Optional[date] = None
    status: str
    critical_path: bool = False

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneOut(MilestoneBase):
    id: str
    project_id: str

    class Config:
        from_attributes = True

# BOM Schemas
class BOMBase(BaseModel):
    part_number: str
    description: Optional[str] = None
    revision: str = "A"
    lifecycle_status: str = "Active"

class BOMCreate(BOMBase):
    pass

class BOMOut(BOMBase):
    id: str
    project_id: str

    class Config:
        from_attributes = True

# Stage Gate Checklist Schemas
class StageGateChecklistItemOut(BaseModel):
    id: str
    project_id: str
    stage: str
    task_name: str
    is_completed: bool

    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    current_stage: str = "R&D"
    target_date: date
    status: str = "Active"
    priority: str = "Medium"

class ProjectCreate(ProjectBase):
    program_id: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    current_stage: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class ProjectOut(ProjectBase):
    id: str
    program_id: str
    program: Optional[ProgramOut] = None
    milestone_count: int = 0
    completed_milestones: int = 0
    bom_count: int = 0

    class Config:
        from_attributes = True

class ProjectDetailsOut(ProjectOut):
    milestones: List[MilestoneOut] = []
    boms: List[BOMOut] = []
    stage_gate_items: List[StageGateChecklistItemOut] = []

    class Config:
        from_attributes = True

# Dashboard Stats Schemas
class ProjectStageCount(BaseModel):
    stage: str
    count: int

class ProjectStatusCount(BaseModel):
    status: str
    count: int

class ProgramHealthCount(BaseModel):
    health: str
    count: int

class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    stages_breakdown: List[ProjectStageCount]
    status_breakdown: List[ProjectStatusCount]
    program_health: List[ProgramHealthCount]
