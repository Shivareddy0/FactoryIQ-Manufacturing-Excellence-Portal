import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class CustomerAccount(Base):
    __tablename__ = "customer_accounts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    industry = Column(String(100))
    
    users = relationship("User", back_populates="customer_account")
    programs = relationship("Program", back_populates="customer_account")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # Admin, Prod_Planner, Quality_Eng, SC_Manager, Project_Mgr, Customer_Rep
    is_active = Column(Boolean, default=True)
    customer_account_id = Column(String(36), ForeignKey("customer_accounts.id"), nullable=True)
    
    customer_account = relationship("CustomerAccount", back_populates="users")
