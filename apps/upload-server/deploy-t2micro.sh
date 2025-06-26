#!/bin/bash

# Upload Server EC2 Deployment Script - t2.micro (Free Tier) Optimized
# Usage: ./deploy-t2micro.sh [production|staging]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
EC2_USER="ubuntu"
EC2_HOST="35.93.212.176"  # Set this to your EC2 instance IP
KEY_PATH="~/.ssh/aws-keys/viralcut-upload-server.pem"  # Your downloaded key
GEMINI_API_KEY="AIzaSyCui3tGPwRHy4mTpKmKFzJpiJUSxhmU28w"  # Set this in environment or prompt

echo -e "${GREEN}🚀 Starting Upload Server Deployment for t2.micro (Free Tier) - ${ENVIRONMENT}${NC}"
echo -e "${BLUE}💡 Using optimized settings for 1 vCPU, 1GB RAM${NC}"

# Check if required variables are set
if [ -z "$EC2_HOST" ]; then
    echo -e "${RED}❌ EC2_HOST is not set. Please edit deploy-t2micro.sh and set your EC2 instance IP${NC}"
    exit 1
fi

if [ -z "$KEY_PATH" ]; then
    echo -e "${RED}❌ KEY_PATH is not set. Please edit deploy-t2micro.sh and set your SSH key path${NC}"
    exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY not set. You'll need to set it on the server.${NC}"
fi

# Function to run commands on EC2
run_remote() {
    ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "$1"
}

# Function to copy files to EC2
copy_to_ec2() {
    scp -i "$KEY_PATH" -r "$1" "$EC2_USER@$EC2_HOST:$2"
}

echo -e "${GREEN}📦 Building and uploading application...${NC}"

# Create a temporary directory for deployment files
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Copy application files
cp -r . "$TEMP_DIR/upload-server"
cd "$TEMP_DIR/upload-server"

# Remove node_modules and other unnecessary files to save bandwidth
rm -rf node_modules dist .cache
rm -f *.log

echo -e "${GREEN}📤 Uploading to EC2 (optimized for t2.micro)...${NC}"

# Upload application to EC2
copy_to_ec2 "$TEMP_DIR/upload-server" "/home/ubuntu/"

echo -e "${GREEN}🔧 Setting up environment on EC2...${NC}"

# Create environment file on EC2
run_remote "cd /home/ubuntu/upload-server && cat > .env << EOF
GEMINI_API_KEY=${GEMINI_API_KEY}
NODE_ENV=${ENVIRONMENT}
PORT=3001
EOF"

# Install Docker with optimizations for t2.micro
echo -e "${GREEN}🐳 Setting up Docker (t2.micro optimized)...${NC}"
run_remote "
if ! command -v docker &> /dev/null; then
    echo 'Installing Docker...'
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu
    
    # Optimize Docker for t2.micro
    sudo mkdir -p /etc/docker
    sudo cat > /etc/docker/daemon.json << EOF
{
  \"log-driver\": \"json-file\",
  \"log-opts\": {
    \"max-size\": \"10m\",
    \"max-file\": \"3\"
  },
  \"storage-driver\": \"overlay2\",
  \"storage-opts\": [
    \"overlay2.override_kernel_check=true\"
  ]
}
EOF
    sudo systemctl restart docker
    echo 'Docker installed and optimized for t2.micro'
else
    echo 'Docker already installed'
fi
"

# Build and deploy with t2.micro settings
echo -e "${GREEN}🏗️  Building and starting services (t2.micro optimized)...${NC}"
run_remote "
cd /home/ubuntu/upload-server

# Stop existing services
sudo docker-compose -f docker-compose.t2micro.yml down || true

# Build with resource constraints
sudo docker-compose -f docker-compose.t2micro.yml build

# Start services
sudo docker-compose -f docker-compose.t2micro.yml up -d

echo 'Services started with t2.micro optimizations'
"

# Wait for services to start (longer for t2.micro)
echo -e "${GREEN}⏳ Waiting for services to start (t2.micro needs more time)...${NC}"
sleep 20

# Test deployment
echo -e "${GREEN}🧪 Testing deployment...${NC}"
HEALTH_CHECK=$(run_remote "curl -s -o /dev/null -w '%{http_code}' http://localhost/health" || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Deployment successful! Health check passed.${NC}"
    echo -e "${GREEN}🌐 Server is running at: http://$EC2_HOST${NC}"
    echo -e "${GREEN}🏥 Health check: http://$EC2_HOST/health${NC}"
    echo -e "${GREEN}📤 Upload endpoint: http://$EC2_HOST/upload/gemini${NC}"
    echo -e "${BLUE}💡 Running on t2.micro with optimized resource usage${NC}"
else
    echo -e "${RED}❌ Deployment may have issues. Health check returned: $HEALTH_CHECK${NC}"
    echo -e "${YELLOW}📋 Checking logs...${NC}"
    run_remote "cd /home/ubuntu/upload-server && sudo docker-compose -f docker-compose.t2micro.yml logs --tail=20"
fi

# Show status and resource usage
echo -e "${GREEN}📊 Service Status:${NC}"
run_remote "cd /home/ubuntu/upload-server && sudo docker-compose -f docker-compose.t2micro.yml ps"

echo -e "${GREEN}💾 Memory Usage:${NC}"
run_remote "free -h"

# Clean up
rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 t2.micro deployment completed!${NC}"
echo ""
echo -e "${YELLOW}t2.micro Free Tier Notes:${NC}"
echo "• ✅ 750 hours/month free (about 31 days)"
echo "• ✅ 1 GB RAM, 1 vCPU (sufficient for this workload)"
echo "• ✅ 30 GB EBS storage free"
echo "• ⚠️  Network performance: Low to Moderate"
echo "• ⚠️  Suitable for development and low-moderate traffic"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test with small video files first (< 100MB)"
echo "2. Monitor memory usage: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'free -h'"
echo "3. Check container status: 'sudo docker-compose -f docker-compose.t2micro.yml ps'"
echo "4. View logs: 'sudo docker-compose -f docker-compose.t2micro.yml logs -f'" 