from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import datetime

# 1. ADDED: Missing Tenant Model
class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subdomain = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="active")
    subscription_plan = Column(String, default="pro")
    
    # ADD THESE TWO LINES
    max_users = Column(Integer, default=10)
    max_projects = Column(Integer, default=5)
    
    users = relationship("User", back_populates="tenant")
    projects = relationship("Project", back_populates="tenant")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True) 
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, nullable=False) # super_admin, tenant_admin, user
    
    # FIXED: Changed String to Integer to match Tenant.id
    # Set nullable=True so Super Admin doesn't need a tenant
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # ADD THESE COLUMNS
    status = Column(String, default="active") # active, completed, archived
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    
    # ADD THESE THREE COLUMNS
    description = Column(String, nullable=True)
    priority = Column(String, default="medium") # low, medium, high
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    status = Column(String, default="pending") 
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="tasks")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False) 
    entity_type = Column(String)
    entity_id = Column(String)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")