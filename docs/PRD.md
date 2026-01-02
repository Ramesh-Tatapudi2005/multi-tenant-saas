# Product Requirements Document (PRD) - SaaS Pro

## 1. User Personas

### 1.1 Super Admin
* **Role Description**: System-level administrator with full access to all tenants and system resources.
* **Key Responsibilities**: Manage tenants, monitor system-wide audit logs, and oversee global settings.
* **Main Goals**: Ensure system performance, tenant isolation, and platform security.

### 1.2 Tenant Admin
* **Role Description**: Responsible for managing a single organization/tenant.
* **Key Responsibilities**: Manage organization users, create projects, and monitor task execution.
* **Main Goals**: Efficiently manage workflow and maintain visibility of project progress.

### 1.3 End User
* **Role Description**: Regular team member focused on task execution.
* **Key Responsibilities**: Complete assigned tasks and update status regularly.
* **Main Goals**: Collaborate effectively and meet project deadlines.

---

## 2. Functional Requirements (FR)

### Auth Module
* **FR-001**: The system shall allow tenant identification via a unique subdomain during login.
* **FR-002**: The system shall allow users to log in with email, password, and tenant subdomain.
* **FR-003**: The system shall enforce JWT-based authentication for all protected API endpoints.

### Tenant & User Module
* **FR-004**: The system shall allow `super_admin` to view audit logs across all tenants.
* **FR-005**: The system shall isolate data so users can only access resources belonging to their `tenant_id`.
* **FR-006**: The system shall allow `tenant_admin` to view organization-specific statistics.

### Project Module
* **FR-007**: The system shall allow `tenant_admin` to create new projects.
* **FR-008**: The system shall allow authorized users to view a list of projects and their descriptions.
* **FR-009**: The system shall allow the deletion of projects by `tenant_admin`.

### Task Module
* **FR-010**: The system shall allow creating tasks specifically linked to an existing project via an **Integer ID**.
* **FR-011**: The system shall allow updating task status (e.g., "pending" to "completed").
* **FR-012**: The system shall allow deleting tasks from a project.

### Additional Requirements
* **FR-013**: The system shall log all CRUD actions (Create, Update, Delete) in `audit_logs`.
* **FR-014**: The system shall provide a dashboard with real-time charts (Bar and Pie) for task distribution.

---

## 3. Non-Functional Requirements (NFR)

* **NFR-001 (Security)**: All passwords shall be hashed using secure algorithms (e.g., bcrypt).
* **NFR-002 (Data Integrity)**: The system shall use relational foreign keys (Integer-based) to ensure data consistency.
* **NFR-003 (Usability)**: The frontend shall provide immediate feedback for actions (e.g., UI refresh after adding a task).
* **NFR-004 (Availability)**: The system shall be containerized using Docker to ensure consistent environments.

---

## 4. Technical Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Python / FastAPI / SQLAlchemy |
| **Frontend** | React.js / Recharts / Axios |
| **Database** | PostgreSQL |
| **Auth** | JWT (JSON Web Tokens) |