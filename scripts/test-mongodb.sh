#!/bin/bash

echo "🔍 MongoDB ulanishini tekshirish..."

cd /var/www/matorlife/backend

# .env faylini o'qish
if [ -f .env ]; then
    echo "✅ .env fayli topildi"
    echo ""
    echo "📋 NODE_ENV:"
    grep NODE_ENV .env
    echo ""
    echo "📋 MONGODB_URI (birinchi 50 belgi):"
    grep MONGODB_URI .env | cut -c1-50
    echo "..."
else
    echo "❌ .env fayli topilmadi!"
    exit 1
fi

echo ""
echo "🔌 MongoDB ulanishini test qilish..."

# Node.js orqali test
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('🔗 URI mavjud:', !!uri);

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB ulanish muvaffaqiyatli!');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ MongoDB ulanish xatosi:', err.message);
  process.exit(1);
});
"

echo ""
echo "✅ Test tugadi"
