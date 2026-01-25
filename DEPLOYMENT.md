# Mator Life - Production Deployment Guide

## 🚀 Production ga Deploy Qilish

### 1. Tayyorgarlik

#### Kerakli Dasturlar
- Docker va Docker Compose
- Git
- Node.js 18+ (PM2 uchun)

#### Environment Variables
`.env.production` faylini yarating va quyidagi qiymatlarni to'ldiring:

```env
# MongoDB
MONGO_ROOT_PASSWORD=kuchli-parol-min-32-belgi

# Backend
JWT_SECRET=kuchli-jwt-secret-min-64-belgi-random
GROQ_API_KEY=sizning-groq-api-key
TELEGRAM_BOT_TOKEN_CAR=car-bot-token
TELEGRAM_BOT_TOKEN_DEBT=debt-bot-token
ADMIN_CHAT_ID=admin-chat-id
WEBHOOK_URL=https://yourdomain.com/api/telegram

# Frontend
VITE_GOOGLE_MAPS_API_KEY=google-maps-key
```

### 2. Docker bilan Deploy

```bash
# Repository ni clone qiling
git clone <repository-url>
cd mator-life

# .env.production faylini sozlang
cp .env.production.example .env.production
nano .env.production

# Docker Compose bilan ishga tushiring
docker-compose up -d

# Loglarni tekshiring
docker-compose logs -f

# Statusni tekshiring
docker-compose ps
```

### 3. VPS/Server Setup

#### Nginx Reverse Proxy (Tavsiya etiladi)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### SSL Certificate (Let's Encrypt)

```bash
# Certbot o'rnatish
sudo apt install certbot python3-certbot-nginx

# SSL sertifikat olish
sudo certbot --nginx -d yourdomain.com
```

### 4. PM2 bilan Deploy (Alternative)

```bash
# Backend
cd backend
npm install
npm run build
npm run pm2:start

# Frontend (Nginx bilan)
cd frontend
npm install
npm run build
# dist papkasini Nginx ga ko'rsating
```

### 5. Monitoring va Maintenance

#### Docker Logs
```bash
# Barcha loglar
docker-compose logs -f

# Faqat backend
docker-compose logs -f backend

# Faqat frontend
docker-compose logs -f frontend
```

#### PM2 Monitoring
```bash
# Status
pm2 status

# Logs
pm2 logs mator-life-backend

# Monitoring dashboard
pm2 monit
```

#### Database Backup
```bash
# MongoDB backup
docker exec matorlife-mongodb mongodump \
  --username admin \
  --password YOUR_PASSWORD \
  --authenticationDatabase admin \
  --out /backup

# Backup ni copy qilish
docker cp matorlife-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### 6. Xavfsizlik

#### Firewall (UFW)
```bash
# Faqat kerakli portlarni ochish
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

#### Environment Variables Xavfsizligi
- `.env` fayllarni hech qachon git ga commit qilmang
- Kuchli parollar ishlating (min 32 belgi)
- JWT secret ni random generate qiling
- API key larni muntazam yangilang

### 7. Yangilanishlar

```bash
# Git dan yangilanishlarni olish
git pull origin main

# Docker ni qayta build qilish
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# PM2 ni restart qilish
cd backend
npm run build
pm2 restart mator-life-backend
```

### 8. Troubleshooting

#### Backend ishlamayapti
```bash
# Loglarni tekshiring
docker-compose logs backend

# Container ichiga kirish
docker exec -it matorlife-backend sh

# Environment variables ni tekshirish
docker exec matorlife-backend env
```

#### Frontend ishlamayapti
```bash
# Nginx konfiguratsiyasini tekshiring
docker exec matorlife-frontend nginx -t

# Loglarni ko'rish
docker-compose logs frontend
```

#### MongoDB connection error
```bash
# MongoDB statusini tekshirish
docker exec matorlife-mongodb mongosh \
  --username admin \
  --password YOUR_PASSWORD \
  --authenticationDatabase admin

# Connection string ni tekshirish
echo $MONGODB_URI
```

### 9. Performance Optimization

#### Nginx Caching
```nginx
# Static files uchun caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### MongoDB Indexing
```javascript
// Backend da index yaratish
db.cars.createIndex({ licensePlate: 1 });
db.users.createIndex({ username: 1 });
db.tasks.createIndex({ assignedTo: 1, status: 1 });
```

### 10. Monitoring Tools (Tavsiya)

- **PM2 Plus**: Process monitoring
- **Sentry**: Error tracking
- **Grafana + Prometheus**: Metrics
- **Uptime Robot**: Uptime monitoring

## 📞 Yordam

Muammolar yuzaga kelsa:
1. Loglarni tekshiring
2. Environment variables ni tekshiring
3. Network connectivity ni tekshiring
4. GitHub Issues da savol bering
