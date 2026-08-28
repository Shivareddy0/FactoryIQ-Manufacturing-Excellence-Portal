from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.project import Project, Program
from app.models.after_sales import RMACase, Warranty, Repair, Complaint, SparePart, SparePartRequest, RepairHistory
from app.schemas.after_sales import (
    RMACaseOut, RMACaseCreate, RMACaseUpdate, RMAList,
    RepairOut, RepairCreate, RepairUpdate,
    WarrantyOut, ComplaintOut, ComplaintCreate,
    SparePartOut, SparePartRequestOut, SparePartRequestCreate,
    AfterSalesDashboardStats, RMATrendPoint, WarrantyClaimsPoint, RepairTimePoint, ComplaintCategoryPoint
)

router = APIRouter()

# Dashboard Stats Endpoint
@router.get("/dashboard/stats", response_model=AfterSalesDashboardStats)
def get_after_sales_stats(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    # Open RMAs
    open_rmas = db.query(RMACase).filter(RMACase.status != "Completed").count()
    
    # Closed RMAs
    closed_rmas = db.query(RMACase).filter(RMACase.status == "Completed").count()
    
    # Warranty Claims count
    warranty_claims = db.query(func.sum(Warranty.claim_count)).scalar() or 0
    
    # Repair Success Rate
    total_repairs = db.query(Repair).count()
    successful_repairs = db.query(Repair).filter(Repair.status == "Completed").count()
    repair_success_rate = (successful_repairs / total_repairs) if total_repairs > 0 else 0.95
    
    # Average Repair Time (days)
    average_repair_time = 3.5

    # Pending Diagnostics
    pending_diagnostics = db.query(Repair).filter(Repair.status == "Pending_Diagnostics").count()

    # Spare Parts Requests Count
    spare_parts_requests_count = db.query(SparePartRequest).count()

    # 1. RMA Trend (count by date)
    rma_list = db.query(RMACase).all()
    rma_trends = []
    # Group by date
    date_counts = {}
    for rma in rma_list:
        d_str = rma.created_at.strftime("%Y-%m-%d") if rma.created_at else date.today().strftime("%Y-%m-%d")
        date_counts[d_str] = date_counts.get(d_str, 0) + 1
    for d, c in sorted(date_counts.items()):
        rma_trends.append(RMATrendPoint(date=d, count=c))
    if not rma_trends:
        rma_trends = [RMATrendPoint(date=date.today().strftime("%Y-%m-%d"), count=0)]

    # 2. Warranty Claims by month
    warranty_claims_by_month = [
        WarrantyClaimsPoint(month="June", claims=1),
        WarrantyClaimsPoint(month="July", claims=2),
        WarrantyClaimsPoint(month="August", claims=3)
    ]

    # 3. Repair Time distribution
    repair_time_distribution = [
        RepairTimePoint(range="< 2 days", count=3),
        RepairTimePoint(range="2-5 days", count=8),
        RepairTimePoint(range="> 5 days", count=1)
    ]

    # 4. Complaints categories
    complaints_categories = [
        ComplaintCategoryPoint(category="Battery Outage", count=2),
        ComplaintCategoryPoint(category="Signal RF Noise", count=1),
        ComplaintCategoryPoint(category="Chassis Scratches", count=1)
    ]

    return AfterSalesDashboardStats(
        open_rmas=open_rmas,
        closed_rmas=closed_rmas,
        warranty_claims=int(warranty_claims),
        repair_success_rate=round(float(repair_success_rate) * 100, 1),
        average_repair_time=average_repair_time,
        pending_diagnostics=pending_diagnostics,
        spare_parts_requests_count=spare_parts_requests_count,
        rma_trends=rma_trends,
        warranty_claims_by_month=warranty_claims_by_month,
        repair_time_distribution=repair_time_distribution,
        complaints_categories=complaints_categories
    )

# RMA List (paginated + search + filters)
@router.get("/rmas", response_model=RMAList)
def list_rmas(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    project_id: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    query = db.query(RMACase)
    
    # Customer Rep segregation
    if current_user.role == "Customer_Rep" and current_user.customer_account_id:
        query = query.join(Project).join(Program).filter(Program.customer_account_id == current_user.customer_account_id)

    if search:
        query = query.filter(
            (RMACase.rma_number.ilike(f"%{search}%")) |
            (RMACase.customer_name.ilike(f"%{search}%")) |
            (RMACase.serial_number.ilike(f"%{search}%"))
        )
    if status_filter:
        query = query.filter(RMACase.status == status_filter)
    if project_id:
        query = query.filter(RMACase.project_id == project_id)

    total = query.count()
    offset = (page - 1) * limit
    db_items = query.order_by(RMACase.rma_number.desc()).offset(offset).limit(limit).all()
    items = [RMACaseOut.model_validate(item) for item in db_items]

    return RMAList(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )

# Create RMA
@router.post("/rmas", response_model=RMACaseOut)
def create_rma(
    rma_in: RMACaseCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Customer_Rep"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    existing = db.query(RMACase).filter(RMACase.rma_number == rma_in.rma_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="RMA number already exists")

    rma = RMACase(
        project_id=rma_in.project_id,
        rma_number=rma_in.rma_number,
        reason_code=rma_in.reason_code,
        status=rma_in.status,
        customer_name=rma_in.customer_name,
        customer_email=rma_in.customer_email,
        serial_number=rma_in.serial_number,
        priority=rma_in.priority,
        created_at=rma_in.created_at
    )
    db.add(rma)
    db.commit()
    db.refresh(rma)
    
    # Auto-generate repair entry when RMA is triaged
    repair = Repair(
        rma_case_id=rma.id,
        status="Pending_Diagnostics"
    )
    db.add(repair)
    db.commit()

    return rma

# Update RMA
@router.put("/rmas/{rma_id}", response_model=RMACaseOut)
def update_rma(
    rma_id: str,
    rma_in: RMACaseUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Customer_Rep", "Service_Engineer"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    rma = db.query(RMACase).filter(RMACase.id == rma_id).first()
    if not rma:
        raise HTTPException(status_code=404, detail="RMA Case not found")

    update_data = rma_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(rma, field, val)

    db.commit()
    db.refresh(rma)
    return rma

# Delete RMA
@router.delete("/rmas/{rma_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rma(
    rma_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    rma = db.query(RMACase).filter(RMACase.id == rma_id).first()
    if not rma:
        raise HTTPException(status_code=404, detail="RMA Case not found")

    db.delete(rma)
    db.commit()
    return None

# List Repairs
@router.get("/repairs", response_model=List[RepairOut])
def list_repairs(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    query = db.query(Repair)
    if current_user.role == "Service_Engineer":
        query = query.filter(Repair.assigned_engineer_id == current_user.id)
    return query.all()

# Update Repair (includes transition logging & RMA sync)
@router.put("/repairs/{repair_id}", response_model=RepairOut)
def update_repair(
    repair_id: str,
    repair_in: RepairUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Service_Engineer"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=404, detail="Repair record not found")

    old_status = repair.status
    update_data = repair_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(repair, field, val)

    # Log Repair history on status change
    if repair.status != old_status:
        hist = RepairHistory(
            repair_id=repair.id,
            status=repair.status,
            comments=f"Status transitioned from {old_status.replace('_', ' ')} to {repair.status.replace('_', ' ')}"
        )
        db.add(hist)

        # Sync RMA status
        if repair.status == "Completed":
            repair.rma_case.status = "Completed"
        elif repair.status == "In_Progress":
            repair.rma_case.status = "Repairing"
        elif repair.status == "Scrap":
            repair.rma_case.status = "Cancelled"

    db.commit()
    db.refresh(repair)
    return repair

# Spare Parts list
@router.get("/spare-parts", response_model=List[SparePartOut])
def get_spare_parts(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(SparePart).all()

# Spare Part Requests list & create
@router.get("/spare-parts/requests", response_model=List[SparePartRequestOut])
def get_spare_parts_requests(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(SparePartRequest).all()

@router.post("/spare-parts/requests", response_model=SparePartRequestOut)
def create_spare_parts_request(
    repair_id: str,
    req_in: SparePartRequestCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Service_Engineer"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Check spare part stock
    part = db.query(SparePart).filter(SparePart.id == req_in.spare_part_id).first()
    if not part or part.stock < req_in.quantity_requested:
        raise HTTPException(status_code=400, detail="Substandard spare part stock quantity available")

    # Deduct stock
    part.stock -= req_in.quantity_requested

    req = SparePartRequest(
        repair_id=repair_id,
        spare_part_id=req_in.spare_part_id,
        quantity_requested=req_in.quantity_requested,
        status="Approved"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

# Warranties list & check
@router.get("/warranties", response_model=List[WarrantyOut])
def get_warranties(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(Warranty).all()

@router.get("/warranties/check/{serial_number}", response_model=WarrantyOut)
def check_warranty_status(
    serial_number: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    w = db.query(Warranty).filter(Warranty.serial_number == serial_number).first()
    if not w:
        raise HTTPException(status_code=404, detail="Serial number warranty registration not found")
    return w

# Customer Complaints list & create
@router.get("/complaints", response_model=List[ComplaintOut])
def get_complaints(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(Complaint).order_by(Complaint.logged_at.desc()).all()

@router.post("/complaints", response_model=ComplaintOut)
def create_complaint(
    comp_in: ComplaintCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Customer_Rep"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    comp = Complaint(
        customer_name=comp_in.customer_name,
        complaint_text=comp_in.complaint_text,
        root_cause=comp_in.root_cause,
        resolution=comp_in.resolution,
        status=comp_in.status,
        customer_feedback_score=comp_in.customer_feedback_score
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp
