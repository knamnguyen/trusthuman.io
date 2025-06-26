# Quick Deploy Guide - Upload Server to AWS EC2

## 🚀 One-Command Deployment

This guide helps you deploy the upload server to AWS EC2 in minutes.

## Prerequisites

1. **AWS EC2 Instance** running Ubuntu 22.04
2. **SSH Key** for accessing the instance
3. **Gemini API Key** from Google AI Studio
4. **Security Group** allowing ports 22, 80, 443

## Step 1: Launch EC2 Instance

### Quick Launch (AWS Console):

1. Go to EC2 Dashboard → Launch Instance
2. **Name**: `upload-server-production`
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance Type**: `t3.small` (2 vCPU, 2GB RAM)
5. **Key Pair**: Create or select existing
6. **Security Group**: Create with these rules:
   ```
   SSH (22) - Your IP
   HTTP (80) - 0.0.0.0/0
   HTTPS (443) - 0.0.0.0/0
   ```
7. **Storage**: 20GB GP3
8. Launch Instance

### Or using AWS CLI:

```bash
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=upload-server}]'
```

## Step 2: Configure Deployment Script

Edit `deploy.sh` and set these variables:

```bash
# Open the deployment script
nano apps/upload-server/deploy.sh

# Set these variables:
EC2_HOST="1.2.3.4"                    # Your EC2 instance public IP
KEY_PATH="~/.ssh/your-key.pem"        # Path to your SSH key
GEMINI_API_KEY="your_gemini_api_key"  # Your Gemini API key
```

## Step 3: Deploy

```bash
# Make sure you're in the upload-server directory
cd apps/upload-server

# Run the deployment script
./deploy.sh production
```

The script will:

- ✅ Upload your code to EC2
- ✅ Install Docker and Docker Compose
- ✅ Build the container with Bun runtime
- ✅ Set up Nginx reverse proxy
- ✅ Configure SSL-ready setup
- ✅ Test the deployment

## Step 4: Update Next.js App

Update your Next.js app to use the deployed server:

```typescript
// apps/nextjs/src/hooks/use-upload-server.ts
const UPLOAD_SERVER_URL = "http://YOUR-EC2-IP"; // or your domain

// Update the uploadToGemini function
const response = await fetch(`${UPLOAD_SERVER_URL}/upload/gemini`, {
  method: "POST",
  body: formData,
});
```

## Step 5: Test the Deployment

```bash
# Test health check
curl http://YOUR-EC2-IP/health

# Test file upload (with a small video file)
curl -X POST -F "file=@test-video.mp4" http://YOUR-EC2-IP/upload/gemini
```

## 🔒 SSL Setup (Production)

For production, set up SSL with Let's Encrypt:

```bash
# SSH into your server
ssh -i your-key.pem ubuntu@YOUR-EC2-IP

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring

### View Logs

```bash
# SSH into server
ssh -i your-key.pem ubuntu@YOUR-EC2-IP

# View application logs
cd upload-server
sudo docker-compose logs -f upload-server

# View nginx logs
sudo docker-compose logs -f nginx
```

### Check Resources

```bash
# Check container status
sudo docker-compose ps

# Monitor resource usage
sudo docker stats

# Check disk usage
df -h
```

## 🔄 Updates

To deploy updates:

```bash
# Just run the deploy script again
./deploy.sh production
```

## 💰 Estimated Costs

- **t3.small EC2**: ~$15-20/month
- **20GB EBS storage**: ~$2/month
- **Data transfer**: Varies by usage
- **Total**: ~$17-22/month

## 🚨 Troubleshooting

### Common Issues

**1. Connection Refused**

```bash
# Check if containers are running
sudo docker ps

# Check logs
sudo docker-compose logs
```

**2. Upload Fails**

```bash
# Check nginx configuration
sudo docker-compose logs nginx

# Test backend directly
curl http://localhost:3001/health
```

**3. Out of Memory**

```bash
# Check resource usage
sudo docker stats

# Restart containers
sudo docker-compose restart
```

## 🎯 Next Steps

1. **Set up domain**: Point your domain to the EC2 IP
2. **Configure SSL**: Use Let's Encrypt for HTTPS
3. **Set up monitoring**: CloudWatch or other monitoring tools
4. **Backup strategy**: Regular backups of configurations
5. **Auto-scaling**: Consider ELB + Auto Scaling Groups for high traffic

## 📞 Support

If you encounter issues:

1. Check the logs: `sudo docker-compose logs`
2. Verify security groups allow traffic on ports 80/443
3. Ensure GEMINI_API_KEY is set correctly
4. Test the health endpoint first: `curl http://YOUR-IP/health`

---

**🎉 That's it! Your upload server should now be running on AWS EC2 and ready to handle video uploads to Gemini Files API.**
