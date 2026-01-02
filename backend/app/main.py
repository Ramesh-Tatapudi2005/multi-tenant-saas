from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, auth, database
from typing import List

# Creates tables based on models.py definitions
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper for logging actions
def log_action(db: Session, tenant_id: str, user_id: int, action: str, entity_type: str, entity_id: str, details: str = "N/A"):
    new_log = models.AuditLog(
        tenant_id=tenant_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(new_log)
    db.commit()

@app.post("/api/auth/login")
def login(request: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email.lower()).first()
    if not user or not auth.verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth.create_access_token({"userId": user.id, "tenantId": user.tenant_id, "role": user.role})
    
    # Detailed login log for Super Admin monitoring
    log_detail = f"User {user.email} logged into tenant {request.tenantSubdomain or 'System'}"
    log_action(db, user.tenant_id, user.id, "LOGIN", "user", str(user.id), log_detail)
    
    return {
        "success": True, 
        "data": {"token": token, "user": {"email": user.email, "role": user.role, "tenantId": user.tenant_id}}
    }

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "super_admin":
        # Super Admin sees ALL login events globally
        logs = db.query(models.AuditLog).filter(models.AuditLog.action == "LOGIN").order_by(models.AuditLog.created_at.desc()).all()
    else:
        # Tenant Admin sees their specific activity stream
        logs = db.query(models.AuditLog).filter(models.AuditLog.tenant_id == current_user.tenant_id).order_by(models.AuditLog.created_at.desc()).all()
    return {"success": True, "data": {"logs": logs}}

# @app.get("/api/projects")
# def list_projects(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
#     if current_user.role == "super_admin":
#         return {"success": True, "data": {"projects": db.query(models.Project).all()}}
#     projects = db.query(models.Project).filter(models.Project.tenant_id == current_user.tenant_id).all()
#     return {"success": True, "data": {"projects": projects}}

@app.get("/api/projects")
def list_projects(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "super_admin":
        # Super Admin sees ALL projects and their tasks globally
        projects = db.query(models.Project).all()
    else:
        # Tenant Admin only sees their own
        projects = db.query(models.Project).filter(models.Project.tenant_id == current_user.tenant_id).all()
    
    # Ensure the task data is included in the dictionary response
    result = []
    for p in projects:
        p_data = {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "tenant_id": p.tenant_id,
            "tasks": [{"id": t.id, "title": t.title, "status": t.status} for t in p.tasks]
        }
        result.append(p_data)
        
    return {"success": True, "data": {"projects": result}}

@app.post("/api/projects", status_code=201)
def create_project(request: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admins are read-only.")
    new_p = models.Project(name=request.name, description=request.description, tenant_id=current_user.tenant_id)
    db.add(new_p); db.commit(); db.refresh(new_p)
    log_action(db, current_user.tenant_id, current_user.id, "CREATE_PROJECT", "project", str(new_p.id), f"Project {new_p.name} created")
    return {"success": True, "data": new_p}

# @app.post("/api/tasks")
# def create_task(request: schemas.TaskCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
#     if current_user.role == "super_admin":
#         raise HTTPException(status_code=403, detail="Super Admins cannot create tasks.")
#     new_t = models.Task(project_id=request.projectId, tenant_id=current_user.tenant_id, title=request.title, status="pending")
#     db.add(new_t); db.commit(); db.refresh(new_t)
#     log_action(db, current_user.tenant_id, current_user.id, "CREATE_TASK", "task", str(new_t.id), f"Task {new_t.title} added")
#     return {"success": True, "data": new_t}

# backend/app/main.py

@app.delete("/api/projects/{pid}")
def delete_project(pid: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Restrict deletion to Tenant Admins only
    if current_user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admins cannot delete projects.")
    
    # Ensure the project exists and belongs to the user's tenant
    p = db.query(models.Project).filter(
        models.Project.id == pid, 
        models.Project.tenant_id == current_user.tenant_id
    ).first()
    
    if not p:
        # This is where your 404 is coming from if the ID doesn't match
        raise HTTPException(status_code=404, detail="Project not found")
        
    db.delete(p)
    db.commit()
    log_action(db, current_user.tenant_id, current_user.id, "DELETE_PROJECT", "project", str(pid), f"Deleted project {p.name}")
    return {"success": True}

# --- TASK MANAGEMENT ENDPOINTS ---

@app.post("/api/tasks")
def create_task(request: schemas.TaskCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Super Admins are restricted from creating tasks
    if current_user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admins cannot create tasks.")
    
    # Verify the project exists and belongs to the user's tenant
    project = db.query(models.Project).filter(
        models.Project.id == request.projectId, 
        models.Project.tenant_id == current_user.tenant_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_task = models.Task(
        project_id=request.projectId,
        tenant_id=current_user.tenant_id,
        title=request.title,
        status="pending"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # Log the action for audit
    log_action(db, current_user.tenant_id, current_user.id, "CREATE_TASK", "task", str(new_task.id), f"Added task: {new_task.title}")
    
    return {"success": True, "data": new_task}

@app.patch("/api/tasks/{tid}")
def update_task_status(tid: int, request: schemas.TaskUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify the task belongs to the user's tenant
    task = db.query(models.Task).filter(
        models.Task.id == tid, 
        models.Task.tenant_id == current_user.tenant_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admins cannot update tasks.")

    task.status = request.status
    db.commit()
    
    log_action(db, current_user.tenant_id, current_user.id, "UPDATE_TASK", "task", str(tid), f"Status changed to {request.status}")
    return {"success": True}

@app.delete("/api/tasks/{tid}")
def delete_task(tid: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(
        models.Task.id == tid, 
        models.Task.tenant_id == current_user.tenant_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admins cannot delete tasks.")

    db.delete(task)
    db.commit()
    
    log_action(db, current_user.tenant_id, current_user.id, "DELETE_TASK", "task", str(tid), "Task removed")
    return {"success": True}