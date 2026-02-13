# Frequently Asked Questions (FAQ)

## General Questions

### Q: What is this project?
A: Multi-Tenant SaaS is a production-ready platform for building SaaS applications with complete multi-tenancy support, user management, and project/task tracking. It demonstrates full-stack development with modern technologies.

### Q: What does "multi-tenant" mean?
A: Multi-tenancy means multiple independent organizations (tenants) can use the same application with complete data isolation. Each organization's data is separate and secure from others.

### Q: Can I use this for production?
A: Yes! The application is designed to be production-ready with security best practices, data isolation, and Docker containerization. See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.

### Q: What languages does this support?
A: Currently supports English. Internationalization (i18n) is on the roadmap for future versions.

### Q: Is there a mobile app?
A: Not currently. The frontend is responsive for mobile browsers. Native mobile apps are planned for future versions.

---

## Setup & Installation

### Q: How do I get started quickly?
A: See [QUICK_START.md](QUICK_START.md) for rapid setup instructions. Three simple options available.

### Q: What are the system requirements?
A: 
- Docker 20.10+ (for Docker deployment)
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)
- 2GB RAM minimum (more recommended for production)

### Q: Can I run this on Windows?
A: Yes! Docker Desktop runs on Windows. For local development:
- Use Windows Subsystem for Linux (WSL 2) for better experience
- Or use Windows native Node.js and PostgreSQL

### Q: Do I need Docker?
A: No, but it's recommended. You can run locally with Node.js and PostgreSQL. See [DEVELOPMENT.md](DEVELOPMENT.md) for local setup.

### Q: How long does setup take?
A: With Docker: 2-3 minutes. Local development: 10-15 minutes.

### Q: Can I customize the database schema?
A: Yes! See [backend/database/migrations/](backend/database/migrations) and [DEVELOPMENT.md](DEVELOPMENT.md#database-migrations).

---

## Usage & Features

### Q: What can I do with this application?
A: Register organizations, manage users and teams, create projects, manage tasks, track progress, and organize work with role-based permissions.

### Q: How do I add a new user?
A: Only tenant admins can add users. Click "Users" → "Add New User" and enter details.

### Q: Can I change user roles?
A: Yes, tenant admins can update user roles (user ↔ tenant_admin) in the Users page.

### Q: How do I delete a user?
A: Only tenant admins can delete users. Click Users → select user → Delete. The user's tasks will be unassigned.

### Q: How are subscription plans enforced?
A: Based on subscription tier, limits on users and projects are enforced. Attempting to exceed returns error 403 Forbidden.

### Q: Can users from different organizations see each other's data?
A: No! Complete data isolation is enforced. Users only see data of their own organization (tenant).

### Q: How are passwords stored?
A: Passwords are hashed with bcryptjs (10 salt rounds). Never stored in plain text.

### Q: How long do login sessions last?
A: JWT tokens expire after 24 hours. Users must login again to get a new token.

### Q: Can I export project data?
A: Not in the current version. Export functionality is planned for future versions.

---

## Security & Privacy

### Q: Is my data secure?
A: Yes! Multiple security measures:
- Encrypted passwords (bcryptjs hashing)
- Parameterized database queries (prevents SQL injection)
- Role-based access control (RBAC)
- Tenant isolation at database level
- HTTPS ready (use HTTPS in production)
- Audit logging of all mutations

### Q: Can I encrypt the database?
A: Yes! When using managed database services (AWS RDS, Google Cloud SQL, etc.), enable encryption at rest. Use HTTPS/TLS for data in transit.

### Q: What data is logged?
A: Audit logs capture: user ID, tenant ID, action type, resource ID, timestamp. User passwords are never logged.

### Q: How is data backup handled?
A: In Docker, database persists to named volume. In production, use managed database services with automatic backups. See [DEPLOYMENT.md](DEPLOYMENT.md#backup--disaster-recovery).

### Q: Can I access my data if the service goes down?
A: Yes! Your data is in your database. If self-hosted, you control backups. If cloud-hosted, use managed database with redundancy.

### Q: How do I handle GDPR/compliance?
A: The audit logs enable compliance tracking. Implement data export/deletion features based on audit logs.

---

## Development & Customization

### Q: Can I add custom fields to users?
A: Yes! Modify [backend/database/migrations/002_create_users.sql](backend/database/migrations/002_create_users.sql), add new migration, update API, and update frontend.

### Q: How do I add a new API endpoint?
A: 1) Add controller in [backend/src/controllers/](backend/src/controllers/), 2) Add route in [backend/src/routes/](backend/src/routes/), 3) Update [docs/API.md](docs/API.md).

### Q: Can I use a different database?
A: Currently designed for PostgreSQL. Changes required for MySQL, MongoDB, etc. (not recommended for this use case).

### Q: Can I replace React with Vue/Angular?
A: Yes! Frontend is independent. Remove [frontend/](frontend) and build new frontend consuming the same API.

### Q: How do I add authentication methods (OAuth, SSO)?
A: Implement additional auth strategy in [backend/src/controllers/authController.js](backend/src/controllers/authController.js) while keeping JWT generation.

### Q: Can I run multiple backend instances?
A: Yes! Use load balancer (nginx, HAProxy) with multiple backend containers. The stateless JWT design supports this.

### Q: How do I implement real-time updates?
A: Add WebSocket support using Socket.io or similar. Emit events when tasks/projects are created/updated.

### Q: Where do I add business logic?
A: Controller methods in [backend/src/controllers/](backend/src/controllers/). Use utility functions from [backend/src/utils/](backend/src/utils/).

---

## Deployment & Operations

### Q: What cloud providers are supported?
A: Docker support means compatibility with: AWS ECS/Lambda, Google Cloud Run, Azure Container Instances, DigitalOcean Apps, Heroku, Kubernetes, etc.

### Q: How do I deploy to production?
A: See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step production setup.

### Q: What's the recommended hosting?
A: For startups: DigitalOcean App Platform (easiest). For scale: AWS or Google Cloud (most features).

### Q: How do I monitor the application?
A: Use container orchestration health checks, add APM tools (New Relic, DataDog), implement logging aggregation (ELK Stack).

### Q: How do I scale to handle more users?
A: 1) Horizontal scaling: Run multiple backend instances, 2) Database: Use read replicas, 3) Caching: Add Redis layer.

### Q: What's the maximum tenants supported?
A: Single database architecture supports 10,000+ tenants efficiently. Beyond that, implement tenant-based database partitioning.

### Q: How do I backup the database?
A: Local: `docker-compose exec database pg_dump …`. Production: Use managed database automatic backups or scheduled scripts.

### Q: Can I migrate data between environments?
A: Yes! Use `pg_dump` and `pg_restore` to backup a database and restore to another PostgreSQL instance.

---

## Troubleshooting

### Q: Docker containers won't start
A: Run `docker-compose logs` to see error messages. Common: port conflicts, insufficient disk space, permission issues.

### Q: Database connection fails
A: Check: postgres container is running, credentials correct, database created, network connectivity.

### Q: Frontend shows "Cannot GET /api/projects"
A: Backend API URL not configured correctly. Verify [frontend/.env](frontend/.env) REACT_APP_API_URL is correct.

### Q: Login fails with "Tenant not found"
A: Check subdomain is correct (should be "demo" for test account). Use browser DevTools Network tab to see request.

### Q: Token expired error
A: Login again to get new token (expires after 24 hours).

### Q: Out of memory errors
A: Increase Docker memory limits in docker-compose.yml or increase server RAM.

### Q: Slow API responses
A: Check: database indexes, query performance, database server load, network latency.

### Q: 403 Forbidden on legitimate request
A: Check: user role (need admin for certain endpoints), auth token valid, user belongs to tenant.

### Q: Task assigned_to is NULL after user deletion
A: By design! When a user is deleted, their assigned tasks are unassigned (assigned_to set to NULL).

---

## Performance & Optimization

### Q: How fast is the API?
A: Typical response time: 50-200ms depending on query complexity (local dev). Production with CDN: 20-100ms.

### Q: How many concurrent users does it support?
A: With single backend instance: 100-500 concurrent users. With 3+ instances: 1000+ concurrent users.

### Q: Is pagination supported?
A: Yes! All list endpoints support pagination: `?page=1&limit=10`. Limits query results for performance.

### Q: Can I search across projects?
A: Yes! Search parameter works on list endpoints. Full-text search (Elasticsearch) is planned.

### Q: How do I monitor slow queries?
A: Enable PostgreSQL query logging. See [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting-production-issues).

---

## Contributing & Community

### Q: Can I contribute?
A: Yes! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Q: How do I report a bug?
A: Open GitHub issue with detailed description. See [CONTRIBUTING.md](CONTRIBUTING.md#reporting-bugs).

### Q: How do I suggest a feature?
A: Open GitHub issue with label `[ENHANCEMENT]`. See [CONTRIBUTING.md](CONTRIBUTING.md#suggesting-enhancements).

### Q: How do I report security issues?
A: Email security@example.com. Do NOT open public issue for vulnerabilities.

### Q: Can I use code from this project?
A: Yes! MIT License allows commercial and private use. Attribution appreciated.

### Q: What's the development roadmap?
A: See [CHANGELOG.md](CHANGELOG.md#unreleased) Planned Features section.

---

## Licensing & Legal

### Q: What license is this under?
A: MIT License. See [LICENSE](LICENSE) file.

### Q: Can I use this for commercial purposes?
A: Yes! MIT License permits commercial use.

### Q: Do I need to credit the original author?
A: Not required, but appreciated. See [LICENSE](LICENSE).

### Q: Can I modify and redistribute?
A: Yes! MIT License allows modifications and redistribution.

### Q: What about data privacy?
A: As the operator, you're responsible for data privacy compliance (GDPR, etc.). The app provides audit logs to help.

---

## Still Have Questions?

- Check the [README.md](README.md) for complete documentation
- See [DEVELOPMENT.md](DEVELOPMENT.md) for development details
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment details
- Open GitHub issue with details
- Email: support@example.com

---

**Last Updated:** 2024-01-20
