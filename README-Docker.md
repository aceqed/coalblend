# COAL_BLEND - Docker Setup

This document explains how to run the COAL_BLEND application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Clone the repository** (if not already done):

   ```bash
   git clone <your-repo-url>
   cd COAL_BLEND
   ```

2. **Set up environment variables**:

   ```bash
   # Copy the example environment file
   cp backend/env.example backend/.env

   # Edit the .env file with your configuration
   nano backend/.env
   ```

3. **Build and run the application**:

   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Services

The application consists of three main services:

### 1. PostgreSQL Database

- **Port**: 5432
- **Database**: QED
- **User**: coal_user
- **Password**: coal_password

### 2. Backend API (FastAPI)

- **Port**: 8000
- **Framework**: FastAPI with Uvicorn
- **Workers**: 4 (for better concurrency)
- **Health Check**: /verify-token endpoint

### 3. Frontend (React + Vite)

- **Port**: 3000
- **Framework**: React with Vite
- **Server**: Nginx
- **Build**: Multi-stage Docker build

## Docker Commands

### Start all services

```bash
docker-compose up
```

### Start in background

```bash
docker-compose up -d
```

### Rebuild and start

```bash
docker-compose up --build
```

### Stop all services

```bash
docker-compose down
```

### Stop and remove volumes

```bash
docker-compose down -v
```

### View logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Access containers

```bash
# Backend container
docker-compose exec backend bash

# Frontend container
docker-compose exec frontend sh

# Database container
docker-compose exec postgres psql -U coal_user -d coal_blend
```

## Development

### Running individual services

#### Backend only

```bash
cd backend
docker build -t coal-blend-backend .
docker run -p 8000:8000 --env-file .env coal-blend-backend
```

#### Frontend only

```bash
cd frontend
docker build -t coal-blend-frontend .
docker run -p 3000:80 coal-blend-frontend
```

### Hot reloading (Development)

For development with hot reloading, you can run services individually:

#### Backend (with hot reload)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend (with hot reload)

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env file)

```env
DATABASE_URL=postgresql://coal_user:coal_password@postgres:5432/coal_blend
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=INFO
```

## Production Deployment

### 1. Update environment variables

- Change `SECRET_KEY` to a strong, unique key
- Update `DATABASE_URL` for your production database
- Set `ALLOWED_ORIGINS` to your production domain

### 2. Build production images

```bash
docker-compose -f docker-compose.prod.yml up --build
```

### 3. Use a reverse proxy (recommended)

- Nginx or Traefik for SSL termination
- Load balancing for multiple instances

## Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Check what's using the port
   lsof -i :8000
   lsof -i :3000

   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database connection issues**

   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres

   # Check logs
   docker-compose logs postgres
   ```

3. **Build failures**

   ```bash
   # Clean up and rebuild
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

4. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Health Checks

All services include health checks. You can monitor them:

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect coal_blend_backend | grep -A 10 Health
```

## Performance Optimization

### For Production

1. **Increase workers** (in backend/Dockerfile):

   ```dockerfile
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "8"]
   ```

2. **Add resource limits** (in docker-compose.yml):

   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 1G
             cpus: "0.5"
   ```

3. **Use external database** for better performance and scalability

## Security Considerations

1. **Change default passwords** in production
2. **Use secrets management** for sensitive data
3. **Enable HTTPS** with proper SSL certificates
4. **Regular security updates** for base images
5. **Network isolation** using Docker networks

## Support

If you encounter any issues:

1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all prerequisites are installed
4. Check Docker and Docker Compose versions
