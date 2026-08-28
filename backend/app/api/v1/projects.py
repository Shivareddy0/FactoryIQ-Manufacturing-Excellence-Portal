from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.project import Project, Program, Milestone, BOM, StageGateChecklist
from app.schemas.project import (
    ProjectOut, ProjectDetailsOut, ProjectCreate, ProjectUpdate,
    ProgramOut, MilestoneOut, MilestoneCreate, BOMOut, BOMCreate,
    StageGateChecklistItemOut, DashboardStats, ProjectStageCount,
    ProjectStatusCount, ProgramHealthCount
)

router = APIRouter()

# Dashboard Stats Endpoint
@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    # Total projects, active projects, completed projects count
    proj_query = db.query(Project)
    prog_query = db.query(Program)

    # Customer segregation
    if current_user.role == "Customer_Rep" and current_user.customer_account_id:
        proj_query = proj_query.join(Program).filter(Program.customer_account_id == current_user.customer_account_id)
        prog_query = prog_query.filter(Program.customer_account_id == current_user.customer_account_id)

    projects = proj_query.all()
    programs = prog_query.all()

    total_projects = len(projects)
    active_projects = sum(1 for p in projects if p.status == "Active")
    completed_projects = sum(1 for p in projects if p.status == "Completed")

    # Group by stage
    stages = ["R&D", "Proto", "NPI", "Qual", "Mass_Prod"]
    stages_counts = {s: 0 for s in stages}
    for p in projects:
        if p.current_stage in stages_counts:
            stages_counts[p.current_stage] += 1
    stages_breakdown = [ProjectStageCount(stage=s, count=c) for s, c in stages_counts.items()]

    # Group by status
    statuses = ["Active", "On_Hold", "Completed", "Cancelled"]
    status_counts = {st: 0 for st in statuses}
    for p in projects:
        if p.status in status_counts:
            status_counts[p.status] += 1
    status_breakdown = [ProjectStatusCount(status=st, count=c) for st, c in status_counts.items()]

    # Group by program health
    healths = ["Green", "Yellow", "Red"]
    health_counts = {h: 0 for h in healths}
    for prg in programs:
        if prg.health in health_counts:
            health_counts[prg.health] += 1
    program_health = [ProgramHealthCount(health=h, count=c) for h, c in health_counts.items()]

    return DashboardStats(
        total_projects=total_projects,
        active_projects=active_projects,
        completed_projects=completed_projects,
        stages_breakdown=stages_breakdown,
        status_breakdown=status_breakdown,
        program_health=program_health
    )

