# API Documentation

## Authentication

### Login
* **Endpoint:** `POST /api/auth/login`
* **Body:** `{ "email": "admin@demo.com", "password": "password123", "tenantSubdomain": "demo" }`
* **Response:** `{ "success": true, "token": "eyJhbGci...", "user": { "id": 1, "email": "admin@demo.com", "role": "tenant_admin", "tenantId": "demo-tenant-id" } }`

---

## Projects

### Get All Projects
* **Endpoint:** `GET /api/projects`
* **Headers:** `Authorization: Bearer <token>`
* **Description:** Retrieves all projects for the authenticated tenant. Super admins see all projects globally.
* **Response:** `{ "success": true, "data": { "projects": [ { "id": 1, "name": "Project1", "tasks": [...] } ] } }`

### Create Project (Tenant Admin Only)
* **Endpoint:** `POST /api/projects`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "name": "New Website", "description": "Redesign project" }`
* **Response:** `{ "success": true, "data": { "id": 2, "name": "New Website", "tenant_id": "..." } }`

---

## Tasks

### Create Task (Tenant Admin Only)
* **Endpoint:** `POST /api/tasks`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "projectId": 1, "title": "Fix Header" }`
* **Note:** `projectId` must be an **Integer** to match the database schema.
* **Response:** `{ "success": true, "data": { "id": 10, "title": "Fix Header", "status": "pending" } }`

### Update Task Status (Tenant Admin Only)
* **Endpoint:** `PATCH /api/tasks/:taskId`
* **Headers:** `Authorization: Bearer <token>`
* **Body:** `{ "status": "completed" }`
* **Description:** Toggles task status between "pending" and "completed".
* **Response:** `{ "success": true }`

### Delete Task (Tenant Admin Only)
* **Endpoint:** `DELETE /api/tasks/:taskId`
* **Headers:** `Authorization: Bearer <token>`
* **Response:** `{ "success": true }`

---

## Monitoring (Admin & Super Admin)

### Get Audit Logs
* **Endpoint:** `GET /api/audit-logs`
* **Headers:** `Authorization: Bearer <token>`
* **Description:** Retrieves activity logs filtered by tenant. Super admins see global system logs.
* **Response:** `{ "success": true, "data": { "logs": [ { "action": "CREATE_TASK", "details": "Added task: Fix Header", "created_at": "..." } ] } }`