from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, CustomerAccount
from app.models.project import Program, Project, Milestone, BOM, StageGateChecklist
from app.models.production import WorkOrder, StationTelemetry, ProductionLine, Machine, ShiftSummary
from app.models.quality import NCR, CAPA_8D, Inspection, SPCMeasurement, Audit, Certification, Document
from app.models.supply_chain import Supplier, PurchaseOrder, Warehouse, Material, Inventory, Shipment, IncomingInspection
from app.models.after_sales import RMACase, Warranty, Repair, Complaint, SparePart, SparePartRequest, RepairHistory

def seed_db(db: Session):
    # Ensure all tables are created
    Base.metadata.create_all(bind=engine)
    
    # Check if database is already seeded
    if db.query(User).first():
        print("Database already seeded.")
        return

    print("Seeding database...")
    
    # 1. Seed 5 Customer Accounts
    customers = [
        CustomerAccount(name="Acme Electronics", industry="Consumer Electronics"),
        CustomerAccount(name="Apex Aerospace", industry="Aviation & Defense"),
        CustomerAccount(name="Chevron Energy", industry="Oil, Gas & Renewables"),
        CustomerAccount(name="BioPharma Devices", industry="Medical Equipment"),
        CustomerAccount(name="Tesla Grid Systems", industry="Automotive & Energy Infrastructure")
    ]
    db.add_all(customers)
    db.flush()  # Generate IDs

    # 2. Seed Users
    hashed_pwd = get_password_hash("password123")
    users = [
        User(email="admin@factoryiq.com", hashed_password=hashed_pwd, full_name="System Admin", role="Admin"),
        User(email="planner@factoryiq.com", hashed_password=hashed_pwd, full_name="Sarah Miller", role="Prod_Planner"),
        User(email="quality@factoryiq.com", hashed_password=hashed_pwd, full_name="Robert Chen", role="Quality_Eng"),
        User(email="scm@factoryiq.com", hashed_password=hashed_pwd, full_name="Elena Rostova", role="SC_Manager"),
        User(email="pm@factoryiq.com", hashed_password=hashed_pwd, full_name="James Carter", role="Project_Mgr"),
        User(email="acme_rep@factoryiq.com", hashed_password=hashed_pwd, full_name="David Vance (Acme)", role="Customer_Rep", customer_account_id=customers[0].id),
        User(email="apex_rep@factoryiq.com", hashed_password=hashed_pwd, full_name="Alice Sterling (Apex)", role="Customer_Rep", customer_account_id=customers[1].id),
        User(email="warehouse@factoryiq.com", hashed_password=hashed_pwd, full_name="Marcus Vance", role="Warehouse_Manager"),
        User(email="service@factoryiq.com", hashed_password=hashed_pwd, full_name="Alex Mercer", role="Service_Engineer")
    ]
    db.add_all(users)
    db.flush()

    # Get Quality Engineer for NCR logging
    quality_user = db.query(User).filter(User.role == "Quality_Eng").first()

    # 3. Seed Programs (1 per customer)
    programs = [
        Program(name="Acme Mobile G5 Series", description="Next-generation 5G enabled smartphone line.", health="Green", customer_account_id=customers[0].id),
        Program(name="Apex Scout UAV Wing", description="Composite wing production for Scout surveillance drone.", health="Yellow", customer_account_id=customers[1].id),
        Program(name="Chevron Turbine Safety Control", description="Turbine automation monitoring hardware system.", health="Green", customer_account_id=customers[2].id),
        Program(name="BioPharma Vent-3000", description="Advanced medical ventilator systems project.", health="Green", customer_account_id=customers[3].id),
        Program(name="Tesla MegaCharger Rack", description="High-capacity charging grids components.", health="Red", customer_account_id=customers[4].id)
    ]
    db.add_all(programs)
    db.flush()

    # 4. Seed Projects (25 projects)
    # Schema: (name, current_stage, target_days_offset, status, priority, program_idx)
    project_defs = [
        # Acme Mobile G5 Series
        ("G5 Antenna Module Assembly", "NPI", 90, "Active", "High", 0),
        ("G5 Motherboard Assembly", "Mass_Prod", 30, "Completed", "Critical", 0),
        ("G5 Optical Camera Bracket", "Qual", 45, "Active", "Medium", 0),
        ("G5 Thermal Dispersion Plate", "Proto", 120, "Active", "Low", 0),
        ("G5 Display Glass Lamination", "R&D", 150, "On_Hold", "High", 0),
        
        # Apex Scout UAV Wing
        ("Scout Composite Wing Bracket", "Proto", 120, "Active", "High", 1),
        ("Scout Propulsion Rotor Mount", "Qual", 90, "On_Hold", "Medium", 1),
        ("Scout Carbon Fuselage Panel", "Mass_Prod", 15, "Completed", "High", 1),
        ("Scout Servo Actuator Harness", "NPI", 75, "Active", "Low", 1),
        ("Scout Telemetry Transceiver Case", "R&D", 200, "Cancelled", "Low", 1),
        
        # Chevron Turbine Safety Control
        ("Turbine Logic PLC Board", "Mass_Prod", 60, "Active", "Critical", 2),
        ("PLC Enclosure Casting", "Qual", 80, "Active", "High", 2),
        ("Turbine Pressure Sensor Unit", "NPI", 100, "Active", "Medium", 2),
        ("PLC Modbus Ethernet Adapter", "Proto", 140, "On_Hold", "Low", 2),
        ("Turbine Backup Power Relay", "R&D", 180, "Active", "Low", 2),
        
        # BioPharma Vent-3000
        ("Ventilator Pressure Valve Mount", "Qual", 40, "Active", "High", 3),
        ("Ventilator Main Processor PCB", "Mass_Prod", 10, "Completed", "Critical", 3),
        ("Ventilator Oxygen Sensor Probe", "NPI", 85, "Active", "Medium", 3),
        ("Ventilator Plastic Housing Shell", "Proto", 115, "Active", "Low", 3),
        ("Ventilator Touchscreen Glass", "R&D", 175, "On_Hold", "High", 3),
        
        # Tesla MegaCharger Rack
        ("MegaCharger Cooling Manifold", "Proto", 110, "Active", "Critical", 4),
        ("MegaCharger Power Connector Pin", "Qual", 70, "Active", "High", 4),
        ("MegaCharger Isolation Switch", "Mass_Prod", 25, "Completed", "Medium", 4),
        ("MegaCharger Grounding Busbar", "NPI", 85, "Active", "Low", 4),
        ("MegaCharger Smart Grid Controller", "R&D", 210, "Cancelled", "High", 4)
    ]

    seeded_projects = []
    for name, stage, offset, status, priority, prog_idx in project_defs:
        proj = Project(
            program_id=programs[prog_idx].id,
            name=name,
            current_stage=stage,
            target_date=date.today() + timedelta(days=offset),
            status=status,
            priority=priority
        )
        db.add(proj)
        seeded_projects.append(proj)
    
    db.flush()  # Generate Project IDs

    # 5. Seed Milestones & BOM parts dynamically for all 25 projects
    milestones = []
    boms = []
    stage_gates = []
    
    stages_order = ["R&D", "Proto", "NPI", "Qual", "Mass_Prod"]
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
    
    for i, proj in enumerate(seeded_projects):
        # Determine milestone statuses based on project status
        is_completed = proj.status == "Completed"
        is_on_hold = proj.status == "On_Hold"
        is_cancelled = proj.status == "Cancelled"
        
        # Milestone 1: Design Review
        m1_status = "Completed" if (is_completed or proj.current_stage in ["Proto", "NPI", "Qual", "Mass_Prod"]) else "In_Progress"
        if is_cancelled: m1_status = "Not_Started"
        m1_actual = date.today() - timedelta(days=40) if m1_status == "Completed" else None
        
        milestones.append(Milestone(
            project_id=proj.id,
            name="Design Freeze & Review",
            planned_date=date.today() - timedelta(days=45),
            actual_date=m1_actual,
            status=m1_status,
            critical_path=True
        ))

        # Milestone 2: Prototype Validation
        m2_status = "Not_Started"
        if is_completed or proj.current_stage in ["NPI", "Qual", "Mass_Prod"]:
            m2_status = "Completed"
        elif proj.current_stage == "Proto" and not is_on_hold and not is_cancelled:
            m2_status = "In_Progress"
        elif proj.current_stage == "Proto" and is_on_hold:
            m2_status = "Delayed"
            
        m2_actual = date.today() - timedelta(days=15) if m2_status == "Completed" else None

        milestones.append(Milestone(
            project_id=proj.id,
            name="Prototype Verification",
            planned_date=date.today() - timedelta(days=10),
            actual_date=m2_actual,
            status=m2_status,
            critical_path=True
        ))

        # Milestone 3: Production Release Audit
        m3_status = "Completed" if is_completed else ("In_Progress" if proj.current_stage == "Qual" else "Not_Started")
        m3_actual = date.today() - timedelta(days=2) if is_completed else None

        milestones.append(Milestone(
            project_id=proj.id,
            name="First Article Quality Audit",
            planned_date=date.today() + timedelta(days=15),
            actual_date=m3_actual,
            status=m3_status,
            critical_path=True
        ))

        # Seed BOM Parts
        part_prefix = f"PART-{100 + i}"
        boms.append(BOM(project_id=proj.id, part_number=f"{part_prefix}-A", description=f"Primary Core Housing for {proj.name}", revision="A", lifecycle_status="Active"))
        boms.append(BOM(project_id=proj.id, part_number=f"{part_prefix}-B", description=f"RF Interface Cable connector", revision="B", lifecycle_status="Active"))

        # Seed Stage Gate Checklist Items
        proj_stage_idx = stages_order.index(proj.current_stage) if proj.current_stage in stages_order else 0
        for stage, tasks in stage_gate_templates.items():
            stage_idx = stages_order.index(stage)
            for idx, task in enumerate(tasks):
                is_task_completed = stage_idx < proj_stage_idx
                # For current stage, complete the first task as an example
                if stage_idx == proj_stage_idx and idx == 0:
                    is_task_completed = True
                
                stage_gates.append(StageGateChecklist(
                    project_id=proj.id,
                    stage=stage,
                    task_name=task,
                    is_completed=is_task_completed
                ))

    db.add_all(milestones)
    db.add_all(boms)
    db.add_all(stage_gates)
    db.flush()

    # 6. Seed Production Lines
    lines = [
        ProductionLine(name="Line 1 - SMT Assembly", status="Running", oee=87.5, yield_rate=98.8, downtime_minutes=45),
        ProductionLine(name="Line 2 - Composite Wings", status="Running", oee=79.2, yield_rate=96.5, downtime_minutes=120),
        ProductionLine(name="Line 3 - PLC Assembly", status="Stopped", oee=65.0, yield_rate=94.2, downtime_minutes=360)
    ]
    db.add_all(lines)
    db.flush()

    # 7. Seed Machines inside lines
    machines = [
        # Line 1 SMT
        Machine(production_line_id=lines[0].id, name="SMT Pick & Place P1", type="SMT", status="Active"),
        Machine(production_line_id=lines[0].id, name="Reflow Oven R1", type="Reflow", status="Active"),
        Machine(production_line_id=lines[0].id, name="AOI Inspection A1", type="AOI", status="Active"),
        Machine(production_line_id=lines[0].id, name="Functional Tester F1", type="Functional_Test", status="Active"),
        # Line 2 Composite Wings
        Machine(production_line_id=lines[1].id, name="Carbon Fiber Cutter C2", type="Cutter", status="Active"),
        Machine(production_line_id=lines[1].id, name="Autoclave Oven O2", type="Oven", status="Active"),
        Machine(production_line_id=lines[1].id, name="Ultrasonic Layer Scanner U2", type="AOI", status="Active"),
        Machine(production_line_id=lines[1].id, name="Composite Trim Router T2", type="Functional_Test", status="Error", downtime_reason="Vacuum pressure drop under limits"),
        # Line 3 PLC Assembly
        Machine(production_line_id=lines[2].id, name="Component Dispenser D3", type="Dispenser", status="Offline", downtime_reason="Scheduled quarterly preventive calibration"),
        Machine(production_line_id=lines[2].id, name="Modbus Soldering Station S3", type="Soldering", status="Offline", downtime_reason="Downstream conveyor link blocked"),
        Machine(production_line_id=lines[2].id, name="Calibration Rig C3", type="AOI", status="Offline")
    ]
    db.add_all(machines)
    db.flush()

    # 8. Seed Shift Summaries (Last 7 days, 3 shifts per day)
    shift_names = ["Day Shift (A)", "Evening Shift (B)", "Night Shift (C)"]
    today_date = date.today()
    shift_summaries = []
    
    for day_offset in range(1, 8):
        current_date = today_date - timedelta(days=day_offset)
        for idx, shift in enumerate(shift_names):
            output = 450 + (day_offset * 12) + (idx * 25)
            defects = 5 + (day_offset % 3) + (idx * 3)
            downtime = 15 + (day_offset * 5) - (idx * 5)
            
            shift_summaries.append(ShiftSummary(
                shift_name=shift,
                date=current_date,
                output_units=output,
                defect_units=defects,
                downtime_minutes=downtime
            ))
    db.add_all(shift_summaries)
    db.flush()

    # 9. Seed 8 Work Orders (linked to project IDs)
    proj_acme_mb = seeded_projects[1]
    proj_acme_antenna = seeded_projects[0]
    proj_uav_wing = seeded_projects[5]
    proj_plc_board = seeded_projects[10]
    proj_vent_valve = seeded_projects[15]
    proj_charger_cool = seeded_projects[20]

    wo1 = WorkOrder(project_id=proj_acme_mb.id, work_order_number="WO-MB-2026-001", quantity_ordered=500, quantity_completed=480, status="Closed")
    wo2 = WorkOrder(project_id=proj_acme_mb.id, work_order_number="WO-MB-2026-002", quantity_ordered=1000, quantity_completed=350, status="In_Production")
    wo3 = WorkOrder(project_id=proj_acme_antenna.id, work_order_number="WO-ANT-2026-001", quantity_ordered=200, quantity_completed=198, status="Closed")
    wo4 = WorkOrder(project_id=proj_uav_wing.id, work_order_number="WO-COMP-2026-003", quantity_ordered=150, quantity_completed=120, status="In_Production")
    wo5 = WorkOrder(project_id=proj_uav_wing.id, work_order_number="WO-PROP-2026-004", quantity_ordered=300, quantity_completed=0, status="Released")
    wo6 = WorkOrder(project_id=proj_plc_board.id, work_order_number="WO-PLC-2026-005", quantity_ordered=600, quantity_completed=580, status="Closed")
    wo7 = WorkOrder(project_id=proj_vent_valve.id, work_order_number="WO-VALVE-2026-006", quantity_ordered=400, quantity_completed=250, status="In_Production")
    wo8 = WorkOrder(project_id=proj_charger_cool.id, work_order_number="WO-COOL-2026-007", quantity_ordered=250, quantity_completed=50, status="Paused")

    db.add_all([wo1, wo2, wo3, wo4, wo5, wo6, wo7, wo8])
    db.flush()

    # 7. Seed Station Telemetry (for WO2)
    now = datetime.now()
    telemetry = [
        StationTelemetry(work_order_id=wo2.id, station_name="AOI", parts_passed=370, parts_failed=12, recorded_at=now - timedelta(hours=3)),
        StationTelemetry(work_order_id=wo2.id, station_name="X-Ray", parts_passed=365, parts_failed=5, recorded_at=now - timedelta(hours=2)),
        StationTelemetry(work_order_id=wo2.id, station_name="Functional_Test", parts_passed=350, parts_failed=15, recorded_at=now - timedelta(hours=1))
    ]
    db.add_all(telemetry)

    # 8. Seed NCRs
    ncr1 = NCR(
        project_id=proj_acme_mb.id, 
        ncr_number="NCR-2026-001", 
        defect_description="Solder bridge detected under U2 SoC processor pin A12.", 
        defect_type="Solder_Bridge", 
        severity="Major", 
        priority="High",
        status="Under_RCA", 
        logged_by_user_id=quality_user.id,
        assigned_engineer_id=quality_user.id
    )
    ncr2 = NCR(
        project_id=seeded_projects[5].id,  # Scout Composite Wing Bracket
        ncr_number="NCR-2026-002", 
        defect_description="Delamination of carbon composite layers at mounting hole A.", 
        defect_type="Delamination", 
        severity="Critical", 
        priority="Critical",
        status="8D_Active", 
        logged_by_user_id=quality_user.id,
        assigned_engineer_id=quality_user.id
    )
    db.add(ncr1)
    db.add(ncr2)
    db.flush()

    # 9. Seed CAPA 8D
    capa1 = CAPA_8D(
        ncr_id=ncr2.id,
        containment_actions="All raw carbon-fiber sheets from Lot CF-900 quarantined. Production of bracket core suspended.",
        root_cause_5_why="1. Why did composite delaminate? High temperature void formation. \n2. Why was there a void? Moisture trapped in carbon prepreg sheet. \n3. Why was moisture trapped? Cleanroom humidity exceeded limits. \n4. Why did humidity exceed limits? Dehumidifier HVAC sensor failed. \n5. Why did HVAC sensor fail? Missing calibration schedule.",
        corrective_actions="Replace HVAC sensor, configure digital telemetry alert for cleanroom relative humidity, recalibrate all environmental systems.",
        preventive_actions="Integrate HVAC system monitoring into WMS dashboards. Add cleanroom humidity limits to standard shift sign-off.",
        effectiveness_verified=False,
        owner_id=quality_user.id,
        due_date=date.today() + timedelta(days=15),
        status="In_Progress"
    )
    db.add(capa1)

    # 13. Seed Inspections
    inspections = [
        Inspection(project_id=proj_acme_mb.id, inspector_id=quality_user.id, date=date.today() - timedelta(days=2), lot_size=200, sample_size=20, defects_found=0, status="Passed"),
        Inspection(project_id=proj_acme_mb.id, inspector_id=quality_user.id, date=date.today() - timedelta(days=1), lot_size=500, sample_size=50, defects_found=2, status="Passed"),
        Inspection(project_id=proj_acme_antenna.id, inspector_id=quality_user.id, date=date.today() - timedelta(days=3), lot_size=100, sample_size=10, defects_found=3, status="Failed"),
        Inspection(project_id=proj_uav_wing.id, inspector_id=quality_user.id, date=date.today() - timedelta(days=4), lot_size=50, sample_size=5, defects_found=0, status="Passed"),
        Inspection(project_id=proj_plc_board.id, inspector_id=quality_user.id, date=date.today() - timedelta(days=5), lot_size=150, sample_size=15, defects_found=1, status="Passed")
    ]
    db.add_all(inspections)

    # 14. Seed SPC Measurements
    spc_vals = [118.5, 121.2, 119.8, 122.0, 117.9, 123.5, 120.1, 119.4, 118.8, 122.5, 120.6, 119.9, 121.1, 118.0, 120.3]
    spc_measurements = []
    for idx, val in enumerate(spc_vals):
        spc_measurements.append(SPCMeasurement(
            parameter_name="Solder Paste Thickness (µm)",
            value=val,
            lcl=105.0,
            ucl=135.0,
            target=120.0,
            measured_at=datetime.now() - timedelta(hours=idx * 2)
        ))
    db.add_all(spc_measurements)

    # 15. Seed Audits
    audits = [
        Audit(audit_number="AUD-2026-001", auditor_name="ISO Certification Inc", audit_date=date.today() - timedelta(days=30), findings_count=2, status="Completed", score=94.5),
        Audit(audit_number="AUD-2026-002", auditor_name="Chevron Internal QA", audit_date=date.today() - timedelta(days=10), findings_count=0, status="Completed", score=100.0),
        Audit(audit_number="AUD-2026-003", auditor_name="Apex Aerospace Audit", audit_date=date.today() + timedelta(days=15), findings_count=0, status="Scheduled", score=0.0)
    ]
    db.add_all(audits)

    # 16. Seed Certifications
    certs = [
        Certification(name="ISO 9001:2015 Quality Management System", issuer="TUV SUD Certification", valid_until=date.today() + timedelta(days=365), status="Active"),
        Certification(name="AS9100D Aerospace Quality Standard", issuer="Aviation Registrar", valid_until=date.today() + timedelta(days=180), status="Active")
    ]
    db.add_all(certs)

    # 17. Seed Documents
    docs = [
        Document(title="SMT Reflow Oven Thermal Profile SOP", document_number="SOP-QA-001", type="SOP", revision="B", status="Approved", approved_by="Sarah Miller"),
        Document(title="Scout Composite UAV Wing Mount Drawing Specification", document_number="DWG-ME-502", type="Drawing", revision="A", status="Approved", approved_by="James Carter"),
            Document(title="Chevron safety valve calibration manual", document_number="SOP-QA-042", type="Quality Manual", revision="C", status="Approved", approved_by="Robert Chen"),
        Document(title="First article inspection template guidelines", document_number="SOP-QA-088", type="SOP", revision="A", status="Draft", approved_by=None)
    ]
    db.add_all(docs)

    # Get Service Engineer for RMA repair assignments
    service_user = db.query(User).filter(User.role == "Service_Engineer").first()

    # 10. Seed Warehouses
    wh1 = Warehouse(name="Main Production Warehouse SZ-1", location="Building A, Zone 2")
    wh2 = Warehouse(name="Raw Materials Buffer Stock SZ-2", location="Building B, Zone 1")
    db.add_all([wh1, wh2])
    db.flush()

    # 11. Seed Materials
    mat1 = Material(part_number="IC-STM32-042", name="STM32F407 32-bit ARM MCU", category="Chipsets", unit_of_measure="pcs", unit_price=4.50)
    mat2 = Material(part_number="CAP-CER-10U", name="10uF Ceramic Capacitor 0805", category="Passives", unit_of_measure="pcs", unit_price=0.08)
    mat3 = Material(part_number="PCB-ACME-MB-01", name="Acme Mobile G5 Mainboard PCB", category="PCBs", unit_of_measure="pcs", unit_price=15.00)
    mat4 = Material(part_number="RF-WIFI-BT-05", name="Wi-Fi 6 / Bluetooth 5.2 module", category="RF Modules", unit_of_measure="pcs", unit_price=3.20)
    db.add_all([mat1, mat2, mat3, mat4])
    db.flush()

    # 12. Seed Inventory
    inv1 = Inventory(material_id=mat1.id, warehouse_id=wh1.id, batch_lot_number="LOT-2026-MCU-01", available_stock=4800, reserved_stock=200, minimum_stock=500, reorder_level=800)
    inv2 = Inventory(material_id=mat2.id, warehouse_id=wh1.id, batch_lot_number="LOT-2026-CAP-12", available_stock=19000, reserved_stock=1000, minimum_stock=2000, reorder_level=3500)
    inv3 = Inventory(material_id=mat3.id, warehouse_id=wh1.id, batch_lot_number="LOT-2026-PCB-03", available_stock=1450, reserved_stock=50, minimum_stock=100, reorder_level=150)
    inv4 = Inventory(material_id=mat4.id, warehouse_id=wh2.id, batch_lot_number="LOT-2026-WIFI-08", available_stock=380, reserved_stock=20, minimum_stock=50, reorder_level=80)
    db.add_all([inv1, inv2, inv3, inv4])
    db.flush()

    # 13. Seed Suppliers
    supp1 = Supplier(name="Global Tech PCBs Inc", rating="A", on_time_delivery_rate=0.985, defect_rate_ppm=150.0, email="po@globaltechpcb.com", phone="+1-555-900-1122", contact_name="David Lin")
    supp2 = Supplier(name="Apex Fastener Foundry", rating="B", on_time_delivery_rate=0.942, defect_rate_ppm=420.0, email="sales@apexfasteners.com", phone="+1-555-333-4455", contact_name="Jenny Craig")
    supp3 = Supplier(name="Avnet Electronics Distribution", rating="A", on_time_delivery_rate=0.991, defect_rate_ppm=85.0, email="orders@avnet.com", phone="+1-800-555-0199", contact_name="Robert Croft")
    db.add_all([supp1, supp2, supp3])
    db.flush()

    # 14. Seed Purchase Orders
    po1 = PurchaseOrder(supplier_id=supp1.id, po_number="PO-2026-0098", status="Completed", order_date=date.today() - timedelta(days=45), delivery_date=date.today() - timedelta(days=5), approval_status="Approved", delivery_eta=date.today() - timedelta(days=5), priority="Medium", total_amount=7500.0)
    po2 = PurchaseOrder(supplier_id=supp2.id, po_number="PO-2026-0104", status="Shipped", order_date=date.today() - timedelta(days=10), delivery_date=None, approval_status="Approved", delivery_eta=date.today() + timedelta(days=4), priority="High", total_amount=3200.0)
    po3 = PurchaseOrder(supplier_id=supp3.id, po_number="PO-2026-0112", status="Issued", order_date=date.today() - timedelta(days=2), delivery_date=None, approval_status="Approved", delivery_eta=date.today() + timedelta(days=10), priority="Low", total_amount=12500.0)
    po4 = PurchaseOrder(supplier_id=supp1.id, po_number="PO-2026-0115", status="Issued", order_date=date.today(), delivery_date=None, approval_status="Pending_Approval", delivery_eta=date.today() + timedelta(days=12), priority="Medium", total_amount=4500.0)
    db.add_all([po1, po2, po3, po4])
    db.flush()

    # 15. Seed Shipments
    sh1 = Shipment(purchase_order_id=po2.id, carrier_name="DHL Express", tracking_number="DHL-900827162", status="In_Transit", transit_progress=75.0, eta=date.today() + timedelta(days=4))
    sh2 = Shipment(purchase_order_id=po3.id, carrier_name="FedEx Freight", tracking_number="FEDEX-71261528", status="Pending_Pickup", transit_progress=0.0, eta=date.today() + timedelta(days=10))
    db.add_all([sh1, sh2])

    # 16. Seed Incoming Inspections
    insp1 = IncomingInspection(purchase_order_id=po1.id, material_id=mat3.id, inspection_date=date.today() - timedelta(days=5), qty_received=500, qty_accepted=498, qty_rejected=2, defect_reason="PCB edge burr exceeding tolerances", inspector_name="Robert Chen", status="Passed")
    db.add(insp1)

    # 17. Seed Warranties
    w1 = Warranty(serial_number="SN-ACME-001", expiry_date=date.today() + timedelta(days=120), status="Active", claim_count=1)
    w2 = Warranty(serial_number="SN-ACME-002", expiry_date=date.today() + timedelta(days=240), status="Active", claim_count=0)
    w3 = Warranty(serial_number="SN-ACME-003", expiry_date=date.today() - timedelta(days=30), status="Expired", claim_count=2)
    w4 = Warranty(serial_number="SN-ACME-004", expiry_date=date.today() + timedelta(days=90), status="Active", claim_count=1)
    db.add_all([w1, w2, w3, w4])
    db.flush()

    # 18. Seed RMACases
    rma1 = RMACase(project_id=proj_acme_mb.id, rma_number="RMA-2026-0001", reason_code="Display connection RF noise", status="Completed", customer_name="John Doe", customer_email="john@acme.com", serial_number="SN-ACME-001", priority="Medium", created_at=date.today() - timedelta(days=15))
    rma2 = RMACase(project_id=proj_acme_mb.id, rma_number="RMA-2026-0002", reason_code="Battery drain under load", status="In_Triage", customer_name="Alice Smith", customer_email="alice@fastcorp.com", serial_number="SN-ACME-002", priority="High", created_at=date.today() - timedelta(days=3))
    rma3 = RMACase(project_id=proj_uav_wing.id, rma_number="RMA-2026-0003", reason_code="SMT Reflow soldering crack", status="Repairing", customer_name="Bob Vance", customer_email="bob@vancerefrigeration.com", serial_number="SN-ACME-004", priority="Critical", created_at=date.today() - timedelta(days=5))
    db.add_all([rma1, rma2, rma3])
    db.flush()

    # 19. Seed Repairs
    rep1 = Repair(rma_case_id=rma1.id, diagnostics="Found loose FPC connector header on mainboard assembly.", repair_action="Reflow solder connector header and apply silicone anchoring gel.", assigned_engineer_id=service_user.id, status="Completed", completion_date=date.today() - timedelta(days=5))
    rep2 = Repair(rma_case_id=rma3.id, diagnostics="Delaminated trace line on multilayer PCB layer 3.", repair_action="Mainboard core swap. Replaced serial identifier SN-ACME-004 to active unit.", assigned_engineer_id=service_user.id, status="In_Progress", completion_date=None)
    db.add_all([rep1, rep2])
    db.flush()

    # 20. Seed Spare Parts
    sp1 = SparePart(part_number="SP-ANT-01", name="Wi-Fi PCB antenna", stock=120, unit_price=1.50)
    sp2 = SparePart(part_number="SP-BAT-02", name="Replacement Li-Po battery pack", stock=45, unit_price=8.90)
    sp3 = SparePart(part_number="SP-DISP-03", name="Front display module assembly", stock=12, unit_price=24.50)
    db.add_all([sp1, sp2, sp3])
    db.flush()

    # 21. Seed Spare Part Requests
    spr1 = SparePartRequest(repair_id=rep2.id, spare_part_id=sp3.id, quantity_requested=1, status="Dispatched")
    db.add(spr1)

    # 22. Seed Complaints
    comp1 = Complaint(customer_name="Alice Smith", complaint_text="Battery dies after only 2 hours of continuous video telemetry stream.", root_cause="Substandard battery vendor batch lot BAT-500.", resolution="Recall lot and replace battery with upgraded pack.", status="Resolved", customer_feedback_score=4, logged_at=date.today() - timedelta(days=12))
    comp2 = Complaint(customer_name="Dave Miller", complaint_text="RMA response time took more than 5 business days during intake triage.", root_cause="Overloaded service department bottleneck.", resolution="Increased engineer allocation for triage queue.", status="Open", customer_feedback_score=None, logged_at=date.today() - timedelta(days=2))
    db.add_all([comp1, comp2])

    # 23. Seed Repair History
    hist1 = RepairHistory(repair_id=rep1.id, status="Pending_Diagnostics", comments="Received unit from customer intake", updated_at=datetime.utcnow() - timedelta(days=15))
    hist2 = RepairHistory(repair_id=rep1.id, status="Completed", comments="Repaired and tested FFP display signal output", updated_at=datetime.utcnow() - timedelta(days=5))
    hist3 = RepairHistory(repair_id=rep2.id, status="Pending_Diagnostics", comments="Composite bracket unit visual inspection", updated_at=datetime.utcnow() - timedelta(days=5))
    db.add_all([hist1, hist2, hist3])

    db.commit()
    print("Database seeding completed.")

if __name__ == "__main__":
    db_session = SessionLocal()
    try:
        seed_db(db_session)
    finally:
        db_session.close()
