# API Documentation

## Base URL

- **Local Development:** `http://localhost:5000/api`
- **Docker Environment:** `http://backend:5000/api`
- **Production:** `https://api.yourdomain.com/api`

## Authentication

### JWT Token
All protected endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Acquisition
See `/api/auth/login` endpoint below.

### Token Format
```javascript
{
  userId: "xxx-xxxx-xxxx-xxx",
  tenantId: "xxx-xxxx-xxxx-xxx",
  role: "super_admin|tenant_admin|user",
  iat: 1234567890,
  exp: 1234567890 + 86400  // 24 hours
}
```

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Permission denied, role check failed, limit exceeded |
| 404 | Not Found | Resource doesn't exist or belongs to different tenant |
| 409 | Conflict | Unique constraint violation (email/subdomain exists) |
| 500 | Server Error | Unexpected error on server |
| 503 | Service Unavailable | Database connection failed |

---

## Endpoints

### Authentication Endpoints

#### 1. Register Tenant (Create Organization)
```
POST /auth/register-tenant
```

**Description:** Register a new organization and create the tenant admin user.

**Authentication:** None (Public endpoint)

**Request Body:**
```javascript
{
  "tenantName": "Acme Corporation",
  "subdomain": "acme",
  "adminEmail": "admin@acme.com",
  "adminPassword": "SecurePassword123",
  "adminFullName": "Jane Smith"
}
```

**Request Validation:**
- `tenantName`: String, 3+ characters
- `subdomain`: String, alphanumeric, unique across system, 3+ characters
- `adminEmail`: Valid email format
- `adminPassword`: String, 8+ characters
- `adminFullName`: String, 2+ characters

**Response (201 Created):**
```javascript
{
  "success": true,
  "data": {
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "tenantName": "Acme Corporation",
    "subdomain": "acme",
    "subscriptionPlan": "free",
    "maxUsers": 5,
    "maxProjects": 3,
    "adminUser": {
      "userId": "a3c5b8f9-4d1e-4e8f-9b4c-5d8f9e1a4b3c",
      "email": "admin@acme.com",
      "fullName": "Jane Smith",
      "role": "tenant_admin"
    }
  }
}
```

**Error Responses:**
- **409 Conflict:** Subdomain or email already exists
- **400 Bad Request:** Validation failed (see field details)

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Acme",
    "subdomain": "acme",
    "adminEmail": "admin@acme.com",
    "adminPassword": "SecurePass123",
    "adminFullName": "Jane Smith"
  }'
```

---

#### 2. Login
```
POST /auth/login
```

**Description:** Authenticate user and receive JWT token.

**Authentication:** None (Public endpoint)

**Request Body:**
```javascript
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantSubdomain": "demo"
}
```

**Request Notes:**
- `tenantSubdomain` is optional for super_admin login (omit to access super_admin account)
- For regular users/tenant_admin, subdomain is required

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhM2M1YjhmOS00ZDFlLTRlOGYtOWI0Yy01ZDhmOWUxYTRiM2MiLCJ0ZW5hbnRJZCI6ImY0N2FjMTBiLTU4Y2MtNDM3Mi1hNTY3LTBlMDJiMmMzZDQ3OSIsInJvbGUiOiJ0ZW5hbnRfYWRtaW4iLCJpYXQiOjE2OTAzODMyOTAsImV4cCI6MTY5MDQ2OTY5MH0.aBcDeF...",
    "user": {
      "userId": "a3c5b8f9-4d1e-4e8f-9b4c-5d8f9e1a4b3c",
      "email": "admin@demo.com",
      "fullName": "Demo Admin",
      "role": "tenant_admin",
      "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    },
    "expiresIn": 86400
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid email or password
- **404 Not Found:** Tenant subdomain not found
- **403 Forbidden:** Tenant is suspended

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'
```

---

#### 3. Get Current User
```
GET /auth/me
```

**Description:** Get authenticated user's profile information.

