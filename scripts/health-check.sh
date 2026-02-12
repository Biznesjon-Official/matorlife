#!/bin/bash

# Mator Life Health Check Script
# Bu script production serverning holatini tekshiradi

echo "🏥 Mator Life Health Check..."
echo ""

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_fail() {
    echo -e "${RED}❌ $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

ERRORS=0

# 1. PM2 Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. PM2 Status:"
if pm2 list | grep -q "mator-life-backend.*online"; then
    print_ok "Backend ishlamoqda"
    pm2 list | grep "mator-life-backend"
else
    print_fail "Backend ishlamayapti"
    ((ERRORS++))
fi
echo ""

# 2. Backend Health
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Backend Health Check:"
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    print_ok "Backend health check o'tdi (HTTP $BACKEND_HEALTH)"
    curl -s http://localhost:4000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:4000/api/health
else
    print_fail "Backend health check failed (HTTP $BACKEND_HEALTH)"
    ((ERRORS++))
fi
echo ""

# 3. MongoDB Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. MongoDB Status:"
if systemctl is-active --quiet mongod; then
    print_ok "MongoDB ishlamoqda"
    systemctl status mongod | grep "Active:"
else
    print_fail "MongoDB ishlamayapti"
    ((ERRORS++))
fi
echo ""

# 4. Nginx Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Nginx Status:"
if systemctl is-active --quiet nginx; then
    print_ok "Nginx ishlamoqda"
    systemctl status nginx | grep "Active:"
    
    # Nginx config test
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        print_ok "Nginx configuration to'g'ri"
    else
        print_fail "Nginx configuration xato"
        ((ERRORS++))
    fi
else
    print_fail "Nginx ishlamayapti"
    ((ERRORS++))
fi
echo ""

# 5. Disk Space
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Disk Space:"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    print_ok "Disk space: ${DISK_USAGE}% ishlatilgan"
elif [ "$DISK_USAGE" -lt 90 ]; then
    print_warn "Disk space: ${DISK_USAGE}% ishlatilgan (80% dan ko'p)"
else
    print_fail "Disk space: ${DISK_USAGE}% ishlatilgan (90% dan ko'p!)"
    ((ERRORS++))
fi
df -h / | grep -v "Filesystem"
echo ""

# 6. Memory Usage
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Memory Usage:"
free -h
MEMORY_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    print_ok "Memory: ${MEMORY_USAGE}% ishlatilgan"
elif [ "$MEMORY_USAGE" -lt 90 ]; then
    print_warn "Memory: ${MEMORY_USAGE}% ishlatilgan (80% dan ko'p)"
else
    print_fail "Memory: ${MEMORY_USAGE}% ishlatilgan (90% dan ko'p!)"
fi
echo ""

# 7. SSL Certificate
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. SSL Certificate:"
if [ -d "/etc/letsencrypt/live" ]; then
    CERT_DOMAINS=$(sudo ls /etc/letsencrypt/live/ 2>/dev/null | grep -v README)
    if [ -n "$CERT_DOMAINS" ]; then
        print_ok "SSL certificate mavjud: $CERT_DOMAINS"
        
        # Certificate expiry check
        for domain in $CERT_DOMAINS; do
            CERT_FILE="/etc/letsencrypt/live/$domain/cert.pem"
            if [ -f "$CERT_FILE" ]; then
                EXPIRY=$(sudo openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
                EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
                NOW_EPOCH=$(date +%s)
                DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
                
                if [ "$DAYS_LEFT" -gt 30 ]; then
                    print_ok "Certificate expires in $DAYS_LEFT days"
                elif [ "$DAYS_LEFT" -gt 7 ]; then
                    print_warn "Certificate expires in $DAYS_LEFT days (30 kundan kam)"
                else
                    print_fail "Certificate expires in $DAYS_LEFT days (7 kundan kam!)"
                    ((ERRORS++))
                fi
            fi
        done
    else
        print_warn "SSL certificate topilmadi"
    fi
else
    print_warn "Let's Encrypt directory topilmadi"
fi
echo ""

# 8. Recent Logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. Recent Backend Errors (last 10):"
if [ -f "/var/www/matorlife/backend/logs/err.log" ]; then
    tail -10 /var/www/matorlife/backend/logs/err.log 2>/dev/null || echo "No errors"
else
    echo "Error log topilmadi"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    print_ok "🎉 Barcha tekshiruvlar muvaffaqiyatli o'tdi!"
    exit 0
else
    print_fail "⚠️  $ERRORS ta muammo topildi!"
    exit 1
fi
