from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.api import deps
from app.core.database import get_db
from app.models.user import User
from app.models.supply_chain import Supplier, PurchaseOrder, Warehouse, Material, Inventory, Shipment, IncomingInspection
from app.schemas.supply_chain import (
    SupplierOut, SupplierCreate, SupplierUpdate, SupplierList,
    PurchaseOrderOut, PurchaseOrderCreate, PurchaseOrderUpdate, POList,
    WarehouseOut, MaterialOut, InventoryOut, InventoryCreate, InventoryUpdate,
    ShipmentOut, IncomingInspectionOut, IncomingInspectionCreate,
    SCMDashboardStats, SupplierRatingPoint, SCMInventoryValuePoint, POStatusCount, LowStockMaterial
)

router = APIRouter()

# Dashboard Stats Endpoint
@router.get("/dashboard/stats", response_model=SCMDashboardStats)
def get_scm_stats(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    # Total Suppliers
    total_suppliers = db.query(Supplier).count()
    
    # Active Purchase Orders
    active_pos = db.query(PurchaseOrder).filter(PurchaseOrder.status.in_(["Issued", "Shipped", "In_Inspection"])).count()
    
    # Delayed Shipments (In Transit and ETA in the past)
    today = date.today()
    delayed_shipments = db.query(Shipment).filter(
        Shipment.status == "In_Transit",
        Shipment.eta < today
    ).count()

    # Dynamic Inventory Value calculation (available_stock * unit_price of materials)
    inventory_val = db.query(func.sum(Inventory.available_stock * Material.unit_price))\
        .join(Material, Inventory.material_id == Material.id).scalar() or 0.0

    # Low Stock Items Count
    low_stock_items_count = db.query(Inventory).filter(Inventory.available_stock < Inventory.minimum_stock).count()

    # On-Time Delivery Rate (average of suppliers)
    otd = db.query(func.avg(Supplier.on_time_delivery_rate)).scalar()
    on_time_delivery_rate = float(otd) if otd else 0.96

    # Incoming Inspection Pass Rate
    total_insp = db.query(IncomingInspection).count()
    passed_insp = db.query(IncomingInspection).filter(IncomingInspection.status == "Passed").count()
    incoming_inspection_pass_rate = (passed_insp / total_insp) if total_insp > 0 else 0.98

    # Average Supplier Rating
    avg_otd = on_time_delivery_rate
    if avg_otd >= 0.97:
        average_supplier_rating = "A"
    elif avg_otd >= 0.92:
        average_supplier_rating = "B"
    elif avg_otd >= 0.85:
        average_supplier_rating = "C"
    else:
        average_supplier_rating = "D"

    # Supplier ratings list
    suppliers_list = db.query(Supplier).all()
    supplier_ratings = []
    for s in suppliers_list:
        # Convert A,B,C,D rating to 100-based scale for Recharts
        score = 95.0
        if s.rating == "B": score = 82.0
        elif s.rating == "C": score = 65.0
        elif s.rating == "D": score = 45.0
        supplier_ratings.append(SupplierRatingPoint(supplier_name=s.name, rating=score))

    # Inventory by category
    categories_query = db.query(Material.category, func.sum(Inventory.available_stock * Material.unit_price))\
        .join(Material, Inventory.material_id == Material.id)\
        .group_by(Material.category).all()
    inventory_by_category = [SCMInventoryValuePoint(category=row[0], value=float(row[1] or 0.0)) for row in categories_query]

    # PO status breakdown
    po_query = db.query(PurchaseOrder.status, func.count(PurchaseOrder.id))\
        .group_by(PurchaseOrder.status).all()
    po_by_status = [POStatusCount(status=row[0], count=row[1]) for row in po_query]

    # Low stock materials details
    low_stock_list = db.query(Inventory).filter(Inventory.available_stock < Inventory.minimum_stock).all()
    low_stock_materials = []
    for item in low_stock_list:
        low_stock_materials.append(LowStockMaterial(
            part_number=item.material.part_number,
            name=item.material.name,
            available_stock=item.available_stock,
            minimum_stock=item.minimum_stock
        ))

    return SCMDashboardStats(
        total_suppliers=total_suppliers,
        active_pos=active_pos,
        delayed_shipments=delayed_shipments,
        inventory_value=round(float(inventory_val), 2),
        low_stock_items_count=low_stock_items_count,
        on_time_delivery_rate=round(float(on_time_delivery_rate) * 100, 1),
        incoming_inspection_pass_rate=round(float(incoming_inspection_pass_rate) * 100, 1),
        average_supplier_rating=average_supplier_rating,
        supplier_ratings=supplier_ratings,
        inventory_by_category=inventory_by_category,
        po_by_status=po_by_status,
        low_stock_materials=low_stock_materials
    )

# Suppliers List (paginated + search)
@router.get("/suppliers", response_model=SupplierList)
def list_suppliers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    query = db.query(Supplier)
    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))
    
    total = query.count()
    offset = (page - 1) * limit
    db_items = query.offset(offset).limit(limit).all()
    items = [SupplierOut.model_validate(item) for item in db_items]

    return SupplierList(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )

