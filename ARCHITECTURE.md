# Architecture Decision Records (ADRs)

This document records significant architectural decisions made during development of the Multi-Tenant SaaS platform.

## ADR-001: Multi-Tenancy Architecture Pattern

### Status
**Accepted** (v1.0.0)

### Context
Need to support multiple independent organizations using a single application while maintaining complete data isolation.

### Decision
Implement **Shared Database + Shared Schema + Tenant-Aware Queries** pattern.

### Rationale
- **Cost Efficiency:** Single database instance supports 10,000+ tenants
- **Operational Simplicity:** One database to backup, scale, and maintain
- **Feature Parity:** All tenants get same features simultaneously
- **Scalability:** Can shard by tenant ID when reaching limits
- **Security:** Enforced at application layer (multiple defense layers)

### Alternatives Considered
1. **Separate Database per Tenant**
   - Pros: Maximum isolation, independent scaling
   - Cons: High management overhead, expensive at scale

2. **Shared Database + Separate Schema per Tenant**
   - Pros: Schema-level isolation, partial operational simplicity
   - Cons: More complex to deploy, schema migrations to all schemas

### Implementation Details
- All tables include `tenant_id` column
- Every query filters by `req.user.tenantId` extracted from JWT
- tenant_id never comes from request body (prevents tampering)
- Super admin (role='super_admin') has tenantId=NULL and bypasses tenant checks
- Composite indexes on `(tenant_id, column)` for performance

### Consequences
- ✅ Supports unlimited tenants
- ✅ Simple database operations
- ✅ Easy feature deployment
- ⚠️ Must enforce tenant filters in ALL queries
- ⚠️ Cannot use database-level row security
- ⚠️ Requires careful application-level authorization

---

## ADR-002: Authentication Mechanism Selection

### Status
**Accepted** (v1.0.0)

### Context
Need stateless authentication for distributed systems to enable horizontal scaling.

### Decision
Use **JWT (JSON Web Tokens)** with 24-hour expiry.

### Rationale
- **Stateless:** No server session storage needed
- **Scalable:** Any server can validate token independently
- **Standard:** Industry-standard approach, well-understood
- **Mobile-Friendly:** Works seamlessly with mobile APIs
- **Decentralized:** Can be issued and verified without central session store

### Alternatives Considered
1. **Session-Based Authentication**
   - Pros: Easy to revoke immediately
   - Cons: Requires session storage, harder to scale

2. **API Keys**
   - Pros: Simple, long-lived
   - Cons: Not suitable for user authentication, no role granularity

3. **OAuth 2.0**
   - Pros: Industry standard, third-party integration
   - Cons: Overkill for this use case, adds complexity

### Implementation Details
- Token contains: userId, tenantId, role, iat, exp
- Signed with JWT_SECRET using HS256 algorithm
- 24-hour expiry requires re-login
- Tokens transmitted in Authorization header: `Bearer <token>`
- Middleware extracts and validates token on protected routes

### Consequences
- ✅ Stateless, horizontally scalable
- ✅ Works with distributed systems
- ⚠️ Cannot immediately revoke token (24h max duration)
- ⚠️ Token size increases with claims (minimize claims)
- ⚠️ Secret key management critical

### Future Enhancement
Add refresh tokens for improved UX while maintaining security.

---

## ADR-003: Database Technology Selection

### Status
**Accepted** (v1.0.0)

### Context
Need reliable, scalable, multi-tenant-friendly database for business data.

### Decision
Use **PostgreSQL 15** as primary data store.

### Rationale
- **ACID Compliance:** Guarantees data integrity for financial/business data
- **Advanced Features:** JSONB, arrays, triggers, row-level security
- **Proven at Scale:** Used by Spotify, GitHub, Instagram at massive scale
- **Open Source:** No licensing costs, community support
- **Replication:** Built-in streaming replication for HA/DR
- **Performance:** Excellent for relational data with proper indexing
- **Multi-Tenancy:** Supports tenant isolation patterns natively

### Alternatives Considered
1. **MySQL**
   - Pros: Fast, lightweight
   - Cons: Fewer advanced features, RLS not available

2. **MongoDB**
   - Pros: Flexible schema
   - Cons: Wrong choice for this relational data model

3. **Firebase/Cloud Firestore**
   - Pros: Fully managed, auto-scaling
   - Cons: Vendor lock-in, harder data isolation

### Implementation Details
- Connection pooling (max 20 connections)
- Parameterized queries to prevent SQL injection
- Indexes on: tenant_id, email, status, created_at
- Foreign key constraints with CASCADE delete
- UUID primary keys for distributed systems

### Consequences
- ✅ Strong data integrity
- ✅ Proven reliability and performance
- ✅ Rich query capabilities
- ⚠️ Operational overhead (backups, upgrades)
- ✅ Managed services available (RDS, Cloud SQL, Azure Database)

---

## ADR-004: Backend Framework Selection

### Status
**Accepted** (v1.0.0)

### Context
Need lightweight, fast API framework suitable for REST API and microservices.

### Decision
Use **Node.js 18 + Express.js** for backend API.

