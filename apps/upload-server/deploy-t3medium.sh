#!/bin/bash

# Deploy script for t3.medium instance
# This script deploys the upload server on a larger EC2 instance

set -e  # Exit on any error

# Configuration
INSTANCE_TYPE="t3.medium"
COMPOSE_FILE="docker-compose.t3medium.yml"
NGINX_CONFIG="nginx.t3medium.conf"

echo "🚀 Starting deployment on ${INSTANCE_TYPE} instance..."

# Check if required files exist
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found"
    exit 1
fi

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Error: $NGINX_CONFIG not found"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create it with your GEMINI_API_KEY"
    exit 1
fi

echo "✅ Configuration files verified"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.yml down 2>/dev/null || true
docker-compose -f docker-compose.t2micro.yml down 2>/dev/null || true
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Remove any existing containers and networks
echo "🧹 Cleaning up existing resources..."
docker container prune -f 2>/dev/null || true
docker network prune -f 2>/dev/null || true

# Build and start services
echo "🏗️  Building and starting services with $COMPOSE_FILE..."
docker-compose -f "$COMPOSE_FILE" build --no-cache
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose -f "$COMPOSE_FILE" ps

# Test basic connectivity
echo "🧪 Testing basic connectivity..."
sleep 10

# Get the nginx container name
NGINX_CONTAINER=$(docker-compose -f "$COMPOSE_FILE" ps -q nginx)

if [ -n "$NGINX_CONTAINER" ]; then
    echo "✅ Nginx container is running: $NGINX_CONTAINER"
    
    # Test health endpoint
    if curl -f http://localhost/health >/dev/null 2>&1; then
        echo "✅ Health check endpoint is responding"
    else
        echo "⚠️  Health check endpoint not responding yet"
    fi
else
    echo "❌ Nginx container not found"
    docker-compose -f "$COMPOSE_FILE" logs nginx
    exit 1
fi

# Show logs for debugging
echo "📋 Recent nginx logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20 nginx

echo "📋 Recent upload-server logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20 upload-server

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Instance Configuration:"
echo "   - Instance Type: $INSTANCE_TYPE"
echo "   - Memory: 4GB (vs 1GB on t2.micro)"
echo "   - vCPU: 2 (vs 1 on t2.micro)"
echo "   - Network: Up to 5 Gbps (vs limited on t2.micro)"
echo ""
echo "🔧 Nginx Configuration Optimizations:"
echo "   - client_max_body_size: 0 (unlimited)"
echo "   - worker_connections: 2048"
echo "   - Extended timeouts: 600s"
echo "   - Proxy buffering: disabled"
echo ""
echo "🧪 Testing Commands:"
echo "   Small file:  curl -X POST -F \"file=@small.txt\" http://[INSTANCE_IP]/upload/gemini"
echo "   Large file:  curl -X POST -F \"file=@large.mp4\" http://[INSTANCE_IP]/upload/gemini --max-time 600"
echo ""
echo "📊 Monitor with:"
echo "   docker-compose -f $COMPOSE_FILE logs -f"
echo "   docker stats" 