# 🚀 Production Setup Guide (Docker siz)

## Tizim Talablari

- Ubuntu 20.04+ / CentOS 8+ / Windows Server
- Node.js 18+ LTS
- MongoDB 6.0+
- Nginx
- PM2
- 2GB+ RAM
- 20GB+ disk space

## 1. Server Tayyorlash

### Ubuntu/Debian
```bash
# System yangilash
sudo apt update && sudo apt upgrade -y

# Node.js 18 LTS o'rnatish
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MongoDB o'rnatish
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# MongoDB ishga tushirish
sudo systemctl start mongod
sudo systemctl enable mongod

# Nginx o'rnatish
sudo apt install -y nginx

# PM2 o'rnatish (global)
sudo npm install -g pm2

# Git o'rnatish
sudo apt install -y git
```

### CentOS/RHEL
```bash
# System yangilash
sudo yum update -y

# Node.js 18 LTS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# MongoDB
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

sudo yum install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Nginx
sudo yum install -y nginx

# PM2
sudo npm install -g pm2

# Git
sudo yum install -y git
```

## 2. MongoDB Xavfsizlik Sozlamalari

```bash
# MongoDB shell ga kirish
mongosh

# Admin user yaratish
use admin
db.createUser({
  user: "admin",
  pwd: "KUCHLI_PAROL_32_BELGI",
  roles: [ { role: "userAdminAnyDatabase", database: "admin" }, "readWriteAnyDatabase" ]
})

# Database user yaratish
use car-repair-workshop
db.createUser({
  user: "matorlife",
  pwd: "KUCHLI_PAROL_32_BELGI",
  roles: [ { role: "readWrite", database: "car-repair-workshop" } ]
})

exit
```

MongoDB authentication yoqish:
```bash
sudo nano /etc/mongod.conf
```

Quyidagini qo'shing:
```yaml
security:
  authorization: enabled
```

MongoDB ni restart qiling:
```bash
sudo systemctl restart mongod
```

## 3. Loyihani Clone Qilish

```bash
# Loyiha papkasini yaratish
sudo mkdir -p /var/www/matorlife
sudo chown -R $USER:$USER /var/www/matorlife

# Clone qilish
cd /var/www/matorlife
git clone <YOUR_REPO_URL> .

# Yoki mavjud loyihani upload qiling
```

## 4. Backend Sozlash

```bash
cd /var/www/matorlife/backend

# Dependencies o'rnatish
npm install

# Production environment yaratish
cp .env.production.example .env.production
nano .env.production
```

`.env.production` ni to'ldiring:
```env
PORT=4000
HOST=0.0.0.0
NODE_ENV=production

# MongoDB (authentication bilan)
MONGODB_URI=mongodb://matorlife:KUCHLI_PAROL@localhost:27017/car-repair-workshop?authSource=car-repair-workshop

# JWT Secret (64+ belgi random string)
JWT_SECRET=RANDOM_64_BELGI_STRING

# API Keys
GROQ_API_KEY=your_groq_api_key
TELEGRAM_BOT_TOKEN_CAR=your_car_bot_token
TELEGRAM_BOT_TOKEN_DEBT=your_debt_bot_token
ADMIN_CHAT_ID=your_admin_chat_id
WEBHOOK_URL=https://yourdomain.com/api/telegram
```

JWT Secret yaratish:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Build qilish:
```bash
npm run build
```

PM2 bilan ishga tushirish:
```bash
# Production mode
pm2 start ecosystem.config.js --env production

# PM2 ni system startup ga qo'shish
pm2 startup
pm2 save
```

## 5. Frontend Sozlash

```bash
cd /var/www/matorlife/frontend

# Dependencies o'rnatish
npm install

# Production environment
cp .env.production.example .env.production
nano .env.production
```

`.env.production` ni to'ldiring:
```env
VITE_API_URL=https://yourdomain.com/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Build qilish:
```bash
npm run build
```

## 6. Nginx Sozlash

```bash
sudo nano /etc/nginx/sites-available/matorlife
```

Quyidagi konfiguratsiyani kiriting:
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React SPA)
    root /var/www/matorlife/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/matorlife/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # React Router (SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security: Block hidden files
    location ~ /\. {
        deny all;
    }
}
```

Nginx ni yoqish:
```bash
# Symlink yaratish
sudo ln -s /etc/nginx/sites-available/matorlife /etc/nginx/sites-enabled/

# Default site ni o'chirish (agar kerak bo'lsa)
sudo rm /etc/nginx/sites-enabled/default

# Konfiguratsiyani tekshirish
sudo nginx -t

# Nginx ni restart qilish
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 7. SSL Certificate (Let's Encrypt)

```bash
# Certbot o'rnatish
sudo apt install -y certbot python3-certbot-nginx

