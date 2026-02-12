#!/bin/bash

# Fix Nginx IPv6 Issue - Change localhost to 127.0.0.1
# Bu script Nginx konfiguratsiyasida localhost ni 127.0.0.1 ga o'zgartiradi

echo "🔧 Nginx IPv6 muammosini tuzatish..."

# Backup current config
sudo cp /etc/nginx/sites-available/matorlife /etc/nginx/sites-available/matorlife.backup.$(date +%Y%m%d_%H%M%S)

# Replace localhost with 127.0.0.1
sudo sed -i 's|http://localhost:4000|http://127.0.0.1:4000|g' /etc/nginx/sites-available/matorlife

echo "✅ Nginx konfiguratsiya yangilandi"

# Test configuration
echo "🧪 Nginx konfiguratsiyani tekshirish..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx konfiguratsiya to'g'ri"
    
    # Reload Nginx
    echo "🔄 Nginx ni qayta yuklash..."
    sudo systemctl reload nginx
    
    echo "✅ Nginx muvaffaqiyatli qayta yuklandi"
    
    # Wait a moment
    sleep 2
    
    # Test health endpoint
    echo ""
    echo "🧪 Health endpoint ni tekshirish..."
    curl -s https://matorlife.uz/api/health | jq '.' || curl -s https://matorlife.uz/api/health
    
    echo ""
    echo "✅ Tayyor! Endi brauzerda https://matorlife.uz ni oching"
else
    echo "❌ Nginx konfiguratsiyada xato bor"
    exit 1
fi
