#!/bin/bash

# COAL_BLEND Docker Deployment Script

set -e  # Exit on any error

echo "🚀 Starting COAL_BLEND deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it first."
    exit 1
fi

# Set version tag (default to latest)
VERSION=${1:-latest}
print_status "Building version: $VERSION"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

# Remove old images (optional)
if [ "$2" = "--clean" ]; then
    print_status "Cleaning old images..."
    docker image prune -f
    docker system prune -f
fi

# Build images
print_status "Building Docker images..."
docker-compose build --no-cache

# Tag images with version
print_status "Tagging images with version: $VERSION"
docker tag coal_blend_backend:latest coal-blend-backend:$VERSION
docker tag coal_blend_frontend:latest coal-blend-frontend:$VERSION

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."
if docker-compose ps | grep -q "unhealthy"; then
    print_error "Some services are unhealthy. Check logs with: docker-compose logs"
    docker-compose logs
    exit 1
fi

# Show running containers
print_status "Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Documentation: http://localhost:8000/docs"
echo ""
echo "📝 Useful Commands:"
echo "   View logs: docker-compose logs"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update services: ./deploy.sh $VERSION --clean" 