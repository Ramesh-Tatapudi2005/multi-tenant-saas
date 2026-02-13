# Quick Start Guide

Get the multi-tenant SaaS application running in minutes!

## Option 1: Docker Deployment (Easiest)

### Prerequisites
- Docker 20.10+
- Docker Compose 1.29+

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-tenant-saas
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000/api

4. **Login with demo credentials**
   - Email: `admin@demo.com`
   - Password: `Demo@123`
   - Subdomain: `demo`

That's it! The database has been automatically initialized with test data.

### Explore Features

1. **Dashboard** - View project statistics
2. **Projects** - Create, view, edit, delete projects
3. **Project Details** - Manage tasks within a project
4. **Users** (Admin only) - Manage team members
5. **Tenants** (Super Admin only) - View all organizations

### Stop the Application
```bash
docker-compose down
```

---

## Option 2: Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup database**
   ```bash
   # Make sure PostgreSQL is running
   # Create database and user
   createdb saas_db
   ```

3. **Run migrations and seed data**
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```
   Server runs on: http://localhost:5000

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```
   Frontend runs on: http://localhost:3000

### Access Application
- Frontend: http://localhost:3000
- API: http://localhost:5000/api

---

## Testing the API

### Using REST Client (VSCode)

Install VS Code extension: REST Client

Create file `test.http`:
```http
@base = http://localhost:5000/api

### Get Health
GET {{base}}/health

### Login
POST {{base}}/auth/login
Content-Type: application/json

{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "tenantSubdomain": "demo"
}

### Get Current User
@token = <paste-token-from-login>

GET {{base}}/auth/me
Authorization: Bearer {{token}}

### Get Projects
GET {{base}}/projects
Authorization: Bearer {{token}}
```

Click "Send Request" above each request to test.

### Using cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'

# Get projects (replace TOKEN with response from login)
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer TOKEN"
```

---

## Test Credentials

### Admin User
```
Email: admin@demo.com
Password: Demo@123
Subdomain: demo (when asked)
```

### Regular User
```
Email: user1@demo.com
Password: User@123
Subdomain: demo
```

### Super Admin
```
Email: superadmin@system.com
Password: Admin@123
(Leave subdomain blank)
```

---

## Common Tasks

### Create a New Project

1. Login with admin credentials
2. Click "Projects" in navigation
3. Click "Create New Project"
4. Enter project name and description
5. Click "Create"

### Create a Task

1. Click on a project from Projects page
2. Click "Create New Task"
3. Enter task details (title, priority, assign to)
4. Click "Create Task"

### Update Task Status

1. Go to project details
2. Click task to expand
3. Click status dropdown
4. Select new status (todo, in_progress, completed)

### Add Team Member

1. Click "Users" in navigation (admin only)
2. Click "Add New User"
3. Enter email, name, password
4. Select role (user or admin)
5. Click "Add User"

---

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port 5000
lsof -i :5000
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres

# Check .env file has correct DB settings
cat backend/.env
```

### Cannot Login
- Verify correct subdomain (demo)
- Check credentials match test data
- Make sure database was seeded: `npm run seed`

### Frontend Shows Blank Page
- Check browser console (F12) for errors
- Verify backend is running: `curl http://localhost:5000/api/health`
- Clear browser cache and reload

### API Returns 401 Unauthorized
- Login again to get fresh token
- Make sure token is in Authorization header
- Token expires after 24 hours

---

## Project Structure

```
multi-tenant-saas/
├── backend/              # Node.js/Express API
├── frontend/             # React application
├── docs/                 # Documentation files
├── docker-compose.yml    # Docker setup
├── README.md             # Full documentation
├── DEVELOPMENT.md        # Development guide
└── submission.json       # Test credentials
```

---

## Next Steps

1. **Explore the Code**
   - Check [backend/src/](backend/src) for API implementation
   - Check [frontend/src/](frontend/src) for React components

2. **Read Full Documentation**
   - [README.md](README.md) - Complete project documentation
   - [docs/API.md](docs/API.md) - API endpoint details
   - [docs/architecture.md](docs/architecture.md) - System design
   - [DEVELOPMENT.md](DEVELOPMENT.md) - Development setup
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment

3. **Run Tests**
   ```bash
   npm test  # (When tests are added)
   ```

4. **Try Different Credentials**
   - Super Admin account for global admin features
   - Regular user account to see limited permissions

5. **Create Demo Data**
   - Create new organization via registration
   - Add users and projects
   - Create and manage tasks

---

## Getting Help

- Check [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide
- Check [docs/API.md](docs/API.md) for API endpoint documentation
- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Open an issue on GitHub for bugs or feature requests

---

## Performance Tips

- The application uses pagination (default 10 items per page)
- Database includes indexes on frequently queried columns
- Frontend uses React Context for state management
- Backend uses connection pooling for database queries

---

## Security Features

- JWT-based stateless authentication
- Role-based access control (RBAC)
- Data isolation between tenants
- Password hashing with bcryptjs
- SQL injection prevention with parameterized queries
- Audit logging of all mutations

---

## Ready to Deploy?

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Production Docker setup
- Cloud deployment options (AWS, GCP, Azure)
- Database configuration
- Monitoring and logging setup
- Security hardening checklist

---

## Support

- GitHub: [Open an issue](https://github.com/your-repo/issues)
- Email: support@example.com
- Documentation: See [README.md](README.md) and docs/ folder

---

**Happy coding!** 🚀
