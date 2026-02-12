#!/bin/bash

echo "🔧 Production muammolarini tuzatish..."

# Backend papkasiga o'tish
cd /var/www/matorlife/backend

# Production .env faylini nusxalash
echo "📝 Production .env faylini sozlash..."
cp .env.production .env

# Node modules ni qayta o'rnatish
echo "📦 Dependencies ni yangilash..."
npm install

# TypeScript ni compile qilish
echo "🔨 TypeScript ni compile qilish..."
npm run build

# PM2 ni to'xtatish
echo "⏸️  PM2 ni to'xtatish..."
pm2 stop mator-life

# PM2 ni tozalash
echo "🧹 PM2 ni tozalash..."
pm2 delete mator-life

# PM2 ni qayta ishga tushirish
echo "🚀 PM2 ni qayta ishga tushirish..."
pm2 start ecosystem.config.js

# PM2 ni saqlash
echo "💾 PM2 konfiguratsiyasini saqlash..."
pm2 save

echo "✅ Tayyor! Loglarni tekshiring:"
echo "pm2 logs mator-life"
