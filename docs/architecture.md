# System Architecture Design

## 1. System Architecture Diagram

**Description:** The SaaS Pro platform follows a modern three-tier architecture designed for multi-tenant scalability and data isolation.



* **Client (Browser)**: A React-based Single Page Application (SPA) that interacts with the API via Axios.
* **Frontend Application**: Handles UI rendering, client-side routing, and role-based UI logic (Tenant Admin vs. Super Admin).
* **Backend API Server**: A FastAPI server that handles JWT authentication, RBAC (Role-Based Access Control), and enforces tenant isolation at the database query level.
* **Database**: PostgreSQL storage utilizing a shared-schema model with `tenant_id` columns to ensure data segregation.
* **Authentication Flow**: JWT-based; the token payload contains `sub` (user email), `role`, and `tenant_id`.

---

## 2. Database Schema Design (ERD)

**Description:** Entity Relationship Diagram (ERD) showcasing the relational structure. All foreign keys and relationships utilize **Integer** types to ensure referential integrity.



### Tables & Key Columns:
* **users**: 
    * `id` (PK - Integer), `email`, `password_hash`, `role`, `tenant_id`.
* **projects**: 
    * `id` (PK - Integer), `name`, `description`, `tenant_id`.
* **tasks**: 
    * `id` (PK - Integer), `project_id` (FK → projects.id), `tenant_id`, `title`, `status`.
* **audit_logs**: 
    * `id` (PK - Integer), `tenant_id`, `user_id` (FK → users.id), `action`, `details`, `created_at`.

### Relationships:
* **One Tenant → Many Users**: Users are strictly bound to a single tenant.
* **One Tenant → Many Projects**: Projects are isolated by `tenant_id`.
* **One Project → Many Tasks**: Tasks are linked via `project_id` (Integer). Deleting a project cascades to its tasks.
* **Audit logs → Tenant & User**: Logs track specific user actions within their tenant context.

---

## 3. API Architecture

The API is modularized into functional controllers, each enforcing tenant-level security.

### Auth Module
| Endpoint | Method | Auth Required | Role | Description |
|----------|--------|---------------|------|-------------|
| /api/auth/login | POST | No | None | Authenticates user and returns JWT |

### Projects Module
| Endpoint | Method | Auth Required | Role | Description |
|----------|--------|---------------|------|-------------|
| /api/projects | GET | Yes | Any | List projects (Tenant-filtered for Admins; Global for SuperAdmin) |
| /api/projects | POST | Yes | Admin | Create a new project within the tenant |
| /api/projects/:id| DELETE | Yes | Admin | Delete project and associated tasks |

### Tasks Module
| Endpoint | Method | Auth Required | Role | Description |
|----------|--------|---------------|------|-------------|
| /api/tasks | POST | Yes | Admin | Create task for a specific project ID |
| /api/tasks/:id | PATCH | Yes | Admin | Toggle task status (pending/completed) |
| /api/tasks/:id | DELETE | Yes | Admin | Remove task from database |

### Audit Logs Module
| Endpoint | Method | Auth Required | Role | Description |
|----------|--------|---------------|------|-------------|
| /api/audit-logs | GET | Yes | Any | View tenant activity logs |

---

## 4. Implementation Notes

* **Tenant Isolation**: Every SQL query includes a `.filter(tenant_id == current_user.tenant_id)` clause to prevent cross-tenant data leaks.
* **Cascade Deletes**: Project-to-Task relationships are configured with `cascade="all, delete-orphan"` in SQLAlchemy.
* **Data Types**: Strict use of `Integer` for primary and foreign keys to avoid 422 validation errors during frontend-to-backend communication.