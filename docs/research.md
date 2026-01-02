# Project Research & Technology Stack

## 1. Multi-Tenancy Approach: Shared Database + Shared Schema

For this project, the **Shared Database + Shared Schema** model was selected as the core architecture.

### Overview
In this approach, all tenants share a single database and a single schema. Every table (Users, Projects, Tasks, Audit Logs) includes a `tenant_id` column. All database queries are filtered using the current tenant’s ID, extracted from the JWT, to ensure strict data isolation.



### Pros and Cons
| Feature | Shared Schema (Selected) | Separate Database |
|:---|:---|:---|
| **Operational Complexity** | Low: One database to back up and patch. | High: Must manage many instances. |
| **Cost** | Lowest: Minimal hosting overhead. | Highest: Each tenant needs an instance. |
| **Onboarding** | Instant: Simple `INSERT` into tenant table. | Slow: Requires provisioning. |
| **Isolation** | Logical: Relies on `tenant_id` filters. | Physical: Strongest separation. |

### Justification
This approach was chosen because it excels in efficiency and simplicity for a growing SaaS. Schema migrations are applied once across all tenants, and resource utilization is highly optimized. Isolation is enforced at the application level by mandating `tenant_id` in every SQLAlchemy model and query.

---

## 2. Technology Stack Justification

### 2.1 Backend: Python + FastAPI
**Why Chosen:**
* **Asynchronous Performance**: FastAPI’s non-blocking architecture is ideal for handling concurrent tenant requests efficiently.
* **Automatic Validation**: Uses Pydantic to enforce strict data types, preventing the "422 Unprocessable Entity" errors by validating IDs as Integers.
* **Developer Velocity**: Extremely fast to build and document via automatic Swagger/OpenAPI generation.

### 2.2 Database: PostgreSQL + SQLAlchemy (ORM)
**Why Chosen:**
* **Relational Integrity**: Supports strong ACID compliance for consistent project and task updates.
* **Relationship Mapping**: SQLAlchemy allows for `cascade="all, delete-orphan"`, ensuring that when a project is deleted, all related tasks are removed automatically.
* **Scalability**: PostgreSQL handles `tenant_id` indexing exceptionally well for large shared-schema datasets.

### 2.3 Authentication: JWT (JSON Web Tokens)
**Why Chosen:**
* **Statelessness**: No server-side session storage is required, making the system easier to scale.
* **Context Carrier**: The `tenant_id` and `role` are embedded directly in the token payload, allowing the backend to instantly identify a user's scope.

### 2.4 Frontend: React.js
**Why Chosen:**
* **Component Reusability**: Ideal for building complex dashboards with modular project and task cards.
* **Real-time Analytics**: Easily integrates with Recharts for project and task status visualization.

---

## 3. Security Considerations

### 3.1 Data Isolation Strategy
* **Query Filtering**: Every backend query includes a `.filter(models.Task.tenant_id == current_user.tenant_id)` clause.
* **Input Enforcement**: Tenant IDs are never accepted from the frontend for sensitive operations; they are strictly pulled from the secure JWT.

### 3.2 Authorization (RBAC)
* **Tenant Admin**: Full CRUD access to projects and tasks within their specific tenant.
* **Super Admin**: Global read-only access for monitoring platform health and viewing all audit logs.

### 3.3 Audit Logging
* **Activity Tracking**: Sensitive actions (Logins, Task Creation, Deletions) are recorded in the `audit_logs` table for compliance and security auditing.