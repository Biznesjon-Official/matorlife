# Mator Life - Yangi Deployment (VPS dan tozalash va qayta o'rnatish)

## 1. VPS dan eski loyihani tozalash

```bash
# 1. PM2 processni to'xtatish va o'chirish
pm2 delete mator-life-backend
pm2 save

# 2. Eski loyihani o'chirish
rm -rf /var/www/matorlife

# 3. Nginx konfiguratsiyasini o'chirish
sudo rm /etc/nginx/sites-enabled/matorlife
sudo rm /etc/nginx/sites-available/matorlife

# 4. Nginx ni qayta yuklash
sudo systemctl reload nginx
```

## 2. Yangi loyihani clone qilish

```bash
# 1. /var/www papkasiga o'tish
cd /var/www

# 2. GitHub dan clone qilish
git clone https://github.com/Biznesjon-Official/matorlife.git

# 3. Loyihaga o'tish
cd matorlife
```

## 3. Backend sozlash

```bash
# 1. Backend papkasiga o'tish
cd backend

# 2. Dependencies o'rnatish
npm install

# 3. TypeScript build qilish
npm run build

# 4. Logs papkasini yaratish
mkdir -p logs

# 5. ecosystem.config.js ni yangilash (MUHIM!)
# ecosystem.config.js faylida env_production obyektiga quyidagilarni qo'shing:
# - MONGODB_URI (MongoDB Atlas connection string)
# - JWT_SECRET (64+ belgi random string)
# - GROQ_API_KEY (agar kerak bo'lsa)
# - TELEGRAM_BOT_TOKEN_CAR, TELEGRAM_BOT_TOKEN_DEBT, ADMIN_CHAT_ID, WEBHOOK_URL
# - FRONTEND_URL=https://matorlife.uz

# Misol:
nano ecosystem.config.js
# env_production obyektiga qo'shing:
#   MONGODB_URI: 'mongodb+srv://user:password@cluster.mongodb.net/db?retryWrites=true&w=majority',
#   JWT_SECRET: 'your-64-char-random-string',
#   GROQ_API_KEY: 'your-groq-api-key',
#   TELEGRAM_BOT_TOKEN_CAR: 'your-telegram-token',
#   TELEGRAM_BOT_TOKEN_DEBT: 'your-telegram-token',
#   ADMIN_CHAT_ID: 'your-chat-id',
#   WEBHOOK_URL: 'https://matorlife.uz/api/telegram',
#   FRONTEND_URL: 'https://matorlife.uz'

# 6. PM2 bilan ishga tushirish
pm2 start ecosystem.config.js --env production
pm2 save

# 7. Backend statusini tekshirish
pm2 status
pm2 logs mator-life-backend --lines 20 --nostream

# 8. Health check
curl http://localhost:4000/api/health
```

## 4. Frontend sozlash

```bash
# 1. Frontend papkasiga o'tish
cd /var/www/matorlife/frontend

# 2. Dependencies o'rnatish
npm install

# 3. .env faylini yaratish
cat > .env << 'EOF'
VITE_API_URL=https://matorlife.uz/api
EOF

# 4. Build qilish
npm run build

# 5. Build natijasini tekshirish
ls -lh dist/
```

## 5. Nginx sozlash

```bash
# 1. Nginx konfiguratsiyasini ko'chirish
sudo cp /var/www/matorlife/nginx/matorlife.conf /etc/nginx/sites-available/matorlife

# 2. Symlink yaratish
sudo ln -s /etc/nginx/sites-available/matorlife /etc/nginx/sites-enabled/

# 3. Nginx konfiguratsiyasini tekshirish
sudo nginx -t

# 4. Nginx ni qayta yuklash
sudo systemctl reload nginx
```

## 6. SSL sertifikat olish

```bash
# 1. Certbot bilan SSL sertifikat olish
sudo certbot --nginx -d matorlife.uz -d www.matorlife.uz

# 2. SSL sertifikatni tekshirish
sudo certbot certificates

# 3. Auto-renewal ni tekshirish
sudo certbot renew --dry-run
```

## 7. Yakuniy tekshiruvlar

```bash
# 1. Backend statusini tekshirish
pm2 status mator-life-backend
pm2 logs mator-life-backend --lines 30 --nostream

# 2. Backend health check
curl http://localhost:4000/api/health

# 3. Nginx orqali health check
curl https://matorlife.uz/api/health

# 4. Frontend ni brauzerda ochish
echo "Frontend: https://matorlife.uz"

# 5. PM2 startup ni sozlash (server restart bo'lganda avtomatik ishga tushishi uchun)
pm2 startup
# Chiqgan buyruqni copy qilib, ishga tushiring
pm2 save
```

## 8. Monitoring va Logs

```bash
# PM2 monitoring
pm2 monit

# Backend logs
pm2 logs mator-life-backend

# Nginx logs
sudo tail -f /var/log/nginx/matorlife-access.log
sudo tail -f /var/log/nginx/matorlife-error.log

# PM2 logs fayllar
tail -f /var/www/matorlife/backend/logs/out.log
tail -f /var/www/matorlife/backend/logs/err.log
```

## 9. Troubleshooting

### Backend ishlamasa:

```bash
# 1. Logs ni ko'rish
pm2 logs mator-life-backend --lines 100

# 2. ecosystem.config.js ni tekshirish
cat /var/www/matorlife/backend/ecosystem.config.js

# 3. MongoDB connection string ni tekshirish
# ecosystem.config.js da MONGODB_URI to'g'ri ekanligini tekshiring

# 4. Backend ni qayta ishga tushirish
cd /var/www/matorlife/backend
pm2 delete mator-life-backend
pm2 start ecosystem.config.js --env production
pm2 logs mator-life-backend --lines 50
```

### Frontend ishlamasa:

```bash
# 1. Build ni qayta qilish
cd /var/www/matorlife/frontend
npm run build

# 2. Nginx ni qayta yuklash
sudo systemctl reload nginx

# 3. Nginx logs ni ko'rish
sudo tail -f /var/log/nginx/matorlife-error.log
```

### SSL muammolari:

```bash
# 1. SSL sertifikatni qayta olish
sudo certbot --nginx -d matorlife.uz -d www.matorlife.uz --force-renewal

# 2. Nginx ni qayta yuklash
sudo systemctl reload nginx
```

## 10. Backup va Restore

### Backup:

```bash
# Database backup (MongoDB Atlas dan)
# MongoDB Atlas dashboard dan backup oling

# Code backup
cd /var/www
tar -czf matorlife-backup-$(date +%Y%m%d).tar.gz matorlife/

# PM2 ecosystem backup
pm2 save
```

### Restore:

```bash
# Code restore
cd /var/www
tar -xzf matorlife-backup-YYYYMMDD.tar.gz

# PM2 restore
pm2 resurrect
```

## Muhim Eslatmalar

1. **ecosystem.config.js** faylida `env_production` obyektiga barcha environment variables ni qo'shing
2. **MongoDB Atlas** connection string ni to'g'ri kiriting
3. **JWT_SECRET** ni 64+ belgi random string bilan almashtiring
4. **SSL sertifikat** ni certbot bilan oling
5. **PM2 startup** ni sozlang (server restart bo'lganda avtomatik ishga tushishi uchun)
6. **Nginx rate limiting** health endpoint uchun o'chirilgan
7. **Health endpoint** rate limiter dan oldin joylashgan

## Deployment muvaffaqiyatli bo'ldi!

✅ Backend: https://matorlife.uz/api/health
✅ Frontend: https://matorlife.uz
✅ PM2: `pm2 status`
✅ Logs: `pm2 logs mator-life-backend`
