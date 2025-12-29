# 🚀 Hızlı Kurulum Kılavuzu

Arkadaşın için basit talimatlar!

## ✅ Tek Gereksinim: Node.js

**Sadece Node.js kurmak yeterli:** https://nodejs.org

Başka hiçbir şey GEREKMEZ:
- ❌ Python, Java, Ruby
- ❌ MongoDB, PostgreSQL, MySQL
- ❌ Docker
- ❌ Herhangi bir hesap
- ❌ Herhangi bir API key

## 📥 Kurulum (5 Dakika)

### 1. Projeyi İndir
```bash
git clone https://github.com/OzanOrhann/SmartGuard.git
cd SmartGuard
```

### 2. Backend Çalıştır
```bash
cd smartguard_api
npm install      # Paketleri yükle (1 dakika)
node src/server.js   # Sunucuyu başlat
```

✅ Backend hazır: http://localhost:4000

### 3. Simulator Çalıştır (Yeni Terminal)
```bash
cd smartguard_api
node src/simulator.js
```

✅ Sensör verisi üretiyor

### 4. Web Aç (Yeni Terminal)
```bash
cd smartguard-web
npm install       # İlk seferde gerekli
npm run dev
```

✅ Web hazır: http://localhost:3000

## 🎮 Kullanım

1. Web'i aç: http://localhost:3000
2. "Login" sayfasından giriş yap (herhangi bir user/pass)
3. Dashboard'da sensör verilerini görürsün
4. Alarms sayfasında alarm geçmişini görürsün

## ⚙️ Opsiyonel: Email Bildirimleri

**Email olmadan da çalışır!** Sadece istersen email göndermek için:

1. `smartguard_api/.env.example` dosyasını `.env` olarak kopyala
2. Gmail bilgilerini gir (App Password gerekir)

Email ayarlamazsan mock mod çalışır (konsola yazar, mail göndermez).

## 🛠️ Otomatik Oluşan Dosyalar

İlk çalıştırmada otomatik oluşur:
- `smartguard_api/smartguard.db` - SQLite veritabanı
- `smartguard-web/.next/` - Next.js build klasörü

Bu dosyaları silip tekrar çalıştırabilirsin, otomatik yeniden oluşur.

## ❓ Sorun Giderme

**Port çakışması:**
```bash
# Başka bir uygulama 4000 veya 3000 portunu kullanıyorsa
# O uygulamayı kapat veya farklı port kullan
```

**npm install hatası:**
```bash
# Node.js versiyonu düşükse güncelle: https://nodejs.org
# npm cache temizle: npm cache clean --force
```

**SQLite hatası (Windows):**
```bash
# Visual Studio Build Tools gerekebilir (nadiren)
# Otomatik yüklenir, problem yapmaz genelde
```

## 🎯 Özet

1. Node.js kur
2. `npm install` yap
3. `node src/server.js` çalıştır
4. `node src/simulator.js` çalıştır
5. `npm run dev` çalıştır

Hepsi bu kadar! 🎉
