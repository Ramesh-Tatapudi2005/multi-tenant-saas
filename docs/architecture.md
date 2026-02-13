# Architecture Document

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    HTTPS/HTTP Requests
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     React Frontend SPA                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Auth Context     │ Pages          │ Services            │  │
│  │ ├─ User State    │ ├─ Register    │ ├─ API Service      │  │
│  │ ├─ Login         │ ├─ Login       │ ├─ Auth API         │  │
│  │ └─ Logout        │ ├─ Dashboard   │ └─ Tenant API       │  │
│  │                  │ ├─ Projects    │                     │  │
│  │ Protected Route  │ ├─ Users       │ Local Storage:      │  │
│  │ ├─ Check Auth    │ └─ Tenants     │ ├─ JWT Token        │  │
│  │ └─ Redirect      │                │ └─ User Data        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    API Requests (JSON)
                    Authorization Header
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  Node.js Express Backend                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Routes           │ Controllers     │ Middleware          │  │
│  │ ├─ /auth         │ ├─ Auth         │ ├─ Auth Token       │  │
│  │ ├─ /tenants      │ ├─ Tenant       │ ├─ Role Check       │  │
│  │ ├─ /projects     │ ├─ User         │ ├─ Validation       │  │
│  │ └─ /tasks        │ ├─ Project      │ └─ Error Handler    │  │
│  │                  │ └─ Task         │                     │  │
│  │ Models           │ Utils           │ Services            │  │
│  │ ├─ User          │ ├─ Password     │ ├─ Audit Logging    │  │
│  │ ├─ Tenant        │ ├─ Validation   │ └─ JWT Generation   │  │
│  │ ├─ Project       │ └─ Audit        │                     │  │
│  │ └─ Task          │                 │ CORS:               │  │
│  │                  │                 │ Allow: frontend:3000│  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    SQL Queries (Parameterized)
                    Connection Pooling
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              PostgreSQL Database (Port 5432)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tables:         Indexes:        Views:       Constraints:  │
│  │ ├─ tenants      ├─ tenant_id     │ (future)  │ FK: Cascade │
│  │ ├─ users        ├─ email         │           │ UK: tenant_id,email
│  │ ├─ projects     ├─ role          │           │ UK: subdomain
│  │ ├─ tasks        ├─ status        │           │ NOT NULL    │
│  │ └─ audit_logs   └─ created_at    │           │             │
│  │                                  │           │ Constraints:│
│  │ Replication: Read Replicas      │           │ CASCADE DEL │
│  │ Backup: Daily snapshots         │           │ SET NULL    │
│  │ Connection Pool: Max 20 connections         │             │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Authentication Flow
```
1. POST /auth/login {email, password, subdomain}
2. Backend queries: SELECT * FROM users WHERE email=$1 AND tenant_id=$2
3. Verify password: bcrypt.compare(provided_password, stored_hash)
4. Generate JWT: jwt.sign({userId, tenantId, role}, JWT_SECRET)
5. Return: {token, user}
6. Frontend stores token in localStorage
7. Frontend includes in header: Authorization: Bearer <token>
```

### Protected Request Flow
```
1. GET /api/projects (with Authorization header)
2. Middleware: authenticateToken() validates JWT
3. Extract: req.user = {userId, tenantId, role} from token
4. Route handler executes
5. Controller queries: SELECT * FROM projects WHERE tenant_id=$1
6. Return filtered data to user
```

### Create Resource Flow
```
1. POST /api/projects {name, description}
2. Validate input (Joi schema)
3. Check: user's tenantId from token
4. Check: project count < max_projects from tenants table
5. CREATE project with tenant_id from token (not from request body)
6. INSERT into audit_logs: {tenant_id, user_id, action:'CREATE_PROJECT', ...}
7. Return created project
```

## Database ERD (Entity Relationship Diagram)