# SSL certificate olish
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## 8. Firewall Sozlash

```bash
# UFW o'rnatish va yoqish
sudo apt install -y ufw

# SSH ruxsat berish (MUHIM!)
sudo ufw allow 22/tcp

# HTTP va HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Firewall yoqish
sudo ufw enable

# Status tekshirish
sudo ufw status
```

## 9. Monitoring va Logs

### PM2 Monitoring
```bash
# Status
pm2 status

# Logs
pm2 logs mator-life-backend

# Real-time monitoring
pm2 monit

# Restart
pm2 restart mator-life-backend

# Stop
pm2 stop mator-life-backend
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Logs
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

## 10. Backup Script

```bash
sudo nano /usr/local/bin/matorlife-backup.sh
```

```bash
#!/bin/bash

# Backup directory
BACKUP_DIR="/var/backups/matorlife"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --uri="mongodb://matorlife:PAROL@localhost:27017/car-repair-workshop?authSource=car-repair-workshop" --out="$BACKUP_DIR/mongodb_$DATE"

# Compress
tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE"
rm -rf "$BACKUP_DIR/mongodb_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/mongodb_$DATE.tar.gz"
```

Executable qilish:
```bash
sudo chmod +x /usr/local/bin/matorlife-backup.sh
```

Cron job qo'shish (har kuni soat 2 da):
```bash
sudo crontab -e
```

Qo'shing:
```
0 2 * * * /usr/local/bin/matorlife-backup.sh >> /var/log/matorlife-backup.log 2>&1
```

## 11. Yangilash (Update)

```bash
cd /var/www/matorlife

# Git dan yangilanishlarni olish
git pull origin main

# Backend yangilash
cd backend
npm install
npm run build
pm2 restart mator-life-backend

# Frontend yangilash
cd ../frontend
npm install
npm run build

# Nginx restart (agar kerak bo'lsa)
sudo systemctl reload nginx
```

## 12. Troubleshooting

### Backend ishlamayapti
```bash
# PM2 logs
pm2 logs mator-life-backend --lines 100

# Environment variables tekshirish
pm2 env 0

# Restart
pm2 restart mator-life-backend
```

### MongoDB connection error
```bash
# MongoDB status
sudo systemctl status mongod

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Connection test
mongosh "mongodb://matorlife:PAROL@localhost:27017/car-repair-workshop?authSource=car-repair-workshop"
```

### Nginx error
```bash
# Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Port band
```bash
# Port 4000 ni tekshirish
sudo lsof -i :4000

# Process ni o'chirish
sudo kill -9 <PID>
```

## 13. Performance Optimization

### PM2 Cluster Mode (ko'p CPU uchun)
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mator-life-backend',
    script: './dist/index.js',
    instances: 'max', // Barcha CPU cores
    exec_mode: 'cluster',
    // ...
  }]
};
```

### MongoDB Indexlar
```bash
mongosh "mongodb://matorlife:PAROL@localhost:27017/car-repair-workshop?authSource=car-repair-workshop"
```

```javascript
use car-repair-workshop

// Indexlar yaratish
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ telegramId: 1 })
db.cars.createIndex({ licensePlate: 1 })
db.tasks.createIndex({ assignedTo: 1, status: 1 })
db.tasks.createIndex({ createdAt: -1 })
db.transactions.createIndex({ userId: 1, createdAt: -1 })
```

## 14. Security Checklist

- [x] MongoDB authentication yoqilgan
- [x] Kuchli parollar ishlatilgan (32+ belgi)
- [x] JWT secret random va kuchli (64+ belgi)
- [x] HTTPS sozlangan (Let's Encrypt)
- [x] Firewall sozlangan (faqat 22, 80, 443)
- [x] Nginx security headers qo'shilgan
- [x] Rate limiting yoqilgan (backend)
- [x] CORS to'g'ri sozlangan
- [x] Backup tizimi ishlamoqda
- [x] PM2 auto-restart yoqilgan
- [x] Logs monitoring sozlangan

## 15. Monitoring Tools (Tavsiya)

```bash
# PM2 Plus (bepul monitoring)
pm2 link <secret_key> <public_key>

# Netdata (system monitoring)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

## Yordam

Muammolar bo'lsa:
1. Logs ni tekshiring (PM2, Nginx, MongoDB)
2. Environment variables ni tekshiring
3. Firewall va port sozlamalarini tekshiring
4. GitHub Issues da savol bering

---

**Muvaffaqiyatli deployment! 🎉**
