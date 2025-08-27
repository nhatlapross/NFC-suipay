# Deployment Guide

## 📋 Overview

Hướng dẫn deploy NFC Payment Backend lên các môi trường production.

## 🎯 Deployment Options

### 1. Traditional Server (VPS/Dedicated)
### 2. Docker Containers
### 3. Cloud Platforms (AWS, GCP, Azure)
### 4. Kubernetes

## 🔧 Pre-deployment Setup

### System Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Node.js**: 18.x or higher
- **Memory**: 2GB+ RAM
- **Storage**: 20GB+ SSD
- **Network**: Static IP, SSL certificate

### Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Redis
sudo apt install redis-server -y
```

## 🚀 Production Deployment

### 1. Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/nfc-payment-backend
cd /opt/nfc-payment-backend

# Clone and setup
git clone https://github.com/your-repo/nfc-payment-app.git .
cd backend

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Create environment file
sudo cp .env.example .env.production
sudo nano .env.production
```

### 2. Environment Configuration

**`.env.production`:**
```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/nfc-payment-prod
REDIS_URL=redis://localhost:6379/0

# Security (Generate strong secrets!)
JWT_SECRET=your-very-strong-jwt-secret-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key

# Sui Blockchain
SUI_NETWORK=mainnet
SUI_RPC_URL=https://fullnode.mainnet.sui.io
SUI_PACKAGE_ID=0x...your-mainnet-package-id
SUI_MERCHANT_WALLET=0x...your-merchant-wallet
SUI_ADMIN_PRIVATE_KEY=suiprivkey1...your-mainnet-private-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-app-password
EMAIL_FROM=NFC Payment <noreply@yourdomain.com>

# SMS
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/opt/nfc-payment-backend/uploads

# CORS
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/nfc-payment
```

### 3. PM2 Configuration

**`ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [
    {
      name: 'nfc-payment-backend',
      script: './dist/index.js',
      cwd: '/opt/nfc-payment-backend/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/nfc-payment/error.log',
      out_file: '/var/log/nfc-payment/out.log',
      log_file: '/var/log/nfc-payment/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

Start application:
```bash
# Create log directory
sudo mkdir -p /var/log/nfc-payment
sudo chown -R $USER:$USER /var/log/nfc-payment

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx Configuration

**`/etc/nginx/sites-available/nfc-payment-backend`:**
```nginx
upstream nfc_backend {
    server 127.0.0.1:3000;
    # Add more servers for load balancing
    # server 127.0.0.1:3001;
    # server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Client Settings
    client_max_body_size 10M;
    keepalive_timeout 65;

    # Logging
    access_log /var/log/nginx/nfc-payment-access.log;
    error_log /var/log/nginx/nfc-payment-error.log;

    # API Routes
    location /api {
        proxy_pass http://nfc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket for real-time features
    location /ws {
        proxy_pass http://nfc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://nfc_backend;
        access_log off;
    }

    # Static files (if any)
    location /uploads {
        root /opt/nfc-payment-backend/backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/nfc-payment-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. MongoDB Configuration

**`/etc/mongod.conf`:**
```yaml
# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1

# Security
security:
  authorization: enabled

# Storage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# System log
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Process management
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid

# Replication (for production)
replication:
  replSetName: "nfc-payment-rs"
```

Setup MongoDB security:
```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create admin user
mongo
> use admin
> db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create application user
> use nfc-payment-prod
> db.createUser({
  user: "nfc_app",
  pwd: "app_password",
  roles: [ { role: "readWrite", db: "nfc-payment-prod" } ]
})

# Update connection string in .env
MONGODB_URI=mongodb://nfc_app:app_password@localhost:27017/nfc-payment-prod
```

### 7. Redis Configuration

**`/etc/redis/redis.conf`:**
```conf
# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Security
requirepass your_redis_password

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
```

Update Redis URL:
```env
REDIS_URL=redis://:your_redis_password@localhost:6379/0
```

## 🐳 Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=development

COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

USER nodejs

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/uploads ./uploads

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### 2. Docker Compose

**`docker-compose.prod.yml`:**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    container_name: nfc-payment-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/nfc-payment-prod
      - REDIS_URL=redis://redis:6379/0
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
      - /var/log/nfc-payment:/var/log/nfc-payment
    depends_on:
      - mongo
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mongo:
    image: mongo:6.0
    container_name: nfc-payment-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password
      MONGO_INITDB_DATABASE: nfc-payment-prod
    volumes:
      - mongo_data:/data/db
      - ./mongo-init:/docker-entrypoint-initdb.d
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    container_name: nfc-payment-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    container_name: nfc-payment-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - /var/log/nginx:/var/log/nginx
    depends_on:
      - app

volumes:
  mongo_data:
  redis_data:

networks:
  default:
    name: nfc-payment-network
```

Deploy with Docker:
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app

# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## ☁️ Cloud Deployment

### AWS ECS with Fargate

**Task Definition:**
```json
{
  "family": "nfc-payment-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "nfc-payment-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/nfc-payment:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MONGODB_URI",
          "value": "mongodb://your-atlas-cluster..."
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nfc-payment-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Google Cloud Run

**`cloudrun.yaml`:**
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: nfc-payment-backend
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cloudsql-instances: "project:region:instance"
        run.googleapis.com/vpc-access-connector: "vpc-connector"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/project/nfc-payment-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              key: mongodb_uri
              name: database-config
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
```

Deploy:
```bash
# Build and push
gcloud builds submit --tag gcr.io/project/nfc-payment-backend

# Deploy
gcloud run services replace cloudrun.yaml
```

## 📊 Monitoring & Logging

### 1. Application Monitoring

**PM2 Monitoring:**
```bash
# Install PM2 Plus
pm2 install pm2-server-monit

# Link to PM2 Plus
pm2 link <secret> <public>

# Monitor
pm2 monit
pm2 logs
pm2 status
```

### 2. System Monitoring

**Install monitoring tools:**
```bash
# Install Node Exporter for Prometheus
wget https://github.com/prometheus/node_exporter/releases/download/v1.3.1/node_exporter-1.3.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.3.1.linux-amd64.tar.gz
sudo mv node_exporter-1.3.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
```

### 3. Log Management

**Centralized logging with ELK Stack:**

**`filebeat.yml`:**
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/nfc-payment/*.log
    - /var/log/nginx/*nfc-payment*.log
  fields:
    service: nfc-payment-backend
  fields_under_root: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "nfc-payment-%{+yyyy.MM.dd}"

setup.kibana:
  host: "localhost:5601"

processors:
- add_host_metadata:
    when.not.contains.tags: forwarded
```

### 4. Health Checks

**Advanced health check endpoint:**
```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version,
    checks: {}
  };

  try {
    // Database check
    await mongoose.connection.db.admin().ping();
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Redis check
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Sui network check
    await suiClient.getLatestCheckpointSequenceNumber();
    health.checks.blockchain = 'healthy';
  } catch (error) {
    health.checks.blockchain = 'unhealthy';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

## 🔒 Security Hardening

### 1. Server Security

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban -y

# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Set up automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

### 2. Application Security

**Rate limiting with Redis:**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api', limiter);
```

### 3. Database Security

```javascript
// MongoDB connection with SSL
const mongoOptions = {
  ssl: true,
  sslValidate: true,
  sslCA: fs.readFileSync('/path/to/ca-certificate.crt'),
  authSource: 'admin'
};

mongoose.connect(MONGODB_URI, mongoOptions);
```

## 🚨 Backup & Recovery

### 1. Database Backup

**MongoDB backup script:**
```bash
#!/bin/bash
# /opt/scripts/backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/mongodb"
DB_NAME="nfc-payment-prod"

mkdir -p $BACKUP_DIR

# Create backup
mongodump --host localhost:27017 --db $DB_NAME --out $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/mongodb_backup_$DATE.tar.gz s3://your-backup-bucket/mongodb/

# Clean up old backups (keep 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_backup_$DATE.tar.gz"
```

**Cron job:**
```bash
# Add to crontab
0 2 * * * /opt/scripts/backup-mongodb.sh >> /var/log/backup.log 2>&1
```

### 2. Application Backup

```bash
#!/bin/bash
# /opt/scripts/backup-app.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/application"
APP_DIR="/opt/nfc-payment-backend"

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
  -C $APP_DIR \
  --exclude=node_modules \
  --exclude=logs \
  --exclude=.git \
  .

# Upload to S3
aws s3 cp $BACKUP_DIR/app_backup_$DATE.tar.gz s3://your-backup-bucket/application/

echo "Application backup completed: app_backup_$DATE.tar.gz"
```

## 🔄 CI/CD Pipeline

### GitHub Actions

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test
    - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /opt/nfc-payment-backend
          git pull origin main
          cd backend
          npm ci --only=production
          npm run build
          pm2 restart ecosystem.config.js
          pm2 save
```

## 🎯 Performance Optimization

### 1. Application Optimization

**Clustering:**
```javascript
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    cluster.fork();
  });
} else {
  require('./app');
}
```

### 2. Database Optimization

**Connection pooling:**
```javascript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
});
```

### 3. Caching Strategy

**Redis caching middleware:**
```javascript
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      const originalSend = res.json;
      res.json = function(data) {
        redisClient.setex(key, duration, JSON.stringify(data));
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// Usage
app.get('/api/merchants/:id', cacheMiddleware(600), getMerchant);
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Check system logs
   - Review performance metrics
   - Update security patches

2. **Monthly:**
   - Database maintenance
   - Backup verification
   - Capacity planning review

3. **Quarterly:**
   - Security audit
   - Dependency updates
   - Disaster recovery testing

### Troubleshooting

**Common issues:**
1. High memory usage → Check for memory leaks
2. Slow response times → Review database queries
3. Connection timeouts → Check network/firewall
4. Failed transactions → Review blockchain connectivity

**Log locations:**
- Application: `/var/log/nfc-payment/`
- Nginx: `/var/log/nginx/`
- MongoDB: `/var/log/mongodb/`
- Redis: `/var/log/redis/`
- System: `/var/log/syslog`

### Emergency Procedures

**Service restart:**
```bash
# Quick restart
pm2 restart nfc-payment-backend

# Full restart with logs
pm2 stop nfc-payment-backend
pm2 logs nfc-payment-backend --lines 100
pm2 start nfc-payment-backend
```

**Database recovery:**
```bash
# Restore from backup
mongorestore --host localhost:27017 --db nfc-payment-prod /path/to/backup/
```

**Emergency contacts:**
- DevOps: devops@company.com
- Database: dba@company.com
- Security: security@company.com