# Technical Specification Document

## Project Overview

**Multi-Tenant SaaS Platform** - A production-ready application enabling organizations to register, manage teams, and track projects/tasks with complete data isolation and role-based access control.

**Project Purpose:** Demonstrate full-stack development capabilities including database design, API development, frontend implementation, containerization, and DevOps practices.

## Technology Stack

### Backend
- **Runtime:** Node.js 18 (LTS)
- **Web Framework:** Express.js 4.x
- **Database:** PostgreSQL 15
- **Authentication:** JWT (jsonwebtoken)
- **Password Security:** bcryptjs
- **Input Validation:** Joi
- **Database Driver:** pg (node-postgres)
- **CORS:** cors middleware
- **Environment:** dotenv

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** React Context API
- **Styling:** CSS3 (Responsive Design)
- **Build Tool:** Create React App

### DevOps & Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Database:** PostgreSQL 15 (Official Docker Image)
- **Network:** Docker compose network (saas-network)
- **Volumes:** Named volume (db_data) for data persistence

### Development Tools
- **Package Managers:** npm
- **Version Control:** Git
- **Code Repository:** GitHub

## Project Structure

```
multi-tenant-saas/
├── backend/
│   ├── database/
│   │   ├── migrations/          # Database schema
│   │   │   ├── 001_create_tenants.sql
│   │   │   ├── 002_create_users.sql
│   │   │   ├── 003_create_projects.sql
│   │   │   ├── 004_create_tasks.sql
│   │   │   └── 005_create_audit_logs.sql
│   │   └── seeds/               # Test data
│   │       └── seed_data.sql
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL connection pool
│   │   ├── controllers/         # Business logic
│   │   │   ├── authController.js
│   │   │   ├── tenantController.js
│   │   │   ├── userController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── healthController.js
│   │   ├── middleware/          # Request processing
│   │   │   └── auth.js          # Authentication & Authorization
│   │   ├── routes/              # API endpoints
│   │   │   ├── authRoutes.js
│   │   │   ├── tenantRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   └── healthRoutes.js
│   │   ├── utils/               # Utility functions
│   │   │   ├── password.js      # hashing & verification
│   │   │   ├── validation.js    # Joi schemas
│   │   │   └── auditLog.js      # Audit logging
│   │   └── index.js             # Express app setup
│   ├── scripts/
│   │   └── initdb.js            # Database initialization
│   ├── .env                     # Environment variables
│   ├── Dockerfile               # Container configuration
│   ├── package.json             # Dependencies
│   └── .env.example             # Sample env file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.js    # Top navigation bar
│   │   │   ├── ProtectedRoute.js # Route authorization
│   │   │   └── AuthContext.js   # Authentication state
│   │   ├── contexts/
│   │   │   └── AuthContext.js   # React Context for auth
│   │   ├── pages/               # Page components
│   │   │   ├── RegisterPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── ProjectsPage.js
│   │   │   ├── ProjectDetailsPage.js
│   │   │   ├── UsersPage.js
│   │   │   └── TenantsPage.js
│   │   ├── services/
│   │   │   └── api.js           # Axios API client
│   │   ├── App.js               # Main app component
│   │   ├── App.css              # Global styles
│   │   ├── index.js             # React entry point
│   │   ├── index.css            # Global CSS reset
│   │   └── App.test.js          # Tests
│   ├── public/
│   │   └── index.html           # HTML template
│   ├── .env                     # Frontend env variables
│   ├── Dockerfile               # Container configuration
│   ├── package.json             # Dependencies
│   └── .env.example             # Sample env file
├── docs/
│   ├── README.md                # Project documentation
│   ├── research.md              # Multi-tenancy analysis
│   ├── PRD.md                   # Product requirements
│   ├── architecture.md          # Architecture overview
│   ├── technical-spec.md        # This file
│   ├── API.md                   # API documentation
│   └── images/                  # Diagrams (future)
│       ├── system-architecture.png
│       └── database-erd.png
├── docker-compose.yml           # Container orchestration
├── .gitignore                   # Git ignore file
├── submission.json              # Test credentials
└── LICENSE                      # MIT License
```

