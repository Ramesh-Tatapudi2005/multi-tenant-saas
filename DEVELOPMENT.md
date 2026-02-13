# Development Guide

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git 2.0+

### Backend Development

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create local .env file**
   ```bash
   cp .env.example .env
   ```

3. **Setup local PostgreSQL database**
   ```bash
   # Using PostgreSQL CLI
   createdb saas_db
   createuser -P postgres  # Set password: postgres (default in env)
   
   # Or using Docker
   docker run --name saas-postgres -e POSTGRES_DB=saas_db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15-alpine
   ```

4. **Run migrations and seed data**
   ```bash
   npm run migrate
   npm run seed
   ```

5. **Start backend server**
   ```bash
   npm run dev
   # Server runs on http://localhost:5000
   ```

### Frontend Development

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Create local .env file**
   ```bash
   cp .env.example .env
   # For local dev, edit to: REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start frontend development server**
   ```bash
   npm start
   # Opens http://localhost:3000 automatically
   ```

### Development Workflow

1. **Backend changes**
   - Edit files in `backend/src/`
   - Server auto-restarts with nodemon
   - Check http://localhost:5000/api/health

2. **Frontend changes**
   - Edit files in `frontend/src/`
   - Browser auto-refreshes with hot reload
   - Check http://localhost:3000

3. **Database changes**
   - Create migration file in `backend/database/migrations/`
   - Run migration: `npm run migrate`
   - Update seed data if needed: `npm run seed`

## Testing Endpoints

### Using cURL

```bash
# 1. Register new organization
curl -X POST http://localhost:5000/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Company",
    "subdomain": "test",
    "adminEmail": "admin@test.com",
    "adminPassword": "TestPass123",
    "adminFullName": "Test Admin"
  }'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "TestPass123",
    "tenantSubdomain": "test"
  }'

# 3. Use returned token for protected requests
export TOKEN="<token_from_login>"

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Import API collection (future: create .postman_collection.json)
2. Set base URL: `http://localhost:5000/api`
3. Create environment variables for token
4. Test each endpoint according to API.md documentation

### Using API Client (VSCode REST Client)

Create `api-test.http` file:
```http
@baseUrl = http://localhost:5000/api

### Register Tenant
POST {{baseUrl}}/auth/register-tenant
Content-Type: application/json

{
  "tenantName": "Test Company",
  "subdomain": "test",
  "adminEmail": "admin@test.com",
  "adminPassword": "TestPass123",
  "adminFullName": "Test Admin"
}

### Login
@token = <token_from_register>

POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "TestPass123",
  "tenantSubdomain": "test"
}

### Get Current User
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}
```

## Debugging

### Backend Debugging

1. **Enable debug logging**
   ```javascript
   // In backend/src/index.js
   console.log('Query:', query);
   console.log('Params:', params);
   ```

2. **Use Chrome DevTools**
   ```bash
   node --inspect=0.0.0.0:9229 src/index.js
   # Visit chrome://inspect
   ```

3. **Check logs**
   ```bash
   npm run dev  # Shows all console output
   ```

### Frontend Debugging

1. **Browser DevTools**
   - F12 or right-click → Inspect
   - Check Console for errors
   - Network tab shows API calls
   - Application tab shows localStorage (JWT token)

2. **React DevTools**
   - Install React DevTools extension
   - Check component state and props
   - Monitor re-renders

### Database Debugging

1. **Connect directly to database**
   ```bash
   psql -h localhost -U postgres -d saas_db
   
   # Check tables
   \dt
   
   # View schema
   \d tenants
   \d users
   
   # Query data
   SELECT * FROM users;
   SELECT * FROM audit_logs;
   ```

2. **View database logs**
   ```bash
   docker logs saas-postgres  # If using Docker
   ```

## Common Issues & Solutions

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Database Connection Failed
```bash
# Verify PostgreSQL is running
ps aux | grep postgres

# Check connection
psql -h localhost -U postgres
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend Cannot Reach Backend
```bash
# Check .env file
cat frontend/.env

# Verify backend is running
curl http://localhost:5000/api/health

# Check CORS headers
curl -i http://localhost:5000/api/auth/login
```

### Invalid Token
- Token might be expired (24 hour expiry)
- Login again: `POST /auth/login`
- Check token format: `Authorization: Bearer <token>`

## Performance Optimization

### Backend Optimization
1. Use indexes on frequently queried columns
2. Implement pagination (default limit 10)
3. Connection pooling (max 20 connections)
4. Query optimization (avoid N+1 queries)

### Frontend Optimization
1. Code splitting with React.lazy (future)
2. Minimize re-renders with React.memo
3. Use local state for UI-only data
4. Cache API responses (future: Redux or React Query)

## Best Practices

### Code Style
- Use consistent naming: camelCase for variables, PascalCase for classes
- Keep functions small and focused (single responsibility)
- Add comments for complex logic
- Use meaningful variable names

### Git Workflow
```bash
# Before work
git pull origin main

# Work on feature
git checkout -b feature/my-feature

# Commit frequently
git add .
git commit -m "Clear commit message describing changes"

# Before push, update from main
git pull origin main
git rebase main

# Push and create PR
git push origin feature/my-feature
```

### Security
- Never commit secrets (.env in .gitignore)
- Validate all inputs (backend validation with Joi)
- Use parameterized queries to prevent SQL injection
- Hash passwords (bcryptjs 10 rounds minimum)
- Use HTTPS in production
- Set secure JWT secret (32+ characters)

## Database Migrations

### Create New Migration
1. Create numbered file: `backend/database/migrations/006_add_column.sql`
2. Write SQL statements
3. Run: `npm run migrate`
4. Test thoroughly

### Example Migration
```sql
-- backend/database/migrations/006_add_description_to_tenants.sql
ALTER TABLE tenants ADD COLUMN description TEXT;
```

## Deployment Preparation Checklist

- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] API endpoints tested with real data
- [ ] Frontend pages responsive on mobile
- [ ] Cross-tenant isolation verified
- [ ] Role-based access working correctly
- [ ] Audit logs being created
- [ ] Dockerfile builds successfully
- [ ] docker-compose.yml tested end-to-end
- [ ] Documentation updated
- [ ] Code commented where needed
- [ ] .gitignore configured properly
- [ ] No secrets in repository