# List Programs
@router.get("/programs", response_model=List[ProgramOut])
def get_programs(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    query = db.query(Program)
    if current_user.role == "Customer_Rep" and current_user.customer_account_id:
        query = query.filter(Program.customer_account_id == current_user.customer_account_id)
    return query.all()

# List Projects with filters & pagination
@router.get("/", response_model=dict)
def get_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: Optional[str] = None,
    program_id: Optional[str] = None,
    stage: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    query = db.query(Project)

    # Customer segregation
    if current_user.role == "Customer_Rep" and current_user.customer_account_id:
        query = query.join(Program).filter(Program.customer_account_id == current_user.customer_account_id)

    # Apply filters
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
    if program_id:
        query = query.filter(Project.program_id == program_id)
    if stage:
        query = query.filter(Project.current_stage == stage)
    if status:
        query = query.filter(Project.status == status)
    if priority:
        query = query.filter(Project.priority == priority)

    total_records = query.count()
    offset = (page - 1) * limit
    projects_list = query.offset(offset).limit(limit).all()

    # Build response records with custom counts
    response_items = []
    for proj in projects_list:
        milestone_count = len(proj.milestones)
        completed_milestones = sum(1 for m in proj.milestones if m.status == "Completed")
        bom_count = len(proj.boms)

        proj_out = ProjectOut(
            id=proj.id,
            program_id=proj.program_id,
            name=proj.name,
            current_stage=proj.current_stage,
            target_date=proj.target_date,
            status=proj.status,
            priority=proj.priority,
            program=ProgramOut.from_orm(proj.program) if proj.program else None,
            milestone_count=milestone_count,
            completed_milestones=completed_milestones,
            bom_count=bom_count
        )
        response_items.append(proj_out)

    return {
        "items": response_items,
        "total": total_records,
        "page": page,
        "limit": limit,
        "pages": (total_records + limit - 1) // limit
    }

# Get Single Project Details
@router.get("/{project_id}", response_model=ProjectDetailsOut)
def get_project_details(
    project_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Customer Rep authorization checks
    if current_user.role == "Customer_Rep" and current_user.customer_account_id:
        if project.program.customer_account_id != current_user.customer_account_id:
            raise HTTPException(status_code=403, detail="Access denied: project is outside your account")

    milestone_count = len(project.milestones)
    completed_milestones = sum(1 for m in project.milestones if m.status == "Completed")
    bom_count = len(project.boms)

    return ProjectDetailsOut(
        id=project.id,
        program_id=project.program_id,
        name=project.name,
        current_stage=project.current_stage,
        target_date=project.target_date,
        status=project.status,
        priority=project.priority,
        program=ProgramOut.from_orm(project.program) if project.program else None,
        milestones=project.milestones,
        boms=project.boms,
        stage_gate_items=project.stage_gate_items,
        milestone_count=milestone_count,
        completed_milestones=completed_milestones,
        bom_count=bom_count
    )

# Create Project (and auto initialize checklist)
@router.post("/", response_model=ProjectDetailsOut)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    program = db.query(Program).filter(Program.id == project_in.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    project = Project(
        program_id=project_in.program_id,
        name=project_in.name,
        current_stage=project_in.current_stage,
        target_date=project_in.target_date,
        status=project_in.status,
        priority=project_in.priority
    )
    db.add(project)
    db.flush()

    # Default Stage Gate Checklist Template items
    stage_gate_templates = {
        "R&D": [
            "Market Requirements Document (MRD) finalized",
            "Technical Feasibility Study completed",
            "Initial Concept Design review"
        ],
        "Proto": [
            "Schematic & CAD designs frozen",
            "Prototype materials sourced",
            "First-article prototype assembly",
            "Initial functional testing"
        ],
        "NPI": [
            "Bill of Materials (BOM) finalized",
            "Manufacturing assembly line setup",
            "Work orders generated for pilot run",
            "Production staff training completed"
        ],
        "Qual": [
            "Environmental and stress testing",
            "Quality Assurance audit passed",
            "Regulatory compliance certification"
        ],
        "Mass_Prod": [
            "Standard Operating Procedures (SOPs) active",
            "End-of-line testing station validated",
            "Full supply chain readiness approval"
        ]
    }

    stages_order = ["R&D", "Proto", "NPI", "Qual", "Mass_Prod"]
    proj_stage_idx = stages_order.index(project.current_stage) if project.current_stage in stages_order else 0

    for stage, tasks in stage_gate_templates.items():
        stage_idx = stages_order.index(stage)
        for idx, task in enumerate(tasks):
            is_task_completed = stage_idx < proj_stage_idx
            # Complete the first task of current stage
            if stage_idx == proj_stage_idx and idx == 0:
                is_task_completed = True

            db.add(StageGateChecklist(
                project_id=project.id,
                stage=stage,
                task_name=task,
                is_completed=is_task_completed
            ))

    db.commit()
    db.refresh(project)
    return get_project_details(project.id, current_user, db)

# Update Project
@router.put("/{project_id}", response_model=ProjectDetailsOut)
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    # Optionally update checklists dynamically if stage changed
    # e.g., if changing from Proto to NPI, mark all R&D and Proto items as completed
    if "current_stage" in update_data:
        stages_order = ["R&D", "Proto", "NPI", "Qual", "Mass_Prod"]
        new_stage_idx = stages_order.index(project.current_stage) if project.current_stage in stages_order else 0
        for item in project.stage_gate_items:
            item_stage_idx = stages_order.index(item.stage) if item.stage in stages_order else 0
            if item_stage_idx < new_stage_idx:
                item.is_completed = True

    db.commit()
    db.refresh(project)
    return get_project_details(project.id, current_user, db)

# Delete Project
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return None

# Create Milestone
@router.post("/{project_id}/milestones", response_model=MilestoneOut)
def create_milestone(
    project_id: str,
    milestone_in: MilestoneCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestone = Milestone(
        project_id=project_id,
        name=milestone_in.name,
        planned_date=milestone_in.planned_date,
        actual_date=milestone_in.actual_date,
        status=milestone_in.status,
        critical_path=milestone_in.critical_path
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone

# Update Milestone
@router.put("/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone(
    milestone_id: str,
    milestone_in: MilestoneCreate,  # Can reuse same schema
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    for field, value in milestone_in.dict().items():
        setattr(milestone, field, value)

    db.commit()
    db.refresh(milestone)
    return milestone

# Delete Milestone
@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(
    milestone_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    db.delete(milestone)
    db.commit()
    return None

# Create BOM Item
@router.post("/{project_id}/bom", response_model=BOMOut)
def create_bom_item(
    project_id: str,
    bom_in: BOMCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check for duplicate part number
    existing = db.query(BOM).filter(BOM.part_number == bom_in.part_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Part number already exists")

    bom_item = BOM(
        project_id=project_id,
        part_number=bom_in.part_number,
        description=bom_in.description,
        revision=bom_in.revision,
        lifecycle_status=bom_in.lifecycle_status
    )
    db.add(bom_item)
    db.commit()
    db.refresh(bom_item)
    return bom_item

# Update BOM Item
@router.put("/bom/{bom_id}", response_model=BOMOut)
def update_bom_item(
    bom_id: str,
    bom_in: BOMCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    bom_item = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom_item:
        raise HTTPException(status_code=404, detail="BOM item not found")

    # Check for duplicate part number if it's changing
    if bom_in.part_number != bom_item.part_number:
        existing = db.query(BOM).filter(BOM.part_number == bom_in.part_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Part number already exists")

    for field, value in bom_in.dict().items():
        setattr(bom_item, field, value)

    db.commit()
    db.refresh(bom_item)
    return bom_item

# Delete BOM Item
@router.delete("/bom/{bom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bom_item(
    bom_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    bom_item = db.query(BOM).filter(BOM.id == bom_id).first()
    if not bom_item:
        raise HTTPException(status_code=404, detail="BOM item not found")

    db.delete(bom_item)
    db.commit()
    return None

# Toggle Stage Gate Item Status
@router.put("/stage-gate/{item_id}", response_model=StageGateChecklistItemOut)
def toggle_stage_gate_item(
    item_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Project_Mgr"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    item = db.query(StageGateChecklist).filter(StageGateChecklist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stage gate item not found")

    item.is_completed = not item.is_completed
    db.commit()
    db.refresh(item)
    return item