## Setup Instructions

### Prerequisites
- Docker 20.10+ and Docker Compose 1.29+
- Git 2.0+
- Node.js 18+ (for local development only)
- PostgreSQL 15+ (for local development only)

### Docker Deployment (Recommended)

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd multi-tenant-saas
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```
   This command:
   - Builds backend Docker image
   - Builds frontend Docker image
   - Starts PostgreSQL database container
   - Runs database migrations automatically
   - Seeds test data
   - Starts Node.js API server
   - Starts React development/production server

3. **Verify services are running**
   ```bash
   docker-compose ps
   ```
   Expected output shows 3 healthy services:
   - database (postgres)
   - backend (5000)
   - frontend (3000)

4. **Access application**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000/api
   - Health check: http://localhost:5000/api/health

5. **Stop all services**
   ```bash
   docker-compose down
   ```

6. **Remove all data and restart fresh**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Local Development Setup

#### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local database credentials
   ```

3. **Initialize database**
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start backend server**
   ```bash
   npm start
   # Runs on http://localhost:5000
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # For local dev: REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start frontend server**
   ```bash
   npm start
   # Runs on http://localhost:3000
   # Opens automatically in browser
   ```

## Database Schema

### Table: tenants
- **Purpose:** Store registered organizations
- **Columns:**
  - `id` (UUID, Primary Key)
  - `name` (varchar, Not Null)
  - `subdomain` (varchar, Unique, Not Null)
  - `status` (enum: active, suspended, trial, default: active)
  - `subscription_plan` (enum: free, pro, enterprise, default: free)
  - `max_users` (integer, based on plan)
  - `max_projects` (integer, based on plan)
  - `created_at` (timestamp, server default)
  - `updated_at` (timestamp, server default)
- **Indexes:** subdomain (unique), status, subscription_plan
- **Relationships:** 1 tenant has many users, 1 tenant has many projects

### Table: users
- **Purpose:** Store user accounts (members of organizations)
- **Columns:**
  - `id` (UUID, Primary Key)
  - `tenant_id` (UUID, Foreign Key to tenants, Nullable for super_admin)
  - `email` (varchar, Not Null)
  - `password_hash` (varchar, Not Null)
  - `full_name` (varchar, Not Null)
  - `role` (enum: super_admin, tenant_admin, user, default: user)
  - `is_active` (boolean, default: true)
  - `created_at` (timestamp, server default)
  - `updated_at` (timestamp, server default)
- **Unique Constraint:** (tenant_id, email) - allows same email across different tenants
- **Indexes:** tenant_id, email, role
- **Relationships:** Many users belong to 1 tenant

### Table: projects
- **Purpose:** Store project/initiative records
- **Columns:**
  - `id` (UUID, Primary Key)
  - `tenant_id` (UUID, Foreign Key to tenants, Not Null)
  - `name` (varchar, Not Null)
  - `description` (text, Nullable)
  - `status` (enum: active, archived, completed, default: active)
  - `created_by` (UUID, Foreign Key to users)
  - `created_at` (timestamp, server default)
  - `updated_at` (timestamp, server default)
- **Indexes:** tenant_id, created_by, status
- **Relationships:** Many projects belong to 1 tenant, created by 1 user

### Table: tasks
- **Purpose:** Store task records (work items within projects)
- **Columns:**
  - `id` (UUID, Primary Key)
  - `project_id` (UUID, Foreign Key to projects, Not Null)
  - `tenant_id` (UUID, Foreign Key to tenants, Not Null)
  - `title` (varchar, Not Null)
  - `description` (text, Nullable)
  - `status` (enum: todo, in_progress, completed, default: todo)
  - `priority` (enum: low, medium, high, default: medium)
  - `assigned_to` (UUID, Foreign Key to users, Nullable)
  - `due_date` (date, Nullable)
  - `created_at` (timestamp, server default)
  - `updated_at` (timestamp, server default)
- **Indexes:** project_id, tenant_id, assigned_to, status
- **Relationships:** Many tasks belong to 1 project, assigned to 0 or 1 user

### Table: audit_logs
- **Purpose:** Track all CREATE/UPDATE/DELETE operations for compliance
- **Columns:**
  - `id` (UUID, Primary Key)
  - `tenant_id` (UUID, Foreign Key to tenants, Not Null)
  - `user_id` (UUID, Foreign Key to users, Nullable)
  - `action` (varchar: CREATE_USER, UPDATE_USER, DELETE_USER, etc.)
  - `entity_type` (varchar: User, Project, Task, etc.)
  - `entity_id` (UUID, Not Null)
  - `ip_address` (inet, Nullable)
  - `created_at` (timestamp, server default)
- **Indexes:** tenant_id, user_id, action, created_at
- **Purpose:** Enables forensic analysis of user actions and data changes

## Authentication & Authorization

### JWT Token Format
```javascript
{
  userId: "uuid",
  tenantId: "uuid or null",
  role: "super_admin|tenant_admin|user",
  iat: 1234567890,
  exp: 1234567890 + 86400  // 24 hour expiry
}
```

### Roles & Permissions

**super_admin** (tenantId = null)
- Can view all tenants
- Can view all users across all tenants
- Can manage tenant subscriptions and limits
- Can access all endpoints

**tenant_admin** (tenantId = specific tenant)
- Can manage users within their tenant
- Can create/edit/delete projects and tasks
- Can view all users in their tenant
- Cannot access other tenants' data
- Cannot access /api/tenants (list all)

**user** (tenantId = specific tenant)
- Can view dashboard and projects
- Can create/update personal tasks
- Can only view users within their tenant
- Cannot add/remove users (need tenant_admin)
- Cannot manage projects (need to be creator or tenant_admin)

### Token Acquisition

**POST /api/auth/login**
```javascript
Request:
{
  email: "user@example.com",
  password: "password123",
  tenantSubdomain: "demo"  // optional, required for non-super-admin
}

Response:
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    userId: "uuid",
    email: "user@example.com",
    fullName: "John Doe",
    role: "tenant_admin",
    tenantId: "uuid"
  },
  expiresIn: 86400
}
```

## Subscription Plans

### Free Plan
- Max 5 users per tenant
- Max 3 projects per tenant
- Basic features
- No priority support

### Pro Plan
- Max 25 users per tenant
- Max 15 projects per tenant
- Advanced features
- Email support

### Enterprise Plan
- Max 100 users per tenant
- Max 50 projects per tenant
- All features
- Dedicated support
- Custom SLA

Resource limits are enforced in API:
- Attempting to create user beyond limit returns **403 Forbidden**
- Attempting to create project beyond limit returns **403 Forbidden**

## API Response Format

### Success Response (2xx)
```javascript
{
  success: true,
  data: { /* requested data */ },
  message: "Optional success message"
}
```

### Error Response (4xx, 5xx)
```javascript
{
  success: false,
  message: "Detailed error description",
  errors: []  // Optional field details for validation errors
}
```

## Implementation Highlights

### Multi-Tenancy Implementation
- **Isolation Method:** Shared Database, Shared Schema, Tenant-Aware Queries
- **Tenant Extraction:** From JWT token in authenticateToken middleware
- **Filtering:** Every query filters by req.user.tenantId
- **Prevention:** Tenant ID never comes from request body (prevents tampering)
- **Super Admin Exception:** Super admin (role='super_admin') bypasses tenant checks
- **Error Handling:** Returns 403 if user attempts to access other tenant's resources

### Password Security
- **Algorithm:** bcryptjs with 10 salt rounds
- **Storage:** Only hash is stored, never plain password
- **Verification:** Constant-time comparison prevents timing attacks
- **Minimum Length:** 8 characters enforced
- **Hashing Cost:** Intentionally slow to prevent GPU-accelerated brute force

### Input Validation
- **Library:** Joi schema validation
- **Coverage:** Every POST/PUT endpoint validates request.body
- **Effects:** Returns 400 Bad Request if validation fails
- **Sanitization:** Joi automatically trims whitespace and converts types

### Audit Logging
- **Coverage:** Every CREATE, UPDATE, DELETE operation logged
- **Data Captured:** User ID, tenant ID, action type, entity type, entity ID, timestamp
- **Purpose:** Compliance, forensics, debugging
- **Query:** `SELECT * FROM audit_logs WHERE tenant_id = $1`

### Error Handling
- **400 Bad Request:** Validation failure, invalid input
- **401 Unauthorized:** Missing or invalid JWT token
- **403 Forbidden:** User lacks permission, role check failed, limit exceeded
- **404 Not Found:** Resource does not exist or belongs to different tenant
- **500 Internal Error:** Unexpected server error (logged)

## Performance Considerations

### Database Optimization
- Connection pooling (max 20 connections)
- Indexes on frequently queried columns (tenant_id, email, status)
- Parameterized queries prevent SQL injection and enable plan caching
- Foreign key constraints ensure referential integrity

### API Performance
- Pagination support (page, limit) prevents large result sets
- Filtering on endpoints reduces data transfer
- Stateless design allows horizontal scaling
- CORS pre-flight caching reduces overhead

### Frontend Performance
- React lazy loading of routes (future enhancement)
- Client-side filtering and sorting
- Local storage caching of authentication token
- CSS minification in production build

## Security Implemented

1. **Authentication:** JWT tokens (24-hour expiry)
2. **Authorization:** Role-based access control (RBAC)
3. **Password Security:** bcryptjs hashing
4. **Input Validation:** Joi schemas on all inputs
5. **SQL Injection Protection:** Parameterized queries ($1, $2 notation)
6. **Data Isolation:** Tenant-based filtering on all queries
7. **CORS:** Whitelisted frontend domain
8. **Audit Logging:** All mutations logged
9. **HTTPS Ready:** Works with SSL/TLS in production
10. **No Secrets in Code:** Environment variables for sensitive data

## Monitoring & Health Checks

### Health Check Endpoint
**GET /api/health**
- Tests database connectivity
- Returns status and database connection state
- Used by Docker containers to verify readiness
- Enables automated failure detection

### Docker Health Checks
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/api/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 40s
```

