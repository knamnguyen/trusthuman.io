# AWS EC2 Deployment Guide for Upload Server

This guide walks you through deploying the upload server to AWS EC2 using Docker.

## Overview

- **Server**: Hono.js with Bun runtime
- **Deployment**: Docker containers on EC2
- **Reverse Proxy**: Nginx for load balancing and SSL
- **Instance Type**: t3.small recommended (2 vCPU, 2GB RAM)

## Prerequisites

1. AWS Account with EC2 access
2. AWS CLI installed and configured
3. Docker installed locally (for testing)
4. Domain name (optional, for SSL)

## Step 1: Create EC2 Instance

### Launch Instance

```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=upload-server}]'
```

### Or use AWS Console:

1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Choose **Ubuntu Server 22.04 LTS**
4. Select **t3.small** instance type
5. Configure security group (see below)
6. Launch with your key pair

### Security Group Rules

```
Inbound Rules:
- Type: SSH, Port: 22, Source: Your IP
- Type: HTTP, Port: 80, Source: 0.0.0.0/0
- Type: HTTPS, Port: 443, Source: 0.0.0.0/0
- Type: Custom TCP, Port: 3001, Source: 0.0.0.0/0 (for testing)

Outbound Rules:
- All traffic: 0.0.0.0/0
```

## Step 2: Connect to EC2 Instance

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

## Step 3: Install Docker and Docker Compose

```bash
# Install Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes to take effect
exit
```

## Step 4: Deploy the Application

### Option A: Direct Docker Build (Recommended for Development)

```bash
# SSH back into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Clone your repository (or upload files)
git clone https://github.com/your-username/your-repo.git
cd your-repo/apps/upload-server

# Create environment file
sudo nano .env
```

Add to `.env`:

```bash
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
PORT=3001
```

```bash
# Build and run with Docker
sudo docker build -t upload-server .
sudo docker run -d \
  --name upload-server \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file .env \
  upload-server

# Check if running
sudo docker ps
sudo docker logs upload-server
```

### Option B: Docker Compose with Nginx (Recommended for Production)

```bash
# Create docker-compose.yml
sudo nano docker-compose.yml
```

```yaml
version: "3.8"

services:
  upload-server:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    networks:
      - upload-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - upload-server
    restart: unless-stopped
    networks:
      - upload-network

networks:
  upload-network:
    driver: bridge
```

Create Nginx config:

```bash
sudo nano nginx.conf
```

```nginx
events {
    worker_connections 1024;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Large file upload support
    client_max_body_size 2G;
    client_body_timeout 300s;
    client_header_timeout 300s;
    send_timeout 300s;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=upload:10m rate=10r/m;

    upstream upload_backend {
        server upload-server:3001;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        # Health check
        location /health {
            proxy_pass http://upload_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Upload endpoints with rate limiting
        location /upload {
            limit_req zone=upload burst=5 nodelay;

            proxy_pass http://upload_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Large file upload settings
            proxy_request_buffering off;
            proxy_buffering off;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }

        location / {
            return 404;
        }
    }
}
```

Start services:

```bash
# Start with docker-compose
sudo docker-compose up -d

# Check status
sudo docker-compose ps
sudo docker-compose logs
```

## Step 5: Configure SSL (Optional but Recommended)

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Setup

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Copy your SSL certificates
sudo cp your-cert.pem /etc/nginx/ssl/cert.pem
sudo cp your-key.pem /etc/nginx/ssl/key.pem

# Update nginx.conf to include HTTPS server block
# (uncomment the HTTPS section in the nginx.conf)
```

## Step 6: Configure Domain and Load Balancer (Optional)

### Using Application Load Balancer

1. Create Application Load Balancer in AWS Console
2. Configure target group pointing to your EC2 instance:3001
3. Set up health check: `/health`
4. Configure listeners (HTTP:80, HTTPS:443)
5. Associate with your domain in Route 53

## Step 7: Monitoring and Maintenance

### CloudWatch Logs

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure to send Docker logs to CloudWatch
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

### Log Monitoring

```bash
# View real-time logs
sudo docker-compose logs -f upload-server

# View system resources
sudo docker stats

# Check disk usage
df -h
```

### Backup Strategy

```bash
# Create backup script
sudo nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
# Backup application data and configurations
tar -czf /home/ubuntu/upload-server-backup-$(date +%Y%m%d).tar.gz \
  /home/ubuntu/your-repo/apps/upload-server \
  /etc/nginx/ssl

# Keep only last 7 days of backups
find /home/ubuntu -name "upload-server-backup-*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable and add to cron
sudo chmod +x /home/ubuntu/backup.sh
sudo crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

## Step 8: Testing the Deployment

```bash
# Test health endpoint
curl http://your-instance-ip/health

# Test upload endpoint (with a small video file)
curl -X POST -F "file=@test-video.mp4" http://your-instance-ip/upload/gemini
```

## Environment Variables

Required environment variables:

```bash
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
PORT=3001
```

## Scaling Considerations

### Horizontal Scaling

- Use Application Load Balancer
- Deploy multiple EC2 instances
- Use Auto Scaling Groups

### Vertical Scaling

- Upgrade to larger instance types (t3.medium, t3.large)
- Increase EBS volume size if needed

### Database Considerations

- Consider using RDS for session storage if needed
- Use Redis for caching upload status

## Cost Optimization

### Estimated Monthly Costs

- **t3.small**: ~$15-20/month
- **Data transfer**: Varies by usage
- **EBS storage**: ~$1-2/month (20GB)
- **Load Balancer** (optional): ~$16/month

### Cost Reduction Tips

- Use Reserved Instances for predictable workloads
- Set up billing alerts
- Use CloudWatch to monitor resource utilization
- Consider spot instances for development environments

## Troubleshooting

### Common Issues

1. **Connection Refused**

   ```bash
   sudo docker ps  # Check if container is running
   sudo docker logs upload-server  # Check application logs
   ```

2. **File Upload Fails**

   ```bash
   # Check nginx logs
   sudo docker-compose logs nginx

   # Check application logs
   sudo docker-compose logs upload-server
   ```

3. **High Memory Usage**

   ```bash
   # Monitor resources
   sudo docker stats

   # Restart containers if needed
   sudo docker-compose restart
   ```

4. **SSL Issues**

   ```bash
   # Check certificate validity
   sudo certbot certificates

   # Renew if needed
   sudo certbot renew
   ```

## Security Best Practices

1. **Firewall Configuration**

   ```bash
   # Enable UFW firewall
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   ```

2. **Regular Updates**

   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Update Docker images
   sudo docker-compose pull
   sudo docker-compose up -d
   ```

3. **SSH Hardening**

   ```bash
   # Edit SSH config
   sudo nano /etc/ssh/sshd_config

   # Disable password authentication
   # PasswordAuthentication no
   # PubkeyAuthentication yes

   sudo systemctl restart ssh
   ```

## Performance Tuning

### Nginx Optimization

```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 2048;

# Enable compression
gzip on;
gzip_vary on;
gzip_min_length 10240;
gzip_comp_level 6;
```

### Docker Resource Limits

```yaml
# Add to docker-compose.yml
services:
  upload-server:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

This guide provides a complete deployment strategy for your upload server on AWS EC2 with Docker!
