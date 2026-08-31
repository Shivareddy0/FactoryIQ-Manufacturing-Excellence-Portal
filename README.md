# 🏭 FactoryIQ – Manufacturing Excellence Portal

An enterprise-grade Manufacturing Execution & Operations Management platform built using **React**, **FastAPI**, and **SQLAlchemy**.

FactoryIQ provides end-to-end visibility across the complete manufacturing lifecycle, including Project Management, Production Monitoring, Quality Management, Supply Chain, and After-Sales support.

---

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based Authentication
- Role-Based Access Control (RBAC)
- Protected Routes
- Dynamic Role Switching (Demo Mode)

### 📊 Executive Dashboard
- Real-time KPIs
- Program Health Overview
- Project Lifecycle Analytics
- Production & Quality Metrics
- Interactive Charts

### 📁 Project Management
- Program Portfolio
- Project Lifecycle Tracking
- Milestone Management
- Stage Gate Checklist
- Gantt Timeline
- BOM (Bill of Materials) Explorer

### 🏭 Production Visibility *(In Progress)*
- Work Order Management
- Production Dashboard
- WIP Tracking
- OEE Monitoring
- Machine Status
- Live Production Analytics

### ✅ Quality Management *(In Progress)*
- NCR Management
- CAPA (Corrective & Preventive Action)
- 8D Root Cause Analysis
- SPC Control Charts
- Pareto Analysis
- Quality Dashboard

### 📦 Supply Chain *(In Progress)*
- Supplier Management
- Purchase Orders
- Inventory Tracking
- Supplier Scorecards
- Shipment Monitoring

### 🔧 After-Sales *(In Progress)*
- Warranty Management
- RMA Tracking
- Repair Workflow
- Service Dashboard

---

# 🛠️ Technology Stack

## Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- Lucide Icons

## Backend
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT Authentication
- Bcrypt

---

# 🏗️ System Architecture

```
React (Frontend)
        │
        ▼
Axios API Client
        │
        ▼
FastAPI Backend
        │
        ▼
SQLAlchemy ORM
        │
        ▼
SQLite Database
```

---

# 📂 Project Structure

```
FactoryIQ-Manufacturing-Excellence-Portal
│
├── backend
│   ├── app
│   │   ├── api
│   │   ├── core
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   └── main.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── features
│   │   ├── routes
│   │   ├── services
│   │   ├── context
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

---

# 👥 User Roles

- Administrator
- Project Manager
- Production Planner
- Quality Engineer
- Supply Chain Manager
- Customer Representative

Each role has dedicated dashboards and access permissions.

---


# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Shivareddy0/FactoryIQ-Manufacturing-Excellence-Portal.git
```

---

## Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend runs at

```
http://localhost:8000
```

Swagger API

```
http://localhost:8000/docs
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# 📸 Screenshots

### Login Page

<img width="1890" height="901" alt="image" src="https://github.com/user-attachments/assets/1d347886-47a4-4220-bc22-860558377b2b" />


---

### Executive Dashboard

<img width="1916" height="907" alt="image" src="https://github.com/user-attachments/assets/667939bb-b0fd-4764-bb22-2a85d6c340e3" />


---

### Project Management

<img width="1911" height="905" alt="image" src="https://github.com/user-attachments/assets/93c25dcb-c571-486a-a726-ac956578c96e" />


---

### Production Dashboard

<img width="1911" height="902" alt="image" src="https://github.com/user-attachments/assets/a911b8c1-809d-4368-af1b-cef5c7f24a80" />


---

### Quality Dashboard

<img width="1913" height="903" alt="image" src="https://github.com/user-attachments/assets/87dafa21-4775-4ca3-8263-2816855cea3a" />


---

# 🔐 Authentication Flow

```
User Login
      │
      ▼
JWT Authentication
      │
      ▼
Role Validation
      │
      ▼
Dashboard Access
```

---

# 📈 Future Enhancements

- Real-Time WebSocket Updates
- AI-based Predictive Analytics
- Notification System
- Report Export (PDF / Excel)
- PostgreSQL Deployment
- Docker Support
- CI/CD Pipeline
- Cloud Deployment

---

# 🎯 Project Highlights

- Enterprise Architecture
- Modular Design
- REST APIs
- JWT Authentication
- Role-Based Access
- Interactive Dashboards
- Modern UI
- Manufacturing Domain Simulation

---

# 👨‍💻 Author

**Shiva Reddy**

GitHub: https://github.com/Shivareddy0

---

## ⭐ If you found this project useful, please consider giving it a star!