**Authentication:** Required (JWT Token)

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "user": {
      "userId": "a3c5b8f9-4d1e-4e8f-9b4c-5d8f9e1a4b3c",
      "email": "admin@demo.com",
      "fullName": "Demo Admin",
      "role": "tenant_admin",
      "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tenant": {
      "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Demo Company",
      "subdomain": "demo",
      "status": "active",
      "subscriptionPlan": "pro",
      "maxUsers": 25,
      "maxProjects": 15
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid or expired token
- **404 Not Found:** User not found

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

#### 4. Logout
```
POST /auth/logout
```

**Description:** Logout user and log the action.

**Authentication:** Required (JWT Token)

**Request Body:** Empty

**Response (200 OK):**
```javascript
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token

**Notes:**
- Since API uses JWT (stateless), logout is informational
- Client must delete token from localStorage to be logged out
- Action is logged in audit_logs table for compliance

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Tenant Endpoints

#### 5. List All Tenants
```
GET /tenants
```

**Description:** Get list of all tenants (super_admin only).

**Authentication:** Required (JWT Token)

**Authorization:** `super_admin` only

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, max 100, default 10
- `status` (optional): Filter by status (active, suspended, trial)
- `subscriptionPlan` (optional): Filter by plan (free, pro, enterprise)

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "tenants": [
      {
        "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "name": "Demo Company",
        "subdomain": "demo",
        "status": "active",
        "subscriptionPlan": "pro",
        "maxUsers": 25,
        "maxProjects": 15,
        "totalUsers": 3,
        "totalProjects": 2,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid or expired token
- **403 Forbidden:** User is not super_admin

**Example cURL:**
```bash
curl -X GET "http://localhost:5000/api/tenants?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

#### 6. Get Tenant Details
```
GET /tenants/:tenantId
```

**Description:** Get specific tenant's details and statistics.

**Authentication:** Required (JWT Token)

**Authorization:** User belongs to tenant OR is super_admin

**URL Parameters:**
- `tenantId`: Tenant UUID

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Demo Company",
    "subdomain": "demo",
    "status": "active",
    "subscriptionPlan": "pro",
    "maxUsers": 25,
    "maxProjects": 15,
    "totalUsers": 3,
    "totalProjects": 2,
    "totalTasks": 5,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid or expired token
- **403 Forbidden:** User doesn't belong to this tenant
- **404 Not Found:** Tenant not found

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/tenants/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

#### 7. Update Tenant
```
PUT /tenants/:tenantId
```

**Description:** Update tenant details.

**Authentication:** Required (JWT Token)

**Authorization:** 
- `tenant_admin` of that tenant (can only update name)
- `super_admin` (can update all fields)

**URL Parameters:**
- `tenantId`: Tenant UUID

**Request Body:**
```javascript
{
  "name": "Acme Corporation",
  "status": "active",
  "subscriptionPlan": "enterprise",
  "maxUsers": 100,
  "maxProjects": 50
}
```

**Request Notes:**
- Tenant admins can only send: `name`
- Super admins can send: `name`, `status`, `subscriptionPlan`, `maxUsers`, `maxProjects`
- Omitted fields are not updated

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Acme Corporation",
    "subdomain": "demo",
    "status": "active",
    "subscriptionPlan": "enterprise",
    "maxUsers": 100,
    "maxProjects": 50,
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User not authorized, or tenant_admin attempted to update restricted fields
- **404 Not Found:** Tenant not found

**Example cURL:**
```bash
curl -X PUT http://localhost:5000/api/tenants/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{"name": "New Company Name"}'
```

---

### User Endpoints

#### 8. Add User to Tenant
```
POST /tenants/:tenantId/users
```

**Description:** Add new user to tenant.

**Authentication:** Required (JWT Token)

**Authorization:** `tenant_admin` of that tenant only

**URL Parameters:**
- `tenantId`: Tenant UUID

**Request Body:**
```javascript
{
  "email": "newuser@acme.com",
  "password": "SecurePass123",
  "fullName": "John Developer",
  "role": "user"
}
```

**Request Validation:**
- `email`: Valid email, unique within tenant
- `password`: String, 8+ characters
- `fullName`: String, 2+ characters
- `role`: "user" or "tenant_admin"

**Response (201 Created):**
```javascript
{
  "success": true,
  "data": {
    "userId": "b4b5c9g8-5e2f-5f9g-0c5d-6e9g0f2b5c4d",
    "email": "newuser@acme.com",
    "fullName": "John Developer",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User not tenant_admin OR user limit exceeded
- **404 Not Found:** Tenant not found
- **409 Conflict:** Email already exists in tenant

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/tenants/f47ac10b-58cc-4372-a567-0e02b2c3d479/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "email": "newuser@acme.com",
    "password": "SecurePass123",
    "fullName": "John Developer",
    "role": "user"
  }'
```

---

#### 9. List Tenant Users
```
GET /tenants/:tenantId/users
```

**Description:** Get list of users in tenant.

**Authentication:** Required (JWT Token)

**Authorization:** User belongs to tenant OR is super_admin

**URL Parameters:**
- `tenantId`: Tenant UUID

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, max 100, default 10
- `search` (optional): Search by name or email
- `role` (optional): Filter by role (user, tenant_admin)

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "a3c5b8f9-4d1e-4e8f-9b4c-5d8f9e1a4b3c",
        "email": "admin@demo.com",
        "fullName": "Demo Admin",
        "role": "tenant_admin",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "userId": "b4b5c9g8-5e2f-5f9g-0c5d-6e9g0f2b5c4d",
        "email": "user1@demo.com",
        "fullName": "User One",
        "role": "user",
        "isActive": true,
        "createdAt": "2024-01-15T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "pages": 1
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User doesn't belong to tenant
- **404 Not Found:** Tenant not found

**Example cURL:**
```bash
curl -X GET "http://localhost:5000/api/tenants/f47ac10b-58cc-4372-a567-0e02b2c3d479/users?search=user" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

#### 10. Update User
```
PUT /users/:userId
```

**Description:** Update user information.

**Authentication:** Required (JWT Token)

**Authorization:** 
- User updating self (limited fields)
- OR user's tenant_admin

**URL Parameters:**
- `userId`: User UUID

**Request Body:**
```javascript
{
  "fullName": "John Doe",
  "role": "tenant_admin",
  "isActive": true
}
```

**Request Notes:**
- Regular users can only update: `fullName`
- Tenant admins can update: `fullName`, `role`, `isActive`
- Super admins can update any field

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "userId": "a3c5b8f9-4d1e-4e8f-9b4c-5d8f9e1a4b3c",
    "email": "admin@demo.com",
    "fullName": "John Doe",
    "role": "tenant_admin",
    "isActive": true,
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User not authorized to update
- **404 Not Found:** User not found

**Example cURL:**
```bash
curl -X PUT http://localhost:5000/api/users/a3c5b8f9-4d1e-4e8f-9b4c-5d8f9e1a4b3c \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{"fullName": "John Doe"}'
```

---

#### 11. Delete User
```
DELETE /users/:userId
```

**Description:** Delete user from system.

**Authentication:** Required (JWT Token)

**Authorization:** `tenant_admin` of user's tenant only

**URL Parameters:**
- `userId`: User UUID

**Response (200 OK):**
```javascript
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User not tenant_admin OR attempting to delete self
- **404 Not Found:** User not found

**Notes:**
- User cannot delete self (403 error)
- All tasks assigned to this user are unassigned (assigned_to set to NULL)
- User's audit log entries remain for compliance

**Example cURL:**
```bash
curl -X DELETE http://localhost:5000/api/users/a3c5b8f9-4d1e-4e8f-9b4c-5d8f9e1a4b3c \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Project Endpoints

#### 12. Create Project
```
POST /projects
```

**Description:** Create new project.

**Authentication:** Required (JWT Token)

**Request Body:**
```javascript
{
  "name": "Website Redesign",
  "description": "Redesign company website",
  "status": "active"
}
```

**Request Validation:**
- `name`: String, 3+ characters
- `description`: String, optional
- `status`: "active", "archived", or "completed"

**Response (201 Created):**
```javascript
{
  "success": true,
  "data": {
    "projectId": "c5d6d0h9-6f3g-6g0h-1d6e-7f0h1g3c6d5e",
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Website Redesign",
    "description": "Redesign company website",
    "status": "active",
    "createdBy": "a3c5b8f9-4d1e-4e8f-9b4c-5d8f9e1a4b3c",
    "createdAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** Project limit exceeded for subscription plan

**Notes:**
- `tenantId` and `createdBy` extracted from JWT, never from request body
- Default status: "active" if not provided

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "Website Redesign",
    "description": "Redesign company website"
  }'
```

---

#### 13. List Projects
```
GET /projects
```

**Description:** Get list of projects for authenticated user's tenant.

**Authentication:** Required (JWT Token)

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, max 100, default 10
- `status` (optional): Filter by status
- `search` (optional): Search by project name

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "projects": [
      {
        "projectId": "c5d6d0h9-6f3g-6g0h-1d6e-7f0h1g3c6d5e",
        "name": "Website Redesign",
        "description": "Redesign company website",
        "status": "active",
        "createdBy": "John Doe",
        "taskCount": 3,
        "completedTaskCount": 1,
        "createdAt": "2024-01-20T14:22:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token

**Example cURL:**
```bash
curl -X GET "http://localhost:5000/api/projects?status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

#### 14. Update Project
```
PUT /projects/:projectId
```

**Description:** Update project details.

**Authentication:** Required (JWT Token)

**Authorization:** Project creator OR tenant_admin

**URL Parameters:**
- `projectId`: Project UUID

**Request Body:**
```javascript
{
  "name": "New Project Name",
  "description": "Updated description",
  "status": "archived"
}
```

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "projectId": "c5d6d0h9-6f3g-6g0h-1d6e-7f0h1g3c6d5e",
    "name": "New Project Name",
    "description": "Updated description",
    "status": "archived",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User not authorized
- **404 Not Found:** Project not found

**Example cURL:**
```bash
curl -X PUT http://localhost:5000/api/projects/c5d6d0h9-6f3g-6g0h-1d6e-7f0h1g3c6d5e \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{"status": "archived"}'
```

---

#### 15. Delete Project
```
DELETE /projects/:projectId
```

**Description:** Delete project (and all its tasks).

**Authentication:** Required (JWT Token)

**Authorization:** Project creator OR tenant_admin

**URL Parameters:**
- `projectId`: Project UUID

**Response (200 OK):**
```javascript
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User not authorized
- **404 Not Found:** Project not found

**Notes:**
- All tasks in project are deleted (CASCADE)
- Deletion is logged in audit_logs table

**Example cURL:**
```bash
curl -X DELETE http://localhost:5000/api/projects/c5d6d0h9-6f3g-6g0h-1d6e-7f0h1g3c6d5e \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Task Endpoints

#### 16. Create Task
```
POST /projects/:projectId/tasks
```

**Description:** Create new task in project.

**Authentication:** Required (JWT Token)

**URL Parameters:**
- `projectId`: Project UUID

**Request Body:**
```javascript
{
  "title": "Design homepage mockup",
  "description": "Create wireframe and design mockup",
  "priority": "high",
  "assignedTo": "b4b5c9g8-5e2f-5f9g-0c5d-6e9g0f2b5c4d",
  "dueDate": "2024-02-15"
}
```

**Request Validation:**
- `title`: String, 3+ characters
- `description`: String, optional
- `priority`: "low", "medium", or "high"
- `assignedTo`: UUID, optional, must belong to same tenant
- `dueDate`: ISO date format, optional

**Response (201 Created):**
```javascript
{
  "success": true,
  "data": {
    "taskId": "d6e7e1i0-7g4h-7h1i-2e7f-8g1i2h4d7e6f",
    "projectId": "c5d6d0h9-6f3g-6g0h-1d6e-7f0h1g3c6d5e",
    "title": "Design homepage mockup",
    "description": "Create wireframe and design mockup",
    "status": "todo",
    "priority": "high",
    "assignedTo": "John Developer",
    "dueDate": "2024-02-15",
    "createdAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **400 Bad Request:** Assigned user not in same tenant
- **404 Not Found:** Project not found

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/projects/c5d6d0h9-6f3g-6g0h-1d6e-7f0h1g3c6d5e/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "title": "Design homepage mockup",
    "priority": "high"
  }'
```

---

#### 17. List Tasks
```
GET /projects/:projectId/tasks
```

**Description:** Get list of tasks in project.

**Authentication:** Required (JWT Token)

**URL Parameters:**
- `projectId`: Project UUID

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, max 100, default 10
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `assignedTo` (optional): Filter by assigned user ID
- `search` (optional): Search by title

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "tasks": [
      {
        "taskId": "d6e7e1i0-7g4h-7h1i-2e7f-8g1i2h4d7e6f",
        "title": "Design homepage mockup",
        "description": "Create wireframe and design mockup",
        "status": "in_progress",
        "priority": "high",
        "assignedTo": "John Developer",
        "dueDate": "2024-02-15",
        "createdAt": "2024-01-20T14:22:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **404 Not Found:** Project not found

**Example cURL:**
```bash
curl -X GET "http://localhost:5000/api/projects/c5d6d0h9-6f3g-6g0h-1d6e-7f0h1g3c6d5e/tasks?status=in_progress" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

#### 18. Update Task Status
```
PATCH /tasks/:taskId/status
```

**Description:** Update task status (quick status change).

**Authentication:** Required (JWT Token)

**URL Parameters:**
- `taskId`: Task UUID

**Request Body:**
```javascript
{
  "status": "in_progress"
}
```

**Allowed Status Values:**
- "todo"
- "in_progress"
- "completed"

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "taskId": "d6e7e1i0-7g4h-7h1i-2e7f-8g1i2h4d7e6f",
    "status": "in_progress",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **403 Forbidden:** User not authorized
- **404 Not Found:** Task not found

**Example cURL:**
```bash
curl -X PATCH http://localhost:5000/api/tasks/d6e7e1i0-7g4h-7h1i-2e7f-8g1i2h4d7e6f/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{"status": "in_progress"}'
```

---

#### 19. Update Task
```
PUT /tasks/:taskId
```

**Description:** Update task details (full update with all fields).

**Authentication:** Required (JWT Token)

**URL Parameters:**
- `taskId`: Task UUID

**Request Body:**
```javascript
{
  "title": "Design and implement homepage",
  "description": "Create responsive homepage design",
  "status": "in_progress",
  "priority": "medium",
  "assignedTo": "b4b5c9g8-5e2f-5f9g-0c5d-6e9g0f2b5c4d",
  "dueDate": "2024-02-20"
}
```

**Response (200 OK):**
```javascript
{
  "success": true,
  "data": {
    "taskId": "d6e7e1i0-7g4h-7h1i-2e7f-8g1i2h4d7e6f",
    "title": "Design and implement homepage",
    "description": "Create responsive homepage design",
    "status": "in_progress",
    "priority": "medium",
    "assignedTo": "John Developer",
    "dueDate": "2024-02-20",
    "updatedAt": "2024-01-20T14:22:00Z"
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid token
- **400 Bad Request:** Assigned user not in same tenant
- **403 Forbidden:** User not authorized
- **404 Not Found:** Task not found

**Notes:**
- `assignedTo` can be set to null to unassign task
- Omitted fields are not updated

**Example cURL:**
```bash
curl -X PUT http://localhost:5000/api/tasks/d6e7e1i0-7g4h-7h1i-2e7f-8g1i2h4d7e6f \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "title": "Design and implement homepage",
    "priority": "medium",
    "status": "in_progress"
  }'
```

---

### Health Check

#### 20. Health Check
```
GET /health
```

**Description:** Check API and database health status.

**Authentication:** None (Public endpoint)

**Response (200 OK):**
```javascript
{
  "success": true,
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-20T14:22:00Z"
}
```

**Response (503 Service Unavailable - Database Error):**
```javascript
{
  "success": false,
  "status": "error",
  "database": "disconnected"
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:5000/api/health
```

**Usage:**
- Docker container health checks use this endpoint
- Load balancers use this to detect service availability
- Can be called without authentication

---

## Rate Limiting

Currently not implemented. Future versions may include:
- Per-user rate limiting (1000 requests/hour)
- Per-IP rate limiting for public endpoints
- Tenant-level rate limiting based on subscription

## Pagination

All list endpoints support pagination with these parameters:
- `page`: Page number (1-indexed), default 1
- `limit`: Results per page, default 10, max 100

Response includes pagination metadata:
```javascript
"pagination": {
  "page": 1,
  "limit": 10,
  "total": 25,
  "pages": 3
}
```

## Filtering & Searching

List endpoints support filtering and searching:
- `status`: Filter by status field
- `search`: Full-text search in name/title/description fields
- `role`: Filter users by role
- `subscriptionPlan`: Filter tenants by plan

## Common Request/Response Patterns

### Datetime Format
All datetime fields use ISO 8601 format:
```
2024-01-20T14:22:00Z
```

### Pagination Example
```bash
GET /api/projects?page=2&limit=20
```

### Filtering Example
```bash
GET /api/tenants?status=active&subscriptionPlan=pro
```

### Search Example
```bash
GET /api/users?search=john
```

---

## Test Credentials

Use these credentials to test the API:

**Super Admin:**
```
Email: superadmin@system.com
Password: Admin@123
Subdomain: (leave empty for super admin login)
```

**Tenant Admin (Demo Company):**
```
Email: admin@demo.com
Password: Demo@123
Subdomain: demo
```

**Regular User (Demo Company):**
```
Email: user1@demo.com
Password: User@123
Subdomain: demo
```

---

## Troubleshooting API Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Get new token via /auth/login |
| 403 Forbidden | Missing permission | Check user role and tenant membership |
| 404 Not Found | Resource doesn't exist or belongs to another tenant | Verify resource ID and tenant |
| 409 Conflict | Email/subdomain already exists | Use unique value |
| 400 Bad Request | Validation error | Check request body format and required fields |

---

## API Endpoint Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | /auth/register-tenant | Register new organization |
| 2 | POST | /auth/login | Login and get JWT token |
| 3 | GET | /auth/me | Get current user profile |
| 4 | POST | /auth/logout | Logout user |
| 5 | GET | /tenants | List all tenants (super admin only) |
| 6 | GET | /tenants/:id | Get tenant details |
| 7 | PUT | /tenants/:id | Update tenant |
| 8 | POST | /tenants/:id/users | Add user to tenant |
| 9 | GET | /tenants/:id/users | List tenant users |
| 10 | PUT | /users/:id | Update user |
| 11 | DELETE | /users/:id | Delete user |
| 12 | POST | /projects | Create project |
| 13 | GET | /projects | List projects |
| 14 | PUT | /projects/:id | Update project |
| 15 | DELETE | /projects/:id | Delete project |
| 16 | POST | /projects/:id/tasks | Create task |
| 17 | GET | /projects/:id/tasks | List tasks |
| 18 | PATCH | /tasks/:id/status | Update task status |
| 19 | PUT | /tasks/:id | Update task |
| 20 | GET | /health | Health check |

**Total: 20 endpoints including health check**