## Testing

### Test Credentials (Included in submission.json)
```javascript
superAdmin: {
  email: "superadmin@system.com",
  password: "Admin@123",
  role: "super_admin"
}

tenantAdmin: {
  email: "admin@demo.com",
  password: "Demo@123",
  role: "tenant_admin"
}

regularUser: {
  email: "user1@demo.com",
  password: "User@123",
  role: "user"
}
```

### Manual Testing
1. Register new tenant with unique subdomain
2. Login with tenant admin credentials
3. Create users, projects, and tasks
4. Verify data isolation (login as different tenant, cannot see other data)
5. Test role-based access (user cannot access /api/users endpoint)
6. Verify audit logs created for all operations

## Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] .env file configured with secrets
- [ ] Docker images built successfully
- [ ] docker-compose up -d completes without errors
- [ ] All three services show as healthy
- [ ] Frontend accessible at localhost:3000
- [ ] Backend accessible at localhost:5000
- [ ] Health check passes: GET /api/health
- [ ] Database populated with seed data
- [ ] Login works with test credentials
- [ ] All 19 endpoints tested and functional
- [ ] Multi-tenancy isolation verified (cross-tenant access denied)
- [ ] Role-based access verified

## Future Enhancements

1. **Search Functionality:** Full-text search across projects/tasks
2. **Notifications:** Email/SMS notifications for task assignments
3. **Real-time Updates:** WebSocket integration for live updates
4. **File Attachments:** Upload files to tasks
5. **Comments:** Discussion threads on tasks
6. **Calendar View:** Gantt charts and calendar views
7. **Analytics:** Usage analytics and reporting
8. **API Keys:** Token-based authentication for external integrations
9. **SSO:** Single Sign-On integration (OIDC, SAML)
10. **Mobile App:** React Native mobile application