### Rationale
- **Non-Blocking I/O:** Excellent for handling concurrent requests
- **JavaScript Ecosystem:** Massive npm ecosystem (2M+ packages)
- **Rapid Development:** Build API quickly with less boilerplate
- **Scalability:** Single-threaded event loop handles millions of concurrent connections
- **Microservices-Ready:** Perfect foundation for microservices architecture
- **Modern JavaScript:** ES6+ features with good language support

### Alternatives Considered
1. **Python + Django**
   - Pros: Batteries-included, strong ORM
   - Cons: Slightly slower, full-stack framework for API-only use

2. **Java + Spring**
   - Pros: Enterprise-grade, robust
   - Cons: Heavyweight, more boilerplate, slower startup

3. **Go**
   - Pros: Fast, compiled, good for microservices
   - Cons: Smaller ecosystem, longer development time

### Implementation Details
- Use Express.js for HTTP server
- Middleware pattern for cross-cutting concerns (auth, validation)
- Controllers handle business logic
- Routes organize API endpoints
- Utilities for reusable functions (password, audit, validation)

### Consequences
- ✅ Fast development and deployment
- ✅ Excellent for horizontal scaling
- ✅ Rich npm ecosystem
- ⚠️ Single-threaded (mitigated by clustering)
- ✅ No compilation step

---

## ADR-005: Frontend Framework Selection

### Status
**Accepted** (v1.0.0)

### Context
Need interactive user interface for dashboard and management features.

### Decision
Use **React 18** with **React Router v6** for frontend.

### Rationale
- **Component-Driven:** Reusable components reduce code duplication
- **Largest Community:** Most job availability, richest ecosystem
- **Performance:** Virtual DOM, efficient rendering
- **Developer Experience:** Hot reload, dev tools, excellent documentation
- **Flexibility:** Can be used with any backend API
- **State Management:** Built-in Context API for simple state

### Alternatives Considered
1. **Vue.js**
   - Pros: Easier learning curve, great documentation
   - Cons: Smaller ecosystem, fewer jobs

2. **Angular**
   - Pros: Complete framework, TypeScript
   - Cons: Heavyweight, steep learning curve, overkill for this use case

3. **Svelte**
   - Pros: Innovative, small bundle size
   - Cons: Too new, smaller ecosystem, less community support

### Implementation Details
- Create React App for build setup
- React Router v6 for client-side routing
- React Context API for authentication state
- Axios for API communication
- CSS3 for styling (can upgrade to styled-components/Tailwind later)

### Consequences
- ✅ Largest job market of any frontend framework
- ✅ Excellent for building SPAs (Single Page Applications)
- ✅ Rich ecosystem of libraries
- ✅ Great developer experience
- ⚠️ Larger bundle size than alternatives
- ⚠️ More boilerplate than newer frameworks

---

## ADR-006: Containerization and Orchestration

### Status
**Accepted** (v1.0.0)

### Context
Need consistent deployment across development, staging, and production environments.

### Decision
Use **Docker** for containerization and **Docker Compose** for local orchestration.

### Rationale
- **Consistency:** "Runs on my machine" problem solved
- **Isolation:** Dependencies isolated in containers
- **Scalability:** Easy to scale with container orchestration
- **Industry Standard:** Most cloud providers support Docker
- **Development:** Docker Compose simulates production locally

### Alternatives Considered
1. **Kubernetes**
   - Pros: Enterprise-grade orchestration
   - Cons: Complex for startup, overkill for simple deployment

2. **Virtual Machines**
   - Pros: Complete isolation
   - Cons: Heavy resource overhead, slow startup

3. **Serverless (AWS Lambda, Google Cloud Functions)**
   - Pros: Pay-per-execution, no ops
   - Cons: Stateless, hard for long-running services, vendor lock-in

### Implementation Details
- Multi-stage Docker builds (optimize image size)
- Health checks on all containers
- Named volumes for persistent data
- Environment variables for configuration
- Automatic database initialization on startup

### Consequences
- ✅ Consistent environments
- ✅ Easy deployment to any cloud
- ✅ Simple local development
- ✅ Foundation for enterprise deployments
- ⚠️ Learning curve for DevOps team
- ⚠️ Slight performance overhead vs native

---

## ADR-007: Password Hashing Algorithm

### Status
**Accepted** (v1.0.0)

### Context
Need secure password storage with resistance to modern attacks.

### Decision
Use **bcryptjs with 10 salt rounds** for password hashing.

### Rationale
- **Proven:** Industry-standard algorithm, used in production worldwide
- **Slow:** Intentionally slow (prevents GPU-accelerated brute force attacks)
- **Salted:** Each hash has unique salt (prevents rainbow tables)
- **No Key Derivation:** Simpler than PBKDF2/Argon2 for user passwords

### Alternatives Considered
1. **PBKDF2**
   - Pros: NIST recommended
   - Cons: Older, less commonly used for passwords

2. **scrypt**
   - Pros: Memory-hard, better against GPU attacks
   - Cons: Slower, more complex

3. **Argon2**
   - Pros: Winner of Password Hashing Competition
   - Cons: Newer, not as widely used, slower node library

