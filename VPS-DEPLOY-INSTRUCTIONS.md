# VPS Deploy Instructions - matorlife.uz

## Muammo: Nginx IPv6 Connection Refused

Backend `127.0.0.1:4000` da ishlayapti, lekin Nginx `[::1]:4000` (IPv6) orqali ulanishga harakat qilyapti.

## Yechim: 3 Qadam

### 1. Nginx Konfiguratsiyani Tuzatish

VPS da quyidagi scriptni ishga tushiring:

```bash
cd /var/www/matorlife
bash scripts/fix-nginx-ipv6.sh
```

Yoki qo'lda:

```bash
# Backup
sudo cp /etc/nginx/sites-available/matorlife /etc/nginx/sites-available/matorlife.backup

# localhost ni 127.0.0.1 ga o'zgartirish
sudo sed -i 's|http://localhost:4000|http://127.0.0.1:4000|g' /etc/nginx/sites-available/matorlife

# Test va reload
sudo nginx -t && sudo systemctl reload nginx

# Tekshirish
curl https://matorlife.uz/api/health
```

### 2. Environment Variables ni To'ldirish

`backend/ecosystem.config.js` faylida `env_production` qismini to'ldiring:

```javascript
env_production: {
  NODE_ENV: 'production',
  PORT: 4000,
  HOST: '0.0.0.0',
  MONGODB_URI: 'mongodb+srv://username:password@cluster.mongodb.net/car-repair-workshop',
  JWT_SECRET: 'your-super-secret-jwt-key-min-32-characters',
  GROQ_API_KEY: 'gsk_...',
  TELEGRAM_BOT_TOKEN_CAR: '7123456789:AAH...',
  TELEGRAM_BOT_TOKEN_DEBT: '7987654321:AAH...',
  TELEGRAM_CHAT_ID: '-1001234567890',
  FRONTEND_URL: 'https://matorlife.uz'
}
```

### 3. Backend ni Qayta Ishga Tushirish

```bash
cd /var/www/matorlife/backend
pm2 restart mator-life-backend
pm2 logs mator-life-backend --lines 50
```

## Tekshirish

```bash
# 1. Backend status
pm2 status

# 2. Backend logs
pm2 logs mator-life-backend --lines 20

# 3. Health endpoint
curl https://matorlife.uz/api/health

# 4. Nginx logs
sudo tail -f /var/log/nginx/matorlife-error.log

# 5. Nginx access logs
sudo tail -f /var/log/nginx/matorlife-access.log
```

## Kutilgan Natija

```json
{
  "message": "Car Repair Workshop API is running!",
  "timestamp": "2026-02-12T09:10:00.000Z",
  "environment": "production"
}
```

## Agar Muammo Davom Etsa

### Rate Limit 429 Error

Agar 429 (Too Many Requests) xatosi ko'rsatilsa, 15 daqiqa kuting yoki boshqa IP dan tekshiring.

### MongoDB Connection Error

```bash
# Logs ni tekshiring
pm2 logs mator-life-backend --err --lines 50

# Environment variables ni tekshiring
pm2 env 21  # 21 - bu process ID
```

### Nginx 502 Bad Gateway

```bash
# Backend ishlab turganini tekshiring
pm2 status

# Backend portini tekshiring
netstat -tlnp | grep 4000

# Nginx konfiguratsiyani tekshiring
sudo nginx -t
```

## Qo'shimcha Ma'lumot

- **Backend Port**: 4000
- **Backend Host**: 0.0.0.0 (barcha interfacelar)
- **Nginx Proxy**: 127.0.0.1:4000 (IPv4 faqat)
- **PM2 Process**: mator-life-backend (ID: 21)
- **Database**: MongoDB Atlas
- **SSL**: Let's Encrypt (auto-renewal)

## Foydali Buyruqlar

```bash
# PM2
pm2 list
pm2 restart mator-life-backend
pm2 stop mator-life-backend
pm2 delete mator-life-backend
pm2 logs mator-life-backend
pm2 monit

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t

# SSL Certificate
sudo certbot renew --dry-run
sudo certbot certificates

# Disk space
df -h
du -sh /var/www/matorlife/*

# Memory
free -h
pm2 list
```

## Xavfsizlik

- `.env` fayllarni hech qachon git ga commit qilmang
- `ecosystem.config.js` dagi sensitive ma'lumotlarni `.gitignore` ga qo'shing
- Yoki environment variables ni VPS da to'g'ridan-to'g'ri o'rnating

## Keyingi Qadamlar

1. ✅ Nginx IPv6 muammosini tuzatish
2. ✅ Environment variables ni to'ldirish
3. ✅ Backend ni qayta ishga tushirish
4. ✅ Health endpoint ni tekshirish
5. ✅ Brauzerda https://matorlife.uz ni ochish
6. ✅ Login qilish va test qilish
7. ✅ PM2 startup ni sozlash (server restart bo'lganda auto-start)

```bash
pm2 startup
pm2 save
```
