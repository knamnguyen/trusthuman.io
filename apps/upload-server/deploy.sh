#!/bin/bash

# Upload Server EC2 Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
EC2_USER="ubuntu"
EC2_HOST=""  # Set this to your EC2 instance IP
KEY_PATH=""  # Set this to your SSH key path
GEMINI_API_KEY=""  # Set this in environment or prompt

echo -e "${GREEN}🚀 Starting Upload Server Deployment (${ENVIRONMENT})${NC}"

# Check if required variables are set
if [ -z "$EC2_HOST" ]; then
    echo -e "${RED}❌ EC2_HOST is not set. Please edit deploy.sh and set your EC2 instance IP${NC}"
    exit 1
fi

if [ -z "$KEY_PATH" ]; then
    echo -e "${RED}❌ KEY_PATH is not set. Please edit deploy.sh and set your SSH key path${NC}"
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

# Remove node_modules and other unnecessary files
rm -rf node_modules dist .cache
rm -f *.log

echo -e "${GREEN}📤 Uploading to EC2...${NC}"

# Upload application to EC2
copy_to_ec2 "$TEMP_DIR/upload-server" "/home/ubuntu/"

echo -e "${GREEN}🔧 Setting up environment on EC2...${NC}"

# Create environment file on EC2
run_remote "cd /home/ubuntu/upload-server && cat > .env << EOF
GEMINI_API_KEY=${GEMINI_API_KEY}
NODE_ENV=${ENVIRONMENT}
PORT=3001
EOF"

# Install Docker if not installed
echo -e "${GREEN}🐳 Setting up Docker...${NC}"
run_remote "
if ! command -v docker &> /dev/null; then
    echo 'Installing Docker...'
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu
    echo 'Docker installed successfully'
else
    echo 'Docker already installed'
fi
"

# Build and deploy
echo -e "${GREEN}🏗️  Building and starting services...${NC}"
run_remote "
cd /home/ubuntu/upload-server
sudo docker-compose down || true
sudo docker-compose build
sudo docker-compose up -d
"

# Wait for services to start
echo -e "${GREEN}⏳ Waiting for services to start...${NC}"
sleep 10

# Test deployment
echo -e "${GREEN}🧪 Testing deployment...${NC}"
HEALTH_CHECK=$(run_remote "curl -s -o /dev/null -w '%{http_code}' http://localhost/health")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Deployment successful! Health check passed.${NC}"
    echo -e "${GREEN}🌐 Server is running at: http://$EC2_HOST${NC}"
    echo -e "${GREEN}🏥 Health check: http://$EC2_HOST/health${NC}"
    echo -e "${GREEN}📤 Upload endpoint: http://$EC2_HOST/upload/gemini${NC}"
else
    echo -e "${RED}❌ Deployment may have issues. Health check returned: $HEALTH_CHECK${NC}"
    echo -e "${YELLOW}📋 Checking logs...${NC}"
    run_remote "cd /home/ubuntu/upload-server && sudo docker-compose logs"
fi

# Show status
echo -e "${GREEN}📊 Service Status:${NC}"
run_remote "cd /home/ubuntu/upload-server && sudo docker-compose ps"

# Clean up
rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 Deployment script completed!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up SSL certificates if needed"
echo "2. Configure your domain to point to $EC2_HOST"
echo "3. Update your Next.js app to use the new endpoint"
echo "4. Monitor logs: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'cd upload-server && sudo docker-compose logs -f'" 