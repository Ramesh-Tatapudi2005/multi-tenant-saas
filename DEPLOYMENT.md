# Deployment Guide

## Docker Deployment (Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 1.29+

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-tenant-saas
   ```

2. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

3. **Verify services are running**
   ```bash
   docker-compose ps
   ```
   Expected output:
   ```
   NAME      IMAGE              STATUS       PORTS
   database  postgres:15-alpine Healthy      0.0.0.0:5432->5432/tcp
   backend   multi-saas-backend Healthy      0.0.0.0:5000->5000/tcp
   frontend  multi-saas-frontend Healthy     0.0.0.0:3000->3000/tcp
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

5. **View logs**
   ```bash
   docker-compose logs -f          # All services
   docker-compose logs -f backend  # Specific service
   ```

6. **Stop services**
   ```bash
   docker-compose down
   ```

### Docker Commands

```bash
# Start services in background
docker-compose up -d

# Start services in foreground (see logs)
docker-compose up

# Stop services
docker-compose stop

# Remove containers (keep volumes)
docker-compose down

# Remove containers and volumes (fresh start)
docker-compose down -v

# Rebuild images
docker-compose build

# Rebuild specific service
docker-compose build backend

# Execute command in container
docker-compose exec backend npm run migrate

# View service logs
docker-compose logs -f backend

# Check service health
docker-compose ps

# Scale service (multiple instances)
docker-compose up -d --scale backend=3  # Not recommended due to database constraints
```

### Database Management in Docker

```bash
# Connect to database container
docker-compose exec database psql -U postgres -d saas_db

# Backup database
docker-compose exec database pg_dump -U postgres saas_db > backup.sql

# Restore database
docker-compose exec -T database psql -U postgres saas_db < backup.sql

# View database logs
docker-compose logs database

# Check database size
docker-compose exec database psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('saas_db'));"
```

### Environment Configuration for Docker

The `docker-compose.yml` file includes:

```yaml
# Database service
postgres:15-alpine
  POSTGRES_DB: saas_db
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres

# Backend service
node:18-alpine
  DB_HOST: database
  DB_PORT: 5432
  DB_NAME: saas_db
  DB_USER: postgres
  DB_PASSWORD: postgres
  JWT_SECRET: <32+ character secret>
  PORT: 5000
  FRONTEND_URL: http://frontend:3000

# Frontend service
node:18-alpine + serve
  REACT_APP_API_URL: http://backend:5000/api
  PORT: 3000
```

**Important:** Change JWT_SECRET in docker-compose.yml before production deployment.

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update JWT_SECRET to secure random value (32+ characters)
- [ ] Change database password (postgres)
- [ ] Set NODE_ENV=production in backend
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure domain name and DNS
- [ ] Set up monitoring and alerting
- [ ] Configure backups and disaster recovery
- [ ] Test backup restoration procedures
- [ ] Configure rate limiting
- [ ] Set up CDN for static assets (frontend)
- [ ] Review security settings
- [ ] Load test with production expected traffic

### Production Environment Variables

**Backend (.env):**
```
DB_HOST=<managed-database-host>
DB_PORT=5432
DB_NAME=saas_db
DB_USER=<secure-username>
DB_PASSWORD=<secure-password>
JWT_SECRET=<generate-secure-random-value>
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

**Frontend (.env):**
```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### Cloud Deployment Options

#### AWS ECS (Elastic Container Service)
```bash
# 1. Push images to ECR (Elastic Container Registry)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag multi-saas-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/multi-saas-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/multi-saas-backend:latest

# 2. Create ECS task definition
# 3. Create ECS service
# 4. Configure load balancer
# 5. Configure RDS database
```

#### Google Cloud Run
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/multi-saas-backend

# Deploy to Cloud Run
gcloud run deploy multi-saas-backend \
  --image gcr.io/PROJECT_ID/multi-saas-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DB_HOST=<cloudsql-ip>,DB_PASSWORD=<password>
```

#### Azure Container Instances
```bash
# Push to Azure Container Registry
az acr build --registry <registry-name> --image multi-saas-backend:latest .

# Deploy container
az container create \
  --resource-group <group> \
  --name multi-saas-backend \
  --image <registry>.azurecr.io/multi-saas-backend:latest \
  --environment-variables DB_HOST=<instance> DB_PASSWORD=<password>
```

#### DigitalOcean App Platform (Recommended for Startups)
```bash
# 1. Connect GitHub repository
# 2. Configure build commands
# 3. Set environment variables in App Platform UI
# 4. Connect managed PostgreSQL database
# 5. Deploy automatically on git push
```

### Kubernetes Deployment

**Create deployment manifests** in `k8s/` directory:

```yaml
# k8s/backend-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-saas-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: <registry>/multi-saas-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
```

**Deploy to Kubernetes:**
```bash
kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/frontend-deployment.yml
kubectl apply -f k8s/database-service.yml
```

### Database Configuration for Production

**Options:**

1. **Managed Database Service** (Recommended)
   - AWS RDS PostgreSQL
   - Google Cloud SQL
   - Azure Database for PostgreSQL
   - DigitalOcean Managed Database
   - Benefits: Automated backups, high availability, patching

2. **Self-Hosted Database**
   - Set up PostgreSQL on dedicated server
   - Configure replication for high availability
   - Schedule daily backups
   - Monitor disk space and performance

**Production Database Setup:**
```sql
-- Create dedicated database user (not postgres)
CREATE USER app_user WITH PASSWORD '<secure-password>';
CREATE DATABASE saas_db OWNER app_user;

-- Grant permissions
GRANT CONNECT ON DATABASE saas_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;

-- Enable automated backups
-- Configure point-in-time recovery
-- Set up replication for disaster recovery
```

## Monitoring & Logging

### Application Monitoring

```bash
# Health check endpoint
curl https://api.yourdomain.com/api/health

# Set up uptime monitoring with:
# - UptimeRobot
# - New Relic
# - DataDog
# - Prometheus + Grafana
```

### Application Logging

**Current:** Logs to console (captured by Docker/container orchestration)

**Production Recommendation:** Implement structured logging
```javascript
const logger = require('winston');

logger.info('User login', {
  userId: user.id,
  tenantId: user.tenantId,
  timestamp: new Date()
});
```

Configure log aggregation:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- AWS CloudWatch
- Google Cloud Logging
- Azure Monitor

### Database Monitoring

```sql
-- Monitor query performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC;

-- Monitor table size
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');

-- Monitor connections
SELECT datname, usename, count(*) 
FROM pg_stat_activity 
GROUP BY datname, usename;
```

## Scaling Strategies

### Horizontal Scaling

1. **API Layer**
   - Run multiple backend instances
   - Use load balancer (nginx, HAProxy, AWS ELB)
   - Sessions are stateless (JWT), so any instance can serve request

2. **Frontend Layer**
   - Serve static files from CDN
   - Use origin pull or push to CDN
   - Enable caching for immutable assets

3. **Database Layer**
   - Read replicas for SELECT queries
   - Write to primary node
   - Connection pooling (PgBouncer, pgpool)

### Vertical Scaling

1. **Database**
   - Increase memory (better caching)
   - Use SSD storage (faster I/O)
   - Optimize queries and indexes

2. **Backend Servers**
   - Increase CPU cores
   - Increase available memory
   - Enable clustering (Node.js cluster module)

### Caching Strategies

```javascript
// Add Redis for caching (future implementation)
const redis = require('redis');
const client = redis.createClient({
  host: 'redis-server',
  port: 6379
});

// Cache GET /projects response
app.get('/projects', async (req, res) => {
  const cacheKey = `projects:${req.user.tenantId}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch from DB
  const projects = await db.query('SELECT * FROM projects WHERE tenant_id = $1', [req.user.tenantId]);
  
  // Cache for 5 minutes
  await client.setex(cacheKey, 300, JSON.stringify(projects));
  res.json(projects);
});
```

## Backup & Disaster Recovery

### Database Backups

```bash
# Daily backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T database pg_dump -U postgres saas_db > backups/saas_db_$TIMESTAMP.sql

# Weekly upload to S3
aws s3 cp backups/saas_db_*.sql s3://backup-bucket/database/

# Keep only last 30 days
find backups/ -name "saas_db_*.sql" -mtime +30 -delete
```

### Recovery Procedure

```bash
# 1. Restore from backup
docker-compose exec -T database psql -U postgres saas_db < backups/saas_db_20240120_143000.sql

# 2. Verify data integrity
docker-compose exec database psql -U postgres -d saas_db -c "SELECT COUNT(*) FROM users;"

# 3. Restart services if needed
docker-compose restart backend frontend
```

## SSL/TLS Configuration

### Let's Encrypt with nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Compose with nginx-proxy

```yaml
version: '3.8'
services:
  nginx-proxy:
    image: jwilder/nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./certs:/etc/nginx/certs

  backend:
    # ... your config ...
    environment:
      - VIRTUAL_HOST=api.yourdomain.com
      - VIRTUAL_PORT=5000
      - LETSENCRYPT_HOST=api.yourdomain.com
```

## Troubleshooting Production Issues

### 502 Bad Gateway
- Check backend health: `curl http://localhost:5000/api/health`
- Verify database connection
- Check logs: `docker-compose logs backend`

### Database Connection Pool Exhausted
```javascript
// Increase pool size in backend/src/config/database.js
const pool = new Pool({
  max: 50  // Increase from 20 if needed
});
```

### High Memory Usage
- Check for memory leaks: `docker stats`
- Implement query result pagination
- Add caching layer

### Slow Queries
```sql
-- Enable query logging
SET log_duration = on;
SET log_statement = 'all';
SET log_min_duration_statement = 1000;  -- Log queries slower than 1 second

-- Check slow query log
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC;
```

## Security Hardening

### production Checklist
- [ ] Use HTTPS/TLS for all connections
- [ ] Set secure JWT_SECRET (min 32 characters)
- [ ] Configure CORS for specific domains
- [ ] Implement rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable database encryption at rest
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Implement DDoS protection
- [ ] Set security headers (Content-Security-Policy, etc.)
- [ ] Implement logging and monitoring
- [ ] Regular security audits and penetration testing