```
┌──────────────────┐
│    tenants       │
├──────────────────┤
│ id (UUID) [PK]   │
│ name             │
│ subdomain [UK]   │──────┐
│ status           │      │ 1..* (Has Many)
│ subscription_    │      │
│ plan             │      │
│ max_users        │      │ FK: Foreign Key
│ max_projects     │      │ UK: Unique Key
│ created_at       │      │ PK: Primary Key
│ updated_at       │      │
└──────────────────┘      │
                          │
    ┌─────────────────────┴─────────────────────┐
    │                                           │
    │ 1:*                              1:*      │
    │                                          │
┌───▼──────────────┐              ┌──────────────────┐
│     users        │              │    projects      │
├──────────────────┤              ├──────────────────┤
│ id (UUID) [PK]   │              │ id (UUID) [PK]   │
│ tenant_id [FK]   │              │ tenant_id [FK]   │
│ email            │              │ name             │
│ password_hash    │              │ description      │
│ full_name        │              │ status           │
│ role             │              │ created_by [FK]  │──┐
│ is_active        │              │ created_at       │  │
│ created_at       │              │ updated_at       │  │
│ updated_at       │              └──────────────────┘  │
│                  │                        │ 1:*       │
│ [UK] (tenant_id, │                        │           │
│      email)      │                        │    ┌──────┘
└──────────────────┘                        │    │
        │                                   │    │
        │ 0:1                               │    │
        │ (assigned to)                     │    │
        └───────────────────┬───────────────┘    │
                            │                    │
                    ┌───────▼────────────┐      │
                    │      tasks         │      │
                    ├────────────────────┤      │
                    │ id (UUID) [PK]     │      │
                    │ project_id [FK]    │◄─────┘
                    │ tenant_id [FK]     │
                    │ title              │
                    │ description        │
                    │ status             │
                    │ priority           │
                    │ assigned_to [FK]   │
                    │ due_date           │
                    │ created_at         │
                    │ updated_at         │
                    └────────────────────┘
                            │ 1:*
                            │
                    ┌───────▼──────────────┐
                    │   audit_logs         │
                    ├──────────────────────┤
                    │ id (UUID) [PK]       │
                    │ tenant_id [FK]       │
                    │ user_id [FK, NK]     │
                    │ action               │
                    │ entity_type          │
                    │ entity_id            │
                    │ ip_address           │
                    │ created_at           │
                    └──────────────────────┘
```

## API Architecture

All endpoints follow REST principles with consistent response format:

### Response Format
```javascript
// Success
{
  success: true,
  data: { /* payload */ },
  message: "Optional success message"
}

// Error
{
  success: false,
  message: "Error description"
}
```

### Endpoint Categories

#### Authentication (4 endpoints)
- POST /api/auth/register-tenant
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

#### Tenants (3 endpoints)
- GET /api/tenants (super admin only)
- GET /api/tenants/:tenantId
- PUT /api/tenants/:tenantId

#### Users (4 endpoints)
- POST /api/tenants/:tenantId/users (tenant admin only)
- GET /api/tenants/:tenantId/users
- PUT /api/users/:userId
- DELETE /api/users/:userId (tenant admin only)

#### Projects (4 endpoints)
- POST /api/projects
- GET /api/projects
- PUT /api/projects/:projectId
- DELETE /api/projects/:projectId

#### Tasks (4 endpoints)
- POST /api/projects/:projectId/tasks
- GET /api/projects/:projectId/tasks
- PATCH /api/tasks/:taskId/status
- PUT /api/tasks/:taskId

#### Health (1 endpoint)
- GET /api/health

**Total: 19 Endpoints**

## Deployment Architecture

### Docker Containers
```
┌─────────────────────────────────────────────┐
│         Docker Compose Network              │
│                                             │
│  ┌─────────────┐  ┌──────────┐  ┌────────┐ │
│  │  database   │  │ backend  │  │frontend│ │
│  │ (postgres)  │  │(node.js) │  │(react) │ │
│  │  :5432      │  │  :5000   │  │ :3000  │ │
│  └──────┬──────┘  └────┬─────┘  └──┬─────┘ │
│         │              │           │       │
│         └──────────────┼───────────┘       │
│                        └─ internal network│
│                        (service names)    │
└─────────────────────────────────────────────┘
         │              │              │
         │ 5432         │ 5000         │ 3000
         ▼              ▼              ▼
    Host Network  Host Network   Host Network
```

### Environment Variables
```
Database:
- DB_HOST=database (service name)
- DB_PORT=5432
- DB_NAME=saas_db
- DB_USER=postgres
- DB_PASSWORD=postgres

Backend:
- PORT=5000
- NODE_ENV=production
- JWT_SECRET=<min 32 chars>
- FRONTEND_URL=http://frontend:3000

Frontend:
- REACT_APP_API_URL=http://backend:5000/api
```

## Scalability Considerations

### Vertical Scaling
- Add more resources to single database
- Optimize queries with indexes
- Use connection pooling

### Horizontal Scaling (Future)
- Add backend replicas behind load balancer
- Use read replicas for database
- Implement caching layer (Redis)
- Separate microservices (users, projects, tasks)

### Multi-Tenancy Scaling
- This architecture supports 10,000+ tenants
- Single database can handle millions of rows
- Tenant-based partitioning possible at 100k+ users

## High Availability

- Database: Daily backups, write-ahead logging
- Backend: Stateless design allows redundancy
- Frontend: CDN delivery for static assets
- Monitoring: Health check endpoints for automated failure detection
