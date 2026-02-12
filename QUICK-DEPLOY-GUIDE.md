# 🚀 Tez Deploy Qilish (5 daqiqa)

## 1️⃣ Birinchi marta (faqat bir marta)

```bash
# VPS ga kirish
ssh root@your-vps-ip

# Loyihani clone qilish
cd /var/www
git clone https://github.com/Biznesjon-Official/matorlife.git
cd matorlife

# Scriptga ruxsat berish
chmod +x scripts/one-time-setup.sh

# Bir martalik sozlash
./scripts/one-time-setup.sh
```

Script sizdan so'raydi:
- MongoDB URI
- JWT Secret
- Telegram Bot Tokens
- Domain nomi

## 2️⃣ Har safar yangilanish uchun (30 soniya)

```bash
cd /var/www/matorlife
git pull
./scripts/quick-update.sh
```

Tayyor! ✅

## 🔍 Tekshirish

```bash
# Loglarni ko'rish
pm2 logs mator-life

# Status
pm2 status

# Sayt ochilishini tekshirish
curl https://matorlife.uz
```

## ⚠️ Muammo bo'lsa

```bash
# Barcha loglarni ko'rish
./scripts/check-all.sh

# Qayta ishga tushirish
pm2 restart mator-life
nginx -t && systemctl restart nginx
```
