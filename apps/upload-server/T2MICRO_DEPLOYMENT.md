# t2.micro (Free Tier) Deployment Guide

## 🆓 AWS Free Tier Eligibility

**YES!** You can absolutely run this upload server on a **t2.micro** instance and stay within the AWS Free Tier.

### Free Tier Benefits

- ✅ **750 hours/month** of t2.micro usage (basically 31 days)
- ✅ **30 GB** of EBS storage
- ✅ **15 GB** of data transfer out per month
- ✅ **1 year** free from AWS account creation

## 📊 t2.micro Specifications

| Resource    | t2.micro     | Is it enough?                           |
| ----------- | ------------ | --------------------------------------- |
| **vCPUs**   | 1            | ✅ Yes - streaming proxy is I/O bound   |
| **Memory**  | 1 GB         | ✅ Yes - with optimization              |
| **Network** | Low-Moderate | ✅ Yes - sufficient for video streaming |
| **Storage** | 8-30 GB EBS  | ✅ Yes - no local file storage needed   |

## 🎯 Optimizations for t2.micro

This deployment includes several optimizations specifically for t2.micro:

### 1. Reduced Memory Usage

```yaml
# docker-compose.t2micro.yml
deploy:
  resources:
    limits:
      memory: 400M # Upload server (was 512M)
    reservations:
      memory: 200M
```

### 2. Conservative Nginx Settings

```nginx
# nginx.t2micro.conf
worker_connections 512;           # Reduced from 1024
client_max_body_size 1G;         # Reduced from 2G
keepalive_timeout 30;            # Shorter timeouts
limit_req_zone rate=5r/m;        # Stricter rate limiting
access_log off;                  # Save disk I/O
```

### 3. Docker Optimizations

```json
{
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## 🚀 Quick Deployment

### 1. Configure the deployment script:

```bash
# Edit apps/upload-server/deploy-t2micro.sh
EC2_HOST="your-ec2-ip-here"
KEY_PATH="/path/to/your-keypair.pem"
GEMINI_API_KEY="your-gemini-api-key"
```

### 2. Run deployment:

```bash
cd apps/upload-server
./deploy-t2micro.sh production
```

## 🏗️ Manual Setup

If you prefer manual setup:

### 1. Create t2.micro EC2 instance:

```bash
# AWS CLI example
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t2.micro \
  --key-name your-keypair \
  --security-group-ids sg-your-security-group \
  --subnet-id subnet-your-subnet
```

### 2. Setup security group:

```bash
# Allow HTTP and SSH
aws ec2 authorize-security-group-ingress \
  --group-id sg-your-security-group \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-your-security-group \
  --protocol tcp \
  --port 22 \
  --cidr your-ip/32
```

### 3. Deploy with optimized settings:

```bash
# SSH to instance
ssh -i your-keypair.pem ubuntu@your-ec2-ip

# Upload and run
scp -i your-keypair.pem -r . ubuntu@your-ec2-ip:/home/ubuntu/upload-server
ssh -i your-keypair.pem ubuntu@your-ec2-ip

cd /home/ubuntu/upload-server
sudo docker-compose -f docker-compose.t2micro.yml up -d
```

## 📈 Performance Expectations

### Video Upload Performance

| Video Size | Expected Time | Notes                 |
| ---------- | ------------- | --------------------- |
| 50 MB      | 30-60 seconds | Good performance      |
| 100 MB     | 1-2 minutes   | Acceptable            |
| 500 MB     | 5-10 minutes  | Slower but works      |
| 1 GB       | 10-20 minutes | Consider optimization |

### Concurrent Users

- **1-2 users**: Excellent performance
- **3-5 users**: Good performance
- **5+ users**: May need rate limiting

## 💰 Cost Comparison

| Instance Type | Monthly Cost       | Use Case                      |
| ------------- | ------------------ | ----------------------------- |
| **t2.micro**  | **$0** (Free Tier) | Development, light production |
| t3.small      | ~$15-20            | Production, multiple users    |
| t3.medium     | ~$30-40            | High traffic production       |

## ⚠️ Free Tier Limitations

### 1. **750 Hour Limit**

- Monitor usage in AWS Billing dashboard
- Shut down when not needed for development
- Consider scheduled start/stop for production

### 2. **Network Transfer**

- 15 GB/month free outbound
- Large video files can consume this quickly
- Monitor in CloudWatch

### 3. **Performance**

- Single vCPU may be slow for large files
- Consider upgrading if processing > 10 videos/day

## 🔍 Monitoring Commands

### Check resource usage:

```bash
# Memory usage
ssh -i your-keypair.pem ubuntu@your-ec2-ip 'free -h'

# Container status
ssh -i your-keypair.pem ubuntu@your-ec2-ip 'cd upload-server && sudo docker-compose -f docker-compose.t2micro.yml ps'

# Container logs
ssh -i your-keypair.pem ubuntu@your-ec2-ip 'cd upload-server && sudo docker-compose -f docker-compose.t2micro.yml logs -f'
```

### AWS CloudWatch Metrics:

- CPU Utilization
- Network In/Out
- Status Check Failed

## 🚨 When to Upgrade

Consider upgrading from t2.micro when:

1. **Memory Issues**: Container restarts due to OOM
2. **Performance**: Upload times > 5 minutes for 500MB files
3. **Scale**: More than 5 concurrent users
4. **Free Tier Expires**: After 12 months

### Upgrade Path:

```bash
# Stop current instance
aws ec2 stop-instances --instance-ids i-your-instance-id

# Change instance type
aws ec2 modify-instance-attribute \
  --instance-id i-your-instance-id \
  --instance-type Value=t3.small

# Start instance
aws ec2 start-instances --instance-ids i-your-instance-id
```

## 📝 Free Tier Best Practices

1. **Set up billing alerts** for $1 threshold
2. **Monitor usage** weekly in AWS console
3. **Stop instances** when not needed
4. **Use CloudWatch** free tier monitoring
5. **Tag resources** for better tracking

## 🎉 Success Indicators

Your t2.micro deployment is successful when:

- ✅ Health check returns 200: `curl http://your-ec2-ip/health`
- ✅ Memory usage < 80%: `free -h` shows available memory
- ✅ Upload completes without timeout
- ✅ Containers stay running: `docker ps` shows running containers

## 🆘 Troubleshooting

### Common Issues:

**1. Out of Memory**

```bash
# Check memory
free -h
# Restart containers
sudo docker-compose -f docker-compose.t2micro.yml restart
```

**2. Slow Performance**

```bash
# Check CPU credits (t2.micro specific)
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUCreditBalance \
  --dimensions Name=InstanceId,Value=i-your-instance-id \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

**3. Container Won't Start**

```bash
# Check logs
sudo docker-compose -f docker-compose.t2micro.yml logs upload-server
# Check disk space
df -h
```

## 📚 Next Steps

1. **Test with small files** (< 100MB) first
2. **Monitor performance** for your use case
3. **Set up CloudWatch alarms** for memory/CPU
4. **Configure SSL** with Let's Encrypt (optional)
5. **Consider upgrade** if you exceed free tier limits

---

💡 **Pro Tip**: The t2.micro is perfect for getting started. You can always upgrade later without losing your configuration!
