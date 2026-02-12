# ⚡ Tezkor Deploy Ko'rsatmasi

## 1. Server Tayyorlash (5 daqiqa)

```bash
# Script ni executable qilish
chmod +x scripts/setup-production.sh

# Server sozlash
./scripts/setup-production.sh
```

## 2. Loyihani Clone Qilish

```bash
cd /var/www/matorlife
git clone <YOUR_REPO_URL> .
```

## 3. Environment Sozlash

### Backend
```bash
cd /var/www/matorlife/backend
cp .env.production.example .env.production
nano .env.production
```

Quyidagilarni to'ldiring:
```env
MONGODB_URI=mongodb://matorlife:PAROL@localhost:27017/car-repair-workshop?authSource=car-repair-workshop
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
GROQ_API_KEY=your_groq_api_key
```

### Frontend
```bash
cd /var/www/matorlife/frontend
cp .env.production.example .env.production
nano .env.production
```

```env
VITE_API_URL=https://matorlife.uz/api
```

## 4. Build va Deploy

```bash
cd /var/www/matorlife

# Backend
cd backend
npm install
npm run build
pm2 start ecosystem.config.js --env production
pm2 save

# Frontend
cd ../frontend
npm install
npm run build
```

## 5. Nginx Sozlash

```bash
# Nginx config copy qilish
sudo cp /var/www/matorlife/nginx/matorlife.conf /etc/nginx/sites-available/matorlife

# Symlink yaratish
sudo ln -s /etc/nginx/sites-available/matorlife /etc/nginx/sites-enabled/

# Default site ni o'chirish
sudo rm /etc/nginx/sites-enabled/default

# Test va restart
sudo nginx -t
sudo systemctl restart nginx
```

## 6. SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d matorlife.uz -d www.matorlife.uz
```

## 7. Tekshirish

```bash
# Health check
./scripts/health-check.sh

# Backend
curl http://localhost:4000/api/health

# Frontend
curl http://localhost
```

## 8. Backup Sozlash

```bash
# Cron job qo'shish
crontab -e
```

Qo'shing:
```
0 2 * * * /var/www/matorlife/scripts/backup.sh >> /var/log/matorlife-backup.log 2>&1
```

## ✅ Tayyor!

Sizning dasturingiz endi production da ishlayapti:
- Frontend: https://matorlife.uz
- Backend API: https://matorlife.uz/api
- Health Check: https://matorlife.uz/api/health

## 🔄 Yangilash

```bash
cd /var/www/matorlife
git pull origin main
./scripts/deploy.sh
```

## 📊 Monitoring

```bash
# PM2 status
pm2 status

# Logs
pm2 logs mator-life-backend

# Health check
./scripts/health-check.sh
```
