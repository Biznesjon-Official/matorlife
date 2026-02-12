#!/bin/bash

echo "🔧 Duplicate index muammosini hal qilish..."

cd /var/www/matorlife

# 1. Yangi kodlarni pull qilish
echo "📥 Git pull..."
git pull origin main

# 2. Backend papkasiga o'tish
cd backend

# 3. Node modules ni tozalash
echo "🧹 Node modules ni tozalash..."
rm -rf node_modules package-lock.json

# 4. Dependencies ni qayta o'rnatish
echo "📦 Dependencies ni o'rnatish..."
npm install

# 5. Dist papkasini tozalash
echo "🗑️  Eski build ni o'chirish..."
rm -rf dist

# 6. TypeScript ni compile qilish
echo "🔨 TypeScript ni compile qilish..."
npm run build

# 7. PM2 ni to'xtatish
echo "⏸️  PM2 ni to'xtatish..."
pm2 stop mator-life

# 8. PM2 ni o'chirish
echo "🗑️  PM2 processni o'chirish..."
pm2 delete mator-life

# 9. PM2 ni qayta ishga tushirish
echo "🚀 PM2 ni qayta ishga tushirish..."
pm2 start ecosystem.config.js

# 10. PM2 ni saqlash
echo "💾 PM2 konfiguratsiyasini saqlash..."
pm2 save

echo ""
echo "✅ Tayyor! 10 soniya kutib loglarni tekshiring..."
sleep 10

echo ""
echo "📋 Loglar:"
pm2 logs mator-life --lines 30 --nostream

echo ""
echo "💡 Real-time loglarni ko'rish uchun:"
echo "pm2 logs mator-life"
