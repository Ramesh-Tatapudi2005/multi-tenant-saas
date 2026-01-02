from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenantSubdomain: Optional[str] = None

class TenantRegister(BaseModel):
    tenantName: str
    subdomain: str
    adminEmail: EmailStr
    adminPassword: str
    adminFullName: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class TaskCreate(BaseModel):
    title: str
    projectId: int  # Mandatory for linking to a project
    description: Optional[str] = None
    priority: Optional[str] = "medium"

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None

class AuditLogResponse(BaseModel):
    id: int
    action: str
    details: Optional[str]
    created_at: datetime # Matches backend model

    class Config:
        from_attributes = True