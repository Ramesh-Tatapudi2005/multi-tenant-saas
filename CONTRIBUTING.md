# Contributing Guide

## Code of Conduct

All contributors are expected to follow these principles:
- Respectful and inclusive community
- Focus on constructive feedback
- Report issues privately before public disclosure
- No discrimination of any kind

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Provide clear description of the bug
3. Include steps to reproduce
4. Specify environment (OS, Node version, etc.)
5. Attach error messages and logs

**Bug Report Template:**
```
Title: [BUG] Brief description

Description:
What happened and why is it a problem?

Steps to Reproduce:
1. First step
2. Second step
3. Expected behavior
4. Actual behavior

Environment:
- OS: Windows/Mac/Linux
- Node: v18.x.x
- npm: v9.x.x
```

### Suggesting Enhancements

1. Use title prefix `[ENHANCEMENT]`
2. Describe the enhancement clearly
3. Explain the use case
4. Suggest implementation if possible
5. List any potential concerns

### Pull Requests

#### Before You Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make sure existing tests pass
4. Add tests for new functionality

#### During Development

1. **Follow code style:**
   ```javascript
   // Good: Clear, descriptive names
   async function getUsersByTenant(tenantId, options = {}) {
     const { page = 1, limit = 10 } = options;
     // ...
   }

   // Bad: Unclear names
   async function getUsers(t, o) {
     // ...
   }
   ```

2. **Add comments for complex logic:**
   ```javascript
   // Calculate if user has exceeded project limit based on subscription plan
   const hasExceededLimit = projectCount >= tenant.maxProjects;
   if (hasExceededLimit) {
     return res.status(403).json({
       message: 'Project limit exceeded for subscription plan'
     });
   }
   ```

3. **Write comprehensive commits:**
   ```bash
   git commit -m "Implement project creation with limit checking

   - Add validation to check project count against tenant's subscription plan
   - Return 403 Forbidden if limit exceeded
   - Log tenant_id and project creation to audit logs
   - Add error message indicating which plan is needed for more projects"
   ```

#### Submitting PR

1. Push to your fork
2. Create Pull Request with clear description
3. Link related issues with `#issue-number`
4. Add screenshots if UI changes
5. Request review from maintainers

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issues
Fixes #123

## Testing Done
Describe how you tested changes

## Screenshots (if applicable)
Attach images for UI changes

## Checklist
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

### Code Review Process

1. **Author submits PR** with clear description
2. **Reviewers** check:
   - Code style and quality
   - Test coverage
   - Security implications
   - Performance impact
   - Documentation updates

3. **Feedback** is provided constructively
4. **Author addresses** comments and pushes updates
5. **Approval** from at least 2 reviewers
6. **Merge** to main branch

### Commit Message Guidelines

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style (formatting, semicolons, etc.)
- `refactor:` Code refactoring without new features
- `test:` Adding or updating tests
- `chore:` Build, dependencies, tooling
- `perf:` Performance improvements
- `ci:` CI/CD configuration

**Examples:**
```
feat(auth): implement JWT token refresh mechanism
- Add endpoint for token refresh
- Implement 7-day refresh token expiry
- Update authentication middleware

fix(database): fix N+1 query in listProjects endpoint
- Join users table to get creator names in single query
- Reduce database queries from 5 to 1 per request

docs(api): add authentication section to API documentation
- Explain JWT token format and usage
- Add examples for obtaining and using tokens
```

## Development Standards

### File Organization

```
backend/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Business logic
│   ├── middleware/    # Request middleware
│   ├── routes/        # API routes
│   └── utils/         # Utility functions
├── database/
│   ├── migrations/    # SQL migrations
│   └── seeds/         # Seed data
└── scripts/           # Setup scripts
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `userId`, `tenantId` |
| Constants | UPPER_SNAKE_CASE | `JWT_EXPIRY`, `MAX_USERS` |
| Functions | camelCase | `getUserById()` |
| Classes | PascalCase | `UserController`, `AuthService` |
| Files | camelCase | `authController.js` |
| Database Tables | snake_case | `audit_logs`, `user_roles` |
| Database Columns | snake_case | `created_at`, `is_active` |

### Code Quality Standards

1. **Lint with ESLint** (future)
   ```bash
   npm run lint
   npm run lint:fix
   ```

2. **Format with Prettier** (future)
   ```bash
   npm run format
   ```

3. **Test coverage minimum 80%**
   ```bash
   npm test -- --coverage
   ```

4. **Security scanning**
   ```bash
   npm audit
   npm audit fix
   ```

### Documentation Standards

- **Comments:** Explain WHY, not WHAT
- **JSDoc:** For all public functions
- **README:** Update with feature changes
- **API Documentation:** Update API.md with endpoint changes
- **CHANGELOG:** Document breaking changes

**JSDoc Example:**
```javascript
/**
 * Create new user in tenant
 * @param {string} tenantId - The tenant ID
 * @param {Object} userData - User data object
 * @param {string} userData.email - User email (must be unique in tenant)
 * @param {string} userData.password - Password (8+ characters)
 * @param {string} userData.fullName - User's full name
 * @returns {Promise<Object>} Created user object
 * @throws {Error} If email already exists in tenant or validation fails
 */
async function createUser(tenantId, userData) {
  // Implementation
}
```

## Testing Guidelines

### Unit Tests
```javascript
// Test individual functions
describe('passwordUtils.hashPassword', () => {
  it('should hash password with bcrypt', async () => {
    const password = 'TestPassword123';
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(password);
  });
});
```

### Integration Tests
```javascript
// Test API endpoints with database
describe('POST /api/auth/login', () => {
  it('should return token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'Demo@123',
        tenantSubdomain: 'demo'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### Running Tests
```bash
npm test                      # Run all tests
npm test -- --watch          # Watch mode
npm test -- --coverage       # Coverage report
npm test -- --testPathPattern=auth  # Specific test file
```

## Security Considerations

### When Writing Code

1. **Input Validation:**
   - Validate all user inputs
   - Use Joi schemas (done)
   - Check data types and ranges

2. **SQL Injection Prevention:**
   - Use parameterized queries (done with $1, $2)
   - Never concatenate SQL strings
   - Use query builder or ORM for complex queries

3. **Authentication & Authorization:**
   - Verify JWT tokens on protected routes (done)
   - Extract tenant from token, not request body (done)
   - Check role permissions before operations (done)

4. **Password Security:**
   - Hash with bcrypt 10+ rounds (done)
   - Minimum 8 characters (done)
   - Never log passwords

5. **Data Exposure:**
   - Don't return password hashes to frontend
   - Filter sensitive data from responses
   - Use HTTPS in production

### Reporting Security Issues

**Do NOT create public issue for security vulnerabilities.**

1. Email security team: security@example.com
2. Include vulnerability details
3. Include proof of concept
4. Allow 90 days for fix before public disclosure
5. Will be credited in SECURITY.md upon publication

## Release Process

### Version Numbering (Semantic Versioning)

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (1.X.0): New features (backward compatible)
- **PATCH** (1.0.X): Bug fixes

### Release Steps

1. **Update version in package.json**
   ```bash
   npm version minor  # Automatically updates version and creates git tag
   ```

2. **Update CHANGELOG.md**
   ```markdown
   ## [1.1.0] - 2024-01-20

   ### Added
   - New tenant management features
   - API rate limiting

   ### Fixed
   - Database connection pooling issue
   - Task assignment validation
   ```

3. **Create release notes**
   - Summary of changes
   - Breaking changes (if any)
   - Migration guide (if needed)

4. **Tag and push**
   ```bash
   git push origin --tags
   git push origin main
   ```

5. **Create GitHub release**
   - Use version as title (v1.1.0)
   - Paste release notes
   - Attach any binaries/artifacts

## Questions?

- Open a discussion in GitHub Discussions
- Join our Discord community
- Email team@example.com

## Attribution

Contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub contributor graph
- Release notes (for major contributions)

Thank you for contributing to Multi-Tenant SaaS!
