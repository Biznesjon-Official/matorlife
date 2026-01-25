// Telefon raqami test skripti
const fs = require('fs');
const path = require('path');

// Telefon raqamlarini o'qish
const phoneFilePath = path.join(__dirname, 'telegram-car-phone-numbers.json');
let phoneData = {};

try {
  if (fs.existsSync(phoneFilePath)) {
    const data = fs.readFileSync(phoneFilePath, 'utf-8');
    phoneData = JSON.parse(data);
  }
} catch (error) {
  console.error('Fayl o\'qishda xatolik:', error);
}

console.log('📱 Ro\'yxatdan o\'tgan telefon raqamlari:');
console.log(phoneData);

// Test telefon raqamlari
const testPhones = [
  '+998 99 101 53 51',
  '998991015351',
  '+998991015351',
  '99 101 53 51',
  '991015351'
];

console.log('\n🔍 Test telefon raqamlari:');

testPhones.forEach(phone => {
  // Telefon raqamini tozalash
  let cleanPhone = phone.replace(/[^0-9]/g, '');

  // Agar 998 bilan boshlanmasa, qo'shish
  if (!cleanPhone.startsWith('998')) {
    cleanPhone = '998' + cleanPhone;
  }

  const found = phoneData[cleanPhone];

  console.log(`Original: "${phone}" → Clean: "${cleanPhone}" → Found: ${found ? 'YES ✅' : 'NO ❌'}`);
});