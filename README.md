# Multi-Tenant SaaS Platform - Project & Task Management System

A production-ready, multi-tenant SaaS application where multiple organizations can independently register, manage their teams, create projects, and track tasks. The system ensures complete data isolation between tenants, implements role-based access control (RBAC), and enforces subscription plan limits.

## Features

- **Multi-Tenancy Architecture**: Complete data isolation between organizations with subdomain-based tenant identification
- **Authentication & Authorization**: JWT-based authentication with three role types (Super Admin, Tenant Admin, User)
- **Subscription Management**: Three subscription plans (free, pro, enterprise) with resource limits
- **Project Management**: Create, organize, and manage projects within your organization
- **Task Management**: Create and track tasks within projects with status, priority, and assignment features
- **Role-Based Access Control (RBAC)**: Fine-grained permissions based on user roles
- **Audit Logging**: Complete audit trail of all important actions for security and compliance
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Docker Containerization**: Full Docker setup for easy deployment and scaling

## Tech Stack

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Password Hashing**: bcryptjs

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS (responsive design)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL in Docker
- **Networking**: Docker network for inter-service communication

## Architecture Overview

The application follows a multi-tier architecture with complete separation of concerns:

```
┌─────────────────┐
│   Browser       │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP/HTTPS
┌────────▼─────────┐
│ React Frontend   │
│ (Port 3000)      │
└────────┬─────────┘
         │ API Calls
┌────────▼──────────────┐
│ Node.js Backend       │
│ (Port 5000)           │
│ - Auth Services       │
│ - Business Logic      │
│ - Data Validation     │
└────────┬──────────────┘
         │ SQL
┌────────▼──────────────────┐
│ PostgreSQL Database        │
│ (Port 5432)                │
│ - Tenants                  │
│ - Users                    │
│ - Projects & Tasks         │
│ - Audit Logs               │
└────────────────────────────┘
```

### Data Isolation Strategy

Each tenant's data is completely isolated:
- **Tenant ID Association**: Every record (except super admin users) is tagged with a `tenant_id`
- **Query Filtering**: All API queries automatically filter by the authenticated user's tenant
- **Email Uniqueness**: Emails are unique per tenant, not globally (allowing the same email across organizations)
- **Super Admin Exception**: System administrators have `tenant_id = NULL` and can access all

## Installation & Setup

### Prerequisites

- Docker & Docker Compose (for containerized deployment)
- Node.js 18+ and npm (for local development)
- PostgreSQL 15 (if running locally without Docker)

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-tenant-saas
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to be healthy** (approximately 30 seconds)
   ```bash
   docker-compose ps
   ```
   All services should show "healthy" or "up" status.

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

### Local Development Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your database credentials
   node scripts/initdb.js  # Run migrations and seed data
   npm start
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # .env is already configured for local development
   npm start
   ```

3. **Database Setup**
   - Ensure PostgreSQL is running on port 5432
   - Create database: `createdb saas_db`
   - Run migrations: `npm run migrate` (from backend directory)
   - Seed data: `npm run seed` (from backend directory)

## API Documentation

### Authentication Endpoints

#### Tenant Registration
- **POST** `/api/auth/register-tenant`
- Public endpoint (no authentication required)
- Creates new organization with admin user

#### User Login
- **POST** `/api/auth/login`
- Public endpoint
- Authenticates user and returns JWT token
- Requires email, password, and tenant subdomain (or blank for super admin)

#### Get Current User
- **GET** `/api/auth/me`
- Protected endpoint
- Returns current authenticated user and tenant details

#### Logout
- **POST** `/api/auth/logout`
- Protected endpoint
- Logs out user (client should remove token)

### Tenant Management Endpoints

#### Get Tenant Details
- **GET** `/api/tenants/:tenantId`
- Returns tenant information with statistics

#### Update Tenant
- **PUT** `/api/tenants/:tenantId`
- Tenant admins can update name; super admins can update all fields

#### List All Tenants (Super Admin Only)
- **GET** `/api/tenants`
- Returns paginated list of all tenants
- Query params: `page`, `limit`, `status`, `subscriptionPlan`

### User Management Endpoints

#### Add User to Tenant
- **POST** `/api/tenants/:tenantId/users`
- Create new user in organization
- Respects subscription user limits

#### List Tenant Users
- **GET** `/api/tenants/:tenantId/users`
- Query params: `search`, `role`, `page`, `limit`

#### Update User
- **PUT** `/api/users/:userId`
- Users can update their own name; admins can update role and status

#### Delete User
- **DELETE** `/api/users/:userId`
- Tenant admins only; cannot delete themselves

### Project Management Endpoints

#### Create Project
- **POST** `/api/projects`
- Respects subscription project limits

#### List Projects
- **GET** `/api/projects`
- Query params: `status`, `search`, `page`, `limit`

#### Update Project
- **PUT** `/api/projects/:projectId`
- Creator or tenant admin only

#### Delete Project
- **DELETE** `/api/projects/:projectId`
- Creator or tenant admin only

### Task Management Endpoints

#### Create Task
- **POST** `/api/projects/:projectId/tasks`

#### List Project Tasks
- **GET** `/api/projects/:projectId/tasks`
- Query params: `status`, `assignedTo`, `priority`, `search`, `page`, `limit`

#### Update Task Status
- **PATCH** `/api/tasks/:taskId/status`

#### Update Task
- **PUT** `/api/tasks/:taskId`
- Full update (title, description, status, priority, assignedTo, dueDate)

### Health Check

#### System Health
- **GET** `/api/health`
- Public endpoint
- Returns: `{"status": "ok", "database": "connected"}`

## Database Schema

### Core Tables

**tenants**: Organizations using the platform
- id (UUID)
- name, subdomain (unique)
- status, subscription_plan, max_users, max_projects
- created_at, updated_at

**users**: System and tenant users
- id (UUID)
- tenant_id (NULL for super_admin)
- email, password_hash, full_name, role
- is_active, created_at, updated_at
- Unique constraint: (tenant_id, email)

**projects**: Organization projects
- id (UUID)
- tenant_id, name, description, status
- created_by, created_at, updated_at

**tasks**: Project tasks
- id (UUID)
- project_id, tenant_id, title, description
- status, priority, assigned_to, due_date
- created_at, updated_at

**audit_logs**: Activity tracking
- id (UUID)
- tenant_id, user_id, action, entity_type, entity_id
- ip_address, created_at

## Subscription Plans

| Plan | Max Users | Max Projects | Cost |
|------|-----------|--------------|------|
| Free | 5 | 3 | $0/month |
| Pro | 25 | 15 | $99/month |
| Enterprise | 100 | 50 | Custom |

## Security Features

- **Password Security**: Bcrypt hashing with 10 salt rounds
- **JWT Security**: 24-hour token expiry with secure signing
- **Data Isolation**: Tenant-based filtering on all queries
- **Input Validation**: Joi validation on all API inputs
- **CORS Configuration**: Restricted to allowed frontend origin
- **Error Handling**: Generic error messages prevent information leakage
- **Audit Logging**: All important actions logged for compliance

## Response Format

All API responses use a consistent format:

**Success Response (200, 201):**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

**Error Response (4xx, 5xx):**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing Credentials

The application comes pre-seeded with test data:

### Super Admin
- Email: `superadmin@system.com`
- Password: `Admin@123`

### Demo Tenant
- Subdomain: `demo`
- Admin Email: `admin@demo.com`
- Admin Password: `Demo@123`
- User 1: `user1@demo.com` / `User@123`
- User 2: `user2@demo.com` / `User@123`

## Troubleshooting

### Services not starting
```bash
# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart
```

### Database connection issues
```bash
# Verify database is healthy
docker-compose ps database

# Reset database
docker volume rm saas_db_data  # Warning: deletes all data
docker-compose down && docker-compose up -d
```

### Port conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # PostgreSQL on 5433
  - "5001:5000"  # Backend on 5001
  - "3001:3000"  # Frontend on 3001
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, validation
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Helper functions
│   │   ├── config/           # Database config
│   │   └── index.js          # Entry point
│   ├── database/
│   │   ├── migrations/        # SQL migration files
│   │   └── seeds/            # Seed data
│   ├── scripts/
│   │   └── initdb.js         # Database initialization
│   ├── Dockerfile
│   └── package.json

├── frontend/
│   ├── public/               # Static files
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API services
│   │   ├── contexts/        # React contexts
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── Dockerfile
│   └── package.json

├── docs/
│   ├── research.md          # Multi-tenancy analysis
│   ├── PRD.md              # Product requirements
│   ├── architecture.md      # Architecture & design
│   ├── technical-spec.md    # Technical specifications
│   ├── API.md              # API documentation
│   └── images/             # Diagrams & screenshots

├── docker-compose.yml       # Docker service definitions
├── .gitignore              # Git ignore rules
├── submission.json         # Test credentials
└── README.md              # This file
```

## Performance Optimization

- **Database Indexes**: Indexes on tenant_id, foreign keys, and frequently filtered columns
- **Pagination**: Implemented for large data sets (users, projects, tasks)
- **Lazy Loading**: Frontend components load data on demand
- **Connection Pooling**: PostgreSQL connection pool for efficient database access

## Future Enhancement Ideas

- Implement WebSocket for real-time task updates
- Add file upload capability for project attachments
- Implement notification system
- Add advanced reporting and analytics
- Multi-language support
- Two-factor authentication
- API rate limiting and usage tracking
- Export data functionality (CSV, PDF)

## License

ISC

## Support

For issues, questions, or contributions, please open an issue in the repository.

---