# Create Supplier
@router.post("/suppliers", response_model=SupplierOut)
def create_supplier(
    supplier_in: SupplierCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "SC_Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    existing = db.query(Supplier).filter(Supplier.name == supplier_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier name already exists")

    supplier = Supplier(
        name=supplier_in.name,
        rating=supplier_in.rating,
        email=supplier_in.email,
        phone=supplier_in.phone,
        contact_name=supplier_in.contact_name
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

# Update Supplier
@router.put("/suppliers/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: str,
    supplier_in: SupplierUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "SC_Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = supplier_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(supplier, field, val)

    db.commit()
    db.refresh(supplier)
    return supplier

# Delete Supplier
@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "SC_Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()
    return None

# PO List (paginated + search + filters)
@router.get("/pos", response_model=POList)
def list_pos(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    query = db.query(PurchaseOrder)
    if search:
        query = query.filter(PurchaseOrder.po_number.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(PurchaseOrder.status == status_filter)

    total = query.count()
    offset = (page - 1) * limit
    db_items = query.order_by(PurchaseOrder.po_number.desc()).offset(offset).limit(limit).all()
    items = [PurchaseOrderOut.model_validate(item) for item in db_items]

    return POList(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )

# Create PO
@router.post("/pos", response_model=PurchaseOrderOut)
def create_po(
    po_in: PurchaseOrderCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "SC_Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    existing = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_in.po_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="PO number already exists")

    po = PurchaseOrder(
        supplier_id=po_in.supplier_id,
        po_number=po_in.po_number,
        status=po_in.status,
        order_date=po_in.order_date,
        delivery_date=po_in.delivery_date,
        approval_status=po_in.approval_status,
        delivery_eta=po_in.delivery_eta,
        priority=po_in.priority,
        total_amount=po_in.total_amount
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    return po

# Update PO
@router.put("/pos/{po_id}", response_model=PurchaseOrderOut)
def update_po(
    po_id: str,
    po_in: PurchaseOrderUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "SC_Manager", "Warehouse_Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")

    update_data = po_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(po, field, val)

    db.commit()
    db.refresh(po)
    return po

# Delete PO
@router.delete("/pos/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_po(
    po_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "SC_Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")

    db.delete(po)
    db.commit()
    return None

# Inventory query endpoint
@router.get("/inventory", response_model=List[InventoryOut])
def get_inventory(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(Inventory).all()

# Warehouses list
@router.get("/warehouses", response_model=List[WarehouseOut])
def get_warehouses(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(Warehouse).all()

# Materials list
@router.get("/materials", response_model=List[MaterialOut])
def get_materials(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(Material).all()

# Incoming Inspections list & CRUD
@router.get("/incoming-inspections", response_model=List[IncomingInspectionOut])
def get_incoming_inspections(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(IncomingInspection).all()

@router.post("/incoming-inspections", response_model=IncomingInspectionOut)
def create_incoming_inspection(
    insp_in: IncomingInspectionCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role not in ["Admin", "Quality_Eng", "SC_Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    insp = IncomingInspection(
        purchase_order_id=insp_in.purchase_order_id,
        material_id=insp_in.material_id,
        inspection_date=insp_in.inspection_date,
        qty_received=insp_in.qty_received,
        qty_accepted=insp_in.qty_accepted,
        qty_rejected=insp_in.qty_rejected,
        defect_reason=insp_in.defect_reason,
        inspector_name=current_user.full_name,
        status=insp_in.status
    )
    db.add(insp)
    db.commit()
    db.refresh(insp)
    return insp

# Shipments list
@router.get("/shipments", response_model=List[ShipmentOut])
def get_shipments(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    return db.query(Shipment).all()
