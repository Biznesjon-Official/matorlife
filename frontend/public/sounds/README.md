# Sounds Directory

Bu papkada eslatmalar uchun audio fayllar saqlanadi.

## ✅ Hozirgi funksiyalar:

### 30 daqiqa oldin notification:
- ⏰ Browser notification
- 📱 Toast notification
- 🔕 Musiqa CHALINMAYDI (faqat ogohlantirish)

### Vaqti kelganda:
- 🔔 Browser notification
- 📱 Toast notification  
- 🎵 **MUSIQA CHALINADI** (sound.mp3)

## 🎵 Hozirgi Musiqa:

### sound.mp3
- **Tavsif**: Eslatma notification musiqa
- **Format**: MP3
- **Ovoz**: Yoqimli qo'ng'iroq

## Kerakli fayllar:

### sound.mp3
- **Maqsad**: Eslatma vaqti kelganda chalinadi
- **Format**: MP3
- **Hajm**: 100KB dan kichik (tavsiya)
- **Davomiyligi**: 1-3 soniya
- **Tavsiya**: Yoqimli qo'ng'iroq yoki alarm ovozi

## Qayerdan yuklab olish mumkin:

1. **Freesound.org** - https://freesound.org/
   - "notification bell" yoki "reminder chime" qidiring
   - Bepul va litsenziyali ovozlar
   - Masalan: https://freesound.org/people/InspectorJ/sounds/484344/

2. **Zapsplat.com** - https://www.zapsplat.com/
   - "notification" kategoriyasidan tanlang

3. **Mixkit.co** - https://mixkit.co/free-sound-effects/
   - "Alert" yoki "Notification" bo'limidan

4. **Pixabay** - https://pixabay.com/sound-effects/
   - "notification" yoki "alarm" qidiring

## O'rnatish:

1. Audio faylni yuklab oling (MP3 formatida)
2. Nomini `sound.mp3` ga o'zgartiring
3. Bu papkaga (`frontend/public/sounds/`) joylashtiring
4. Hozirgi `sound.mp3` faylini o'chirib tashlang

## Test qilish:

Brauzer konsolida:
```javascript
const audio = new Audio('/sounds/sound.mp3');
audio.play();
```

## Muhim eslatmalar:

- ⚠️ Musiqa faqat **vaqti kelgan** eslatmalarda chalinadi
- ⚠️ 30 daqiqa oldin faqat **notification** ko'rsatiladi
- ⚠️ Browser notification ruxsatini berish kerak
- ⚠️ Musiqa chalinishi uchun foydalanuvchi sahifada bo'lishi kerak
- ⚠️ MP3 formatida bo'lishi kerak
