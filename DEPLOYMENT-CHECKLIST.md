# ✅ Deployment Checklist - matorlife.uz

## Pre-Deployment

### 1. Server Tayyorlash
- [ ] Ubuntu 20.04+ server
- [ ] Root yoki sudo access
- [ ] Domain DNS sozlangan (matorlife.uz → Server IP)
- [ ] Firewall sozlangan (22, 80, 443 portlar)

### 2. Dependencies O'rnatish
```bash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

- [ ] Node.js 18 LTS o'rnatilgan
- [ ] MongoDB 6.0+ o'rnatilgan va ishlamoqda
- [ ] Nginx o'rnatilgan va ishlamoqda
- [ ] PM2 global o'rnatilgan
- [ ] Certbot o'rnatilgan

### 3. MongoDB Xavfsizlik
```bash
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "KUCHLI_PAROL_32_BELGI",
  roles: ["userAdminAnyDatabase", "readWriteAnyDatabase"]
})

use car-repair-workshop
db.createUser({
  user: "matorlife",
  pwd: "KUCHLI_PAROL_32_BELGI",
  roles: [{role: "readWrite", database: "car-repair-workshop"}]
})
exit
```

- [ ] Admin user yaratilgan
- [ ] Database user yaratilgan
- [ ] MongoDB authentication yoqilgan
- [ ] MongoDB restart qilingan

## Deployment

### 4. Loyihani Clone Qilish
```bash
cd /var/www/matorlife
git clone <YOUR_REPO_URL> .
```

- [ ] Loyiha /var/www/matorlife ga clone qilingan
- [ ] Git credentials sozlangan

### 5. Backend Sozlash
```bash
cd /var/www/matorlife/backend
cp .env.production.example .env.production
nano .env.production
```

.env.production to'ldirish:
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - 64+ belgi random string
- [ ] `GROQ_API_KEY` - Groq API key
- [ ] `TELEGRAM_BOT_TOKEN_CAR` - Telegram bot token
- [ ] `TELEGRAM_BOT_TOKEN_DEBT` - Telegram bot token
- [ ] `ADMIN_CHAT_ID` - Telegram admin chat ID
- [ ] `WEBHOOK_URL` - https://matorlife.uz/api/telegram

```bash
npm install
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

- [ ] Dependencies o'rnatilgan
- [ ] Build muvaffaqiyatli
- [ ] PM2 bilan ishga tushgan
- [ ] PM2 startup sozlangan

### 6. Frontend Sozlash
```bash
cd /var/www/matorlife/frontend
cp .env.production.example .env.production
nano .env.production
```

.env.production to'ldirish:
- [ ] `VITE_API_URL=https://matorlife.uz/api`
- [ ] `VITE_GOOGLE_MAPS_API_KEY` (optional)

```bash
npm install
npm run build
```

- [ ] Dependencies o'rnatilgan
- [ ] Build muvaffaqiyatli
- [ ] dist/ papka yaratilgan

### 7. Nginx Sozlash
```bash
sudo cp /var/www/matorlife/nginx/matorlife.conf /etc/nginx/sites-available/matorlife
sudo ln -s /etc/nginx/sites-available/matorlife /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

- [ ] Nginx config copy qilingan
- [ ] Symlink yaratilgan
- [ ] Nginx test o'tdi
- [ ] Nginx restart qilingan

### 8. SSL Certificate
```bash
sudo certbot --nginx -d matorlife.uz -d www.matorlife.uz
```

- [ ] SSL certificate olingan
- [ ] Auto-renewal sozlangan
- [ ] HTTPS ishlayapti

## Post-Deployment

### 9. Tekshirish
```bash
./scripts/health-check.sh
```

- [ ] Backend health check: `curl https://matorlife.uz/api/health`
- [ ] Frontend ochiladi: `https://matorlife.uz`
- [ ] Login ishlayapti
- [ ] API requests ishlayapti
- [ ] PM2 status: online
- [ ] MongoDB connection ishlayapti
- [ ] Nginx logs xatosiz

### 10. Backup Sozlash
```bash
chmod +x scripts/backup.sh
crontab -e
```

Cron job qo'shish:
```
0 2 * * * /var/www/matorlife/scripts/backup.sh >> /var/log/matorlife-backup.log 2>&1
```

- [ ] Backup script executable
- [ ] Cron job qo'shilgan
- [ ] Manual backup test qilingan
- [ ] Backup directory: /var/backups/matorlife

### 11. Monitoring
- [ ] PM2 logs ishlayapti: `pm2 logs`
- [ ] Nginx logs ishlayapti
- [ ] Health check script ishlayapti
- [ ] Disk space yetarli (20GB+)
- [ ] Memory yetarli (2GB+)

### 12. Security
- [ ] Firewall yoqilgan (UFW)
- [ ] Faqat 22, 80, 443 portlar ochiq
- [ ] SSH key authentication (tavsiya)
- [ ] Root login o'chirilgan (tavsiya)
- [ ] Fail2ban o'rnatilgan (tavsiya)
- [ ] .env fayllar git dan excluded

## Production URLs

- **Frontend**: https://matorlife.uz
- **Backend API**: https://matorlife.uz/api
- **Health Check**: https://matorlife.uz/api/health
- **API Docs**: https://matorlife.uz/api (coming soon)

## Useful Commands

### PM2
```bash
pm2 status                    # Status
pm2 logs mator-life-backend   # Logs
pm2 restart mator-life-backend # Restart
pm2 monit                     # Monitoring
```

### Nginx
```bash
sudo nginx -t                 # Test config
sudo systemctl restart nginx  # Restart
sudo tail -f /var/log/nginx/matorlife-error.log
```

### MongoDB
```bash
sudo systemctl status mongod  # Status
mongosh "mongodb://matorlife:PAROL@localhost:27017/car-repair-workshop?authSource=car-repair-workshop"
```

### Backup
```bash
./scripts/backup.sh           # Manual backup
./scripts/restore.sh          # Restore
```

### Health Check
```bash
./scripts/health-check.sh     # Full health check
```

## Troubleshooting

### Backend ishlamayapti
```bash
pm2 logs mator-life-backend --lines 100
pm2 restart mator-life-backend
```

### Frontend 404
```bash
sudo nginx -t
sudo systemctl restart nginx
ls -la /var/www/matorlife/frontend/dist
```

### MongoDB connection error
```bash
sudo systemctl status mongod
sudo tail -f /var/log/mongodb/mongod.log
```

### SSL certificate error
```bash
sudo certbot renew --dry-run
sudo certbot certificates
```

## Support

- GitHub Issues: [Create Issue](https://github.com/your-repo/issues)
- Email: support@matorlife.uz
- Documentation: [PRODUCTION-SETUP.md](./PRODUCTION-SETUP.md)

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Server IP**: _____________
**Notes**: _____________
