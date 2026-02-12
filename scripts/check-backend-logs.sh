#!/bin/bash

# Check Backend Logs Script
# Bu script backend loglarini ko'rsatadi

echo "==================================="
echo "🔍 Backend Logs Tekshirish"
echo "==================================="
echo ""

# PM2 logs
echo "📋 PM2 Logs (oxirgi 50 qator):"
pm2 logs mator-life-backend --lines 50 --nostream

echo ""
echo "==================================="
echo "📊 PM2 Status:"
pm2 status mator-life-backend

echo ""
echo "==================================="
echo "🔧 Backend .env.production tekshirish:"
if [ -f "/var/www/matorlife/backend/.env.production" ]; then
    echo "✅ .env.production mavjud"
    echo ""
    echo "Muhim o'zgaruvchilar (qiymatlar yashirin):"
    grep -E "^(PORT|NODE_ENV|MONGODB_URI|JWT_SECRET|GROQ_API_KEY)=" /var/www/matorlife/backend/.env.production | sed 's/=.*/=***HIDDEN***/'
else
    echo "❌ .env.production topilmadi!"
fi

echo ""
echo "==================================="
echo "🌐 Backend port tekshirish:"
netstat -tlnp | grep :4000 || echo "❌ Port 4000 ochiq emas"

echo ""
echo "==================================="