### Implementation Details
- 10 salt rounds (default: 10, production could increase to 12-14)
- 8+ character minimum requirement
- Comparison using bcryptjs.compare (constant-time)
- Never log or return password hash to frontend

### Consequences
- ✅ Secure against modern attacks
- ✅ Industry standard implementation
- ✅ Widely understood and audited
- ⚠️ Slow by design (50-100ms per auth request)
- ✅ Performance acceptable for 50-200 requests/sec

---

## ADR-008: Input Validation Approach

### Status
**Accepted** (v1.0.0)

### Context
Need to validate all user inputs consistently to prevent invalid/malicious data.

### Decision
Use **Joi schema validation** on all POST/PUT endpoints.

### Rationale
- **Declarative:** Write validation rules once, apply everywhere
- **Consistent:** Same validation logic across all endpoints
- **Type Safety:** Ensures data types are correct
- **Error Messages:** Clear, user-friendly error messages
- **Performance:** Validates before database queries

### Alternatives Considered
1. **Manual Validation**
   - Pros: Flexible
   - Cons: Inconsistent, error-prone, repetitive

2. **Express Validator**
   - Pros: Middleware-friendly
   - Cons: More verbose than Joi

3. **TypeScript + Runtime Validation**
   - Pros: Type safety
   - Cons: Setup overhead, more initial effort

### Implementation Details
- Define Joi schemas in utils/validation.js
- Apply validation middleware to routes
- Return 400 Bad Request on validation failure
- Include field-level error messages

### Consequences
- ✅ Prevents invalid data in database
- ✅ Consistent validation across API
- ✅ Clear error messages to clients
- ⚠️ Additional dependency
- ✅ Small performance overhead (<5ms)

---

## ADR-009: Audit Logging

### Status
**Accepted** (v1.0.0)

### Context
Need compliance trail for regulatory requirements and security investigation.

### Decision
Implement **audit_logs table** capturing all CREATE, UPDATE, DELETE operations.

### Rationale
- **Compliance:** Enables compliance with GDPR, HIPAA, SOX, etc.
- **Security:** Investigate suspicious activities
- **Debugging:** Trace data changes
- **Non-Repudiation:** Users cannot deny their actions
- **Accountability:** Clear who made what change

### Alternatives Considered
1. **No Audit Logging**
   - Pros: Slightly faster operations
   - Cons: No compliance trail, security risk

2. **External Logging Service** (Splunk, Datadog)
   - Pros: Professional-grade logging
   - Cons: Additional cost, third-party dependency

3. **Database Triggers**
   - Pros: Captures all changes
   - Cons: Harder to query, slower

### Implementation Details
- Separate audit_logs table with: tenant_id, user_id, action, entity_type, entity_id, timestamp
- Log in application code after successful mutations
- Include tenant_id for multi-tenant queries
- Store IP address for audit trail

### Consequences
- ✅ Full compliance trail
- ✅ Security investigation capability
- ✅ User accountability
- ⚠️ Additional database writes
- ⚠️ Growing table size (manage retention)

---

## ADR-010: Error Handling Strategy

### Status
**Accepted** (v1.0.0)

### Context
Need consistent error responses to frontend for debugging and user feedback.

### Decision
Return **HTTP status codes** with **JSON error objects** containing message.

### Rationale
- **Standard:** HTTP status codes widely understood
- **Semantics:** 4xx for client errors, 5xx for server errors
- **Detail:** JSON body provides additional context
- **Consistency:** Same format for all errors

### Status Code Usage
- **400 Bad Request:** Validation failure
- **401 Unauthorized:** Missing/invalid authentication
- **403 Forbidden:** Authorized but lacking permission or limit exceeded
- **404 Not Found:** Resource not found
- **409 Conflict:** Unique constraint violation
- **500 Internal Server Error:** Unexpected error

### Implementation Details
```javascript
// Example error response
{
  "success": false,
  "message": "User with email already exists in tenant"
}
```

### Consequences
- ✅ Frontend can handle errors appropriately
- ✅ Standard HTTP semantics
- ✅ Clear error messages
- ✅ Enables better UX with error messages

---

## Future ADRs to Document

- [ ] API Versioning Strategy (when breaking changes needed)
- [ ] Caching Strategy (Redis implementation)
- [ ] Real-Time Communication (WebSocket vs Server-Sent Events)
- [ ] Microservices Decomposition (when scaling beyond single deployment)
- [ ] Search Implementation (Elasticsearch vs database full-text search)
- [ ] File Storage (S3 vs local filesystem)
- [ ] Message Queue (when async jobs needed)
- [ ] Observability (logging, tracing, metrics)
- [ ] Feature Flags (configuration management)

---

## ADR Template for Future Decisions

```markdown
## ADR-XXX: [Title]

### Status
**Proposed/Accepted/Deprecated** (vX.X.X)

### Context
[Explain the situation requiring this decision]

### Decision
[State the decision clearly]

### Rationale
[Explain why this decision was made]

### Alternatives Considered
[List and explain other options evaluated]

### Implementation Details
[How this decision is implemented]

### Consequences
[Positive and negative outcomes]
```

---

**Last Updated:** 2024-01-20
**Version:** 1.0.0
