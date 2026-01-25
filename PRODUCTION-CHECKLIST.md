# 🚀 Production Deployment Checklist

Production ga deploy qilishdan oldin ushbu checklistni bajaring.

## 📋 Pre-Deployment

### 1. Environment Variables
- [ ] `.env.production` faylini yaratdingizmi?
- [ ] `MONGO_ROOT_PASSWORD` ni kuchli parol bilan to'ldirdingizmi? (32+ belgi)
- [ ] `JWT_SECRET` ni random string bilan to'ldirdingizmi? (64+ belgi)
- [ ] `GROQ_API_KEY` ni to'g'ri kiritdingizmi?
- [ ] `TELEGRAM_BOT_TOKEN_CAR` va `TELEGRAM_BOT_TOKEN_DEBT` ni kiritdingizmi?
- [ ] `ADMIN_CHAT_ID` ni to'g'ri kiritdingizmi?
- [ ] `WEBHOOK_URL` ni production domain bilan to'ldirdingizmi?
- [ ] `VITE_GOOGLE_MAPS_API_KEY` ni kiritdingizmi?

### 2. Security
- [ ] Barcha `.env` fayllar git dan o'chirilganmi?
- [ ] `.gitignore` to'g'ri sozlanganmi?
- [ ] API keys production uchun yangilanganmi?
- [ ] JWT secret kuchli va unique mi?
- [ ] Database password kuchli mi?

### 3. Code Quality
- [ ] TypeScript errors yo'qmi?
- [ ] Linting errors yo'qmi?
- [ ] Console.log lar o'chirilganmi?
- [ ] Debug code lar o'chirilganmi?
- [ ] Commented code lar tozalanganmi?

### 4. Testing
- [ ] Backend testlar o'tganmi?
- [ ] Frontend testlar o'tganmi?
- [ ] API endpoints test qilinganmi?
- [ ] Authentication ishlayaptimi?
- [ ] Authorization to'g'ri ishlayaptimi?

## 🐳 Docker Deployment

### 1. Build
```bash
# Dependencies o'rnatish
npm run install:all

# Docker build
npm run docker:build
```

### 2. Configuration
- [ ] `docker-compose.yml` to'g'ri sozlanganmi?
- [ ] `.env.production` faylida barcha qiymatlar to'ldirilganmi?
- [ ] Port conflicts yo'qmi?
- [ ] Volume paths to'g'rimi?

### 3. Deploy
```bash
# Ishga tushirish
npm run docker:up

# Loglarni tekshirish
npm run docker:logs

# Status tekshirish
docker-compose ps
```

### 4. Verification
- [ ] Backend health check ishlayaptimi? (`http://localhost:4000/api/health`)
- [ ] Frontend ochilayaptimi? (`http://localhost`)
- [ ] MongoDB connection ishlayaptimi?
- [ ] API requests ishlayaptimi?

## 🌐 Server Setup

### 1. VPS Requirements
- [ ] Ubuntu 20.04+ yoki CentOS 8+
- [ ] 2GB+ RAM
- [ ] 20GB+ disk space
- [ ] Docker va Docker Compose o'rnatilgan
- [ ] Git o'rnatilgan

### 2. Domain & DNS
- [ ] Domain sotib olinganmi?
- [ ] DNS A record sozlanganmi?
- [ ] Domain server IP ga ko'rsatyaptimi?

### 3. Nginx Setup
- [ ] Nginx o'rnatilganmi?
- [ ] Reverse proxy sozlanganmi?
- [ ] SSL certificate olinganmi? (Let's Encrypt)
- [ ] HTTPS redirect sozlanganmi?

### 4. Firewall
```bash
# UFW sozlash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

- [ ] Firewall sozlanganmi?
- [ ] Faqat kerakli portlar ochiqmi?
- [ ] SSH port xavfsizmi?

## 🔒 Security Hardening

### 1. Server Security
- [ ] SSH key authentication yoqilganmi?
- [ ] Root login o'chirilganmi?
- [ ] Fail2ban o'rnatilganmi?
- [ ] Automatic security updates yoqilganmi?

### 2. Application Security
- [ ] Rate limiting ishlayaptimi?
- [ ] Helmet.js middleware yoqilganmi?
- [ ] CORS to'g'ri sozlanganmi?
- [ ] Input validation ishlayaptimi?

### 3. Database Security
- [ ] MongoDB authentication yoqilganmi?
- [ ] Database faqat localhost dan accessible mi?
- [ ] Regular backup sozlanganmi?
- [ ] Backup encryption yoqilganmi?

## 📊 Monitoring

### 1. Logging
- [ ] Application logs sozlanganmi?
- [ ] Error tracking (Sentry) sozlanganmi?
- [ ] Log rotation sozlanganmi?

### 2. Uptime Monitoring
- [ ] Uptime monitoring service sozlanganmi? (UptimeRobot, Pingdom)
- [ ] Alert notifications sozlanganmi?
- [ ] Status page yaratilganmi?

### 3. Performance
- [ ] Response time monitoring
- [ ] Database query optimization
- [ ] CDN sozlanganmi? (agar kerak bo'lsa)

## 🔄 Backup Strategy

### 1. Database Backup
```bash
# Daily backup script
0 2 * * * /path/to/backup-script.sh
```

- [ ] Automatic daily backup sozlanganmi?
- [ ] Backup retention policy belgilanganmi?
- [ ] Backup restore test qilinganmi?
- [ ] Off-site backup sozlanganmi?

### 2. Code Backup
- [ ] Git repository backup
- [ ] Environment files backup (encrypted)
- [ ] Configuration files backup

## 📱 Post-Deployment

### 1. Functional Testing
- [ ] Login/Register ishlayaptimi?
- [ ] CRUD operations ishlayaptimi?
- [ ] File uploads ishlayaptimi?
- [ ] AI Chat ishlayaptimi?
- [ ] Telegram bot ishlayaptimi?

### 2. Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] Images optimized

### 3. Mobile Testing
- [ ] Mobile responsive
- [ ] Touch interactions ishlayapti
- [ ] PWA install ishlayapti

### 4. Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## 📞 Support & Maintenance

### 1. Documentation
- [ ] API documentation yaratilganmi?
- [ ] User guide yaratilganmi?
- [ ] Admin guide yaratilganmi?

### 2. Monitoring Setup
- [ ] Error alerts sozlanganmi?
- [ ] Performance alerts sozlanganmi?
- [ ] Uptime alerts sozlanganmi?

### 3. Maintenance Plan
- [ ] Update schedule belgilanganmi?
- [ ] Backup verification schedule
- [ ] Security audit schedule

## ✅ Final Verification

```bash
# Health checks
curl http://yourdomain.com/api/health
curl https://yourdomain.com/api/health

# SSL check
openssl s_client -connect yourdomain.com:443

# Performance test
ab -n 100 -c 10 http://yourdomain.com/
```

- [ ] All health checks passing
- [ ] SSL certificate valid
- [ ] Performance acceptable
- [ ] No console errors
- [ ] No network errors

## 🎉 Launch!

Barcha checklar o'tgandan keyin:

1. ✅ Final backup oling
2. ✅ Monitoring ni yoqing
3. ✅ Team ga xabar bering
4. ✅ Users ga announce qiling
5. ✅ Celebrate! 🎊

---

**Eslatma**: Bu checklist har bir deployment uchun ishlatilishi kerak. Har bir item ni diqqat bilan tekshiring!
