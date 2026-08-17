# LoadYar Backend - Deployment Guide

## Quick Start

### Local Development
```bash
# Copy environment template
cp .env.template .env.local

# Edit with your local settings
nano .env.local

# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f api
```

### Staging Deployment
```bash
# Push to develop branch
git push origin develop

# GitHub Actions will:
# 1. Run linters and tests
# 2. Build Docker image
# 3. Deploy to staging server
# 4. Run smoke tests

# View deployment status
# GitHub Actions > CI/CD Pipeline > Deploy to Staging
```

### Production Deployment
```bash
# Create release tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push to main branch (merges develop via PR)
git push origin main
git push origin v1.0.0

# GitHub Actions will:
# 1. Run full test suite
# 2. Security scan (Trivy, npm audit)
# 3. Build production Docker image
# 4. Deploy to production
# 5. Run health checks
# 6. Notify Slack on failure
```

---

## Environment Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 16 (or use Docker)
- Git

### Environment Variables

**Required for Production:**
```bash
NODE_ENV=production
DB_PASSWORD=your_secure_password
JWT_SECRET=your_super_secret_key
PGADMIN_PASSWORD=your_pgadmin_password
```

**Optional (with defaults):**
- `LOG_LEVEL` (default: info)
- `CORS_ORIGIN` (default: http://localhost:3000)
- `DB_SSL` (default: false)
- `BCRYPT_ROUNDS` (default: 10)

See `.env.template` for complete list.

---

## Docker Deployment

### Build Image Locally
```bash
docker build -f backend/Dockerfile -t loadyar-api:latest ./backend
```

### Run with Docker Compose
```bash
# Development
docker-compose up -d

# Production (with env file)
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Health Checks
```bash
# Service health
curl http://localhost:3001/api/v1/health

# Readiness check (for load balancers)
curl http://localhost:3001/api/v1/health/readiness

# Liveness check (for Kubernetes)
curl http://localhost:3001/api/v1/health/liveness

# Metrics
curl http://localhost:3001/api/v1/health/metrics
```

---

## Database Migrations

### Running Migrations
```bash
# Inside container
docker-compose exec api npm run typeorm:migration:run

# Or manually
docker exec loadyar-api npm run typeorm:migration:run
```

### Creating New Migrations
```bash
npm run typeorm:migration:generate -- -n CreateNewTable
```

### Reverting Migrations
```bash
docker-compose exec api npm run typeorm:migration:revert
```

### Database Backup
```bash
# Automatic daily backup (2 AM) via container cron
# Manual backup:
docker exec loadyar-postgres pg_dump -U loadyar loadyar > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup:
docker exec -i loadyar-postgres psql -U loadyar loadyar < backup_20260817_120000.sql
```

---

## Monitoring & Logging

### Access Logs
```bash
# Real-time logs
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api

# Filter by timestamp
docker-compose logs --since 2026-08-17 api

# View error logs
docker-compose logs api 2>&1 | grep ERROR
```

### Log Files (in container)
```
/app/logs/
├── combined.log      # All logs
├── error.log         # Errors only
├── performance.log   # Debug/performance
└── daily/            # Daily rotated logs
```

### Database Management (pgAdmin)
- URL: http://localhost:5050
- Username: admin@loadyar.local
- Password: (from PGADMIN_PASSWORD env var)

---

## CI/CD Pipeline

### GitHub Actions Workflow

**Trigger:** Push to `main` or `develop` branch, or PR

**Stages:**
1. **Lint** - ESLint, Prettier
2. **Test** - Jest unit & e2e tests
3. **Security** - Trivy vulnerability scan, npm audit
4. **Build** - Docker image build & push to registry
5. **Deploy (Staging)** - Deploy to staging on `develop` push
6. **Deploy (Production)** - Deploy to production on `main` push

**Secrets Required:**
```
STAGING_DEPLOY_KEY       # SSH private key
STAGING_DEPLOY_HOST      # Server hostname
STAGING_DEPLOY_USER      # SSH user
PROD_DEPLOY_KEY          # SSH private key
PROD_DEPLOY_HOST         # Server hostname
PROD_DEPLOY_USER         # SSH user
SLACK_WEBHOOK_URL        # Slack notification webhook
```

### Adding Secrets to GitHub
```bash
# Via CLI
gh secret set STAGING_DEPLOY_KEY < ~/.ssh/deploy_key
gh secret set STAGING_DEPLOY_HOST --body "staging.loadyar.pk"

# Or via GitHub web UI: Settings > Secrets and variables > Actions
```

---

## Scaling & Performance

### Horizontal Scaling
```bash
# Run multiple API instances behind load balancer
docker-compose up -d --scale api=3

# Use Nginx or HAProxy for load balancing
```

### Vertical Scaling
```bash
# Increase container resources in docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Database Optimization
```bash
# Check query performance
docker exec loadyar-postgres psql -U loadyar -d loadyar -c \
  "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"

# Create indexes
docker exec loadyar-postgres psql -U loadyar -d loadyar -c \
  "CREATE INDEX idx_trips_status ON trips(status) WHERE deleted_at IS NULL;"
```

---

## Rollback Procedures

### Quick Rollback (Docker)
```bash
# Get previous image tag
docker images | grep loadyar-api

# Stop current container
docker-compose stop api

# Start with previous image
docker-compose -f docker-compose.prod.yml up -d --no-deps --build api

# Or specify image explicitly
IMAGE=loadyar-api:previous-tag docker-compose up -d --no-deps api
```

### Database Rollback
```bash
# Revert last migration
docker-compose exec api npm run typeorm:migration:revert

# Restore from backup (see Database Backup section)
```

### Kubernetes Rollout (if using K8s)
```bash
kubectl rollout undo deployment/loadyar-api
kubectl rollout history deployment/loadyar-api
```

---

## Production Checklist

### Pre-Deployment
- [ ] All tests passing (lint, unit, e2e)
- [ ] Security scan clean (no critical vulnerabilities)
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL/TLS certificates valid
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Sentry/error tracking configured
- [ ] Monitoring/alerting configured
- [ ] Slack notifications working

### Post-Deployment
- [ ] Health checks passing
- [ ] Database accessible
- [ ] All endpoints responding
- [ ] Auth working (login, token generation)
- [ ] Logs collecting properly
- [ ] No error spikes in logs
- [ ] Metrics dashboard updated
- [ ] Team notified

### Weekly
- [ ] Database backups verified (test restore)
- [ ] Log rotation working
- [ ] Disk space available (80%+ alert)
- [ ] Memory usage normal
- [ ] No slow queries detected
- [ ] Security updates available

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs api

# Verify environment variables
docker-compose config | grep -A5 "api:"

# Check port conflicts
lsof -i :3001

# Rebuild image
docker-compose build --no-cache api
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker exec loadyar-postgres psql -U loadyar -d loadyar -c "SELECT 1;"

# Check environment variables
docker-compose exec api env | grep DB_
```

### Out of Memory
```bash
# Check current usage
docker stats

# Increase container memory limit
# Edit docker-compose.yml, restart:
docker-compose restart api

# Check memory leaks in logs
docker-compose logs api | grep "OutOfMemory"
```

### High CPU Usage
```bash
# Profile CPU usage
docker exec loadyar-api node --prof app.js

# Generate profile report
node --prof-process isolate-*.log > profile.txt

# Check for infinite loops or slow queries
grep "query" logs/performance.log | sort | uniq -c | sort -rn
```

---

## Disaster Recovery

### Full System Restore
1. Restore PostgreSQL from backup
2. Rebuild Docker image
3. Restart containers
4. Verify health checks
5. Run migrations

### Corruption Recovery
```bash
# Stop affected containers
docker-compose stop

# Backup current data
docker run --rm -v loadyar_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Remove damaged volume
docker volume rm loadyar_postgres_data

# Restore from backup
docker run --rm -v loadyar_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /data

# Restart
docker-compose up -d
```

---

## Support

For deployment issues:
1. Check GitHub Actions logs: https://github.com/your-org/loadyar/actions
2. Check server logs: `docker-compose logs api`
3. Check database: pgAdmin at http://localhost:5050
4. Review this guide section relevant to the error
5. Open issue with logs attached

---

**Version:** 1.0.0  
**Last Updated:** 2026-08-17  
**Maintained By:** DevOps Team
