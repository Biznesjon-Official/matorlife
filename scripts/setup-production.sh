#!/bin/bash

# Mator Life Production Setup Script
# Bu script production serverni to'liq sozlaydi

set -e

echo "🚀 Mator Life Production Setup boshlandi..."

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Root check
if [ "$EUID" -eq 0 ]; then 
    print_error "Bu scriptni root sifatida ishlatmang!"
    exit 1
fi

# 1. System yangilash
print_step "1/10: System yangilanmoqda..."
sudo apt update && sudo apt upgrade -y
print_success "System yangilandi"

# 2. Node.js o'rnatish
print_step "2/10: Node.js 18 LTS o'rnatilmoqda..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js o'rnatildi: $(node -v)"
else
    print_info "Node.js allaqachon o'rnatilgan: $(node -v)"
fi

# 3. MongoDB o'rnatish
print_step "3/10: MongoDB o'rnatilmoqda..."
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
    print_success "MongoDB o'rnatildi"
else
    print_info "MongoDB allaqachon o'rnatilgan"
fi

# 4. Nginx o'rnatish
print_step "4/10: Nginx o'rnatilmoqda..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx o'rnatildi"
else
    print_info "Nginx allaqachon o'rnatilgan"
fi

# 5. PM2 o'rnatish
print_step "5/10: PM2 o'rnatilmoqda..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 o'rnatildi"
else
    print_info "PM2 allaqachon o'rnatilgan"
fi

# 6. Certbot o'rnatish (SSL uchun)
print_step "6/10: Certbot o'rnatilmoqda..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot o'rnatildi"
else
    print_info "Certbot allaqachon o'rnatilgan"
fi

# 7. Firewall sozlash
print_step "7/10: Firewall sozlanmoqda..."
sudo apt install -y ufw
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
print_success "Firewall sozlandi"

# 8. Project directory yaratish
print_step "8/10: Project directory yaratilmoqda..."
sudo mkdir -p /var/www/matorlife
sudo chown -R $USER:$USER /var/www/matorlife
print_success "Project directory yaratildi: /var/www/matorlife"

# 9. MongoDB xavfsizlik sozlamalari
print_step "9/10: MongoDB xavfsizlik sozlanmoqda..."
print_info "MongoDB user yaratish uchun quyidagi commandlarni ishga tushiring:"
echo ""
echo "mongosh"
echo "use admin"
echo "db.createUser({user: 'admin', pwd: 'KUCHLI_PAROL', roles: ['userAdminAnyDatabase', 'readWriteAnyDatabase']})"
echo "use car-repair-workshop"
echo "db.createUser({user: 'matorlife', pwd: 'KUCHLI_PAROL', roles: [{role: 'readWrite', database: 'car-repair-workshop'}]})"
echo "exit"
echo ""
read -p "MongoDB user yaratdingizmi? (yes/no): " MONGO_SETUP

if [ "$MONGO_SETUP" = "yes" ]; then
    # MongoDB authentication yoqish
    sudo sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
    sudo systemctl restart mongod
    print_success "MongoDB xavfsizlik sozlandi"
fi

# 10. Backup directory yaratish
print_step "10/10: Backup directory yaratilmoqda..."
sudo mkdir -p /var/backups/matorlife
sudo chown -R $USER:$USER /var/backups/matorlife
print_success "Backup directory yaratildi"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "🎉 Production server muvaffaqiyatli sozlandi!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Keyingi qadamlar:"
echo "1. Loyihani /var/www/matorlife ga clone qiling"
echo "2. Backend .env.production faylini sozlang"
echo "3. Frontend .env.production faylini sozlang"
echo "4. Backend va Frontend ni build qiling"
echo "5. PM2 bilan backend ni ishga tushiring"
echo "6. Nginx konfiguratsiyasini sozlang"
echo "7. SSL certificate oling (certbot)"
echo ""
print_info "Batafsil ko'rsatma: PRODUCTION-SETUP.md"
