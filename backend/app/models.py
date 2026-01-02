from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True) 
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) 
    tenant_id = Column(String)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String, nullable=True)
    tenant_id = Column(String)
    # Added relationship to easily load tasks for each project
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id")) 
    tenant_id = Column(String)
    title = Column(String)
    status = Column(String, default="pending") # pending, completed
    project = relationship("Project", back_populates="tasks")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id")) 
    action = Column(String) 
    entity_type = Column(String)
    entity_id = Column(String)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)