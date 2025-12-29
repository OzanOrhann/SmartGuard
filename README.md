# SmartGuard - Yaşlı/Riskli Birey Sağlık İzleme Sistemi

Gerçek zamanlı sağlık verisi takibi, otomatik alarm sistemi ve senaryolu simülasyon içeren full-stack health monitoring platformu.

## 🎯 Özellikler

### 📊 Gerçek Zamanlı İzleme
- **Vital Sinyaller:** Nabız (HR), Oksijen (SpO₂), Kan Basıncı
- **Hareket Takibi:** 3 eksenli ivme sensörü (ax, ay, az)
- **Aktivite Durumu:** Hareketsizlik süresi, düşme tespiti

### 🚨 Akıllı Alarm Sistemi
- **Düşük/Yüksek Nabız:** Eşik değerlere göre uyarı
- **Düşük Oksijen:** SpO₂ seviyesi kritik olunca
- **Hareketsizlik:** 5+ saniye hareket yoksa (bayılma/felç şüphesi)
- **Düşme Tespiti:** Yüksek G-force + yerde pozisyon
- **Kritik Durum:** Çok düşük nabız + hareketsizlik (acil)

### 🎭 Senaryolu Simülasyon
- **Hareketsizlik Senaryosu** (%1 olasılık, 10 saniye)
  - Sensör değerleri neredeyse sabit kalır
  - Nabız ±1, SpO₂ ±0.5 değişir
  - Minimal ivme (~0.03g)
  
- **Düşme + Bayılma Senaryosu** (%0.3 olasılık, 8 saniye)
  - İlk an: Yüksek G-force (2.5-4g)
  - Sonra: Yerde pozisyon (az < 0.2g)
  - Kritik vital: HR 35-42 bpm, SpO₂ %85-90

### 🗄️ SQLite Veritabanı
- Taşınabilir (sıfır kurulum)
- Alarm geçmişi kalıcı depolama
- Acceleration verileri kaydediliyor

## 📱 Platformlar

1. **Web** - Next.js dashboard
2. **Mobile** - React Native (Android/iOS)
3. **Backend API** - Node.js + Socket.io
4. **Simulator** - Gerçekçi sensör veri üreteci

## 🚀 Hızlı Başlangıç

### 1. Repository'yi Klonlayın
```bash
git clone https://github.com/OzanOrhann/SmartGuard.git
cd SmartGuard
```

### 2. Backend API'yi Başlatın
```bash
cd smartguard_api
npm install

# .env dosyası OPSIYONEL (email özelliği kullanmayacaksanız atla)
# Sadece alarm email göndermek isterseniz:
cp .env.example .env
# .env dosyasını açıp Gmail bilgilerinizi girin

node src/server.js
```

✅ **Otomatik oluşur:**
- `smartguard.db` dosyası (SQLite veritabanı)
- Tüm tablolar ve index'ler

### 3. Simulator'ı Başlatın (Ayrı Terminal)

**ÖNEMLİ:** Gerçek bileklik bağlayacaksanız bu adımı **atlayın**! BLE kullanırken simulator kapalı olmalı.

```bash
cd smartguard_api
node src/simulator.js
```

### 4. Web Uygulamasını Başlatın (Ayrı Terminal)
```bash
cd smartguard-web
npm install
npm run dev
```

Web: http://localhost:3000

### 5. Mobil Uygulamayı Başlatın (Opsiyonel)

```bash
cd smartguard-mobile
npm install
npx expo start
```

**🩺 BLE (Bluetooth) ile Gerçek Bileklik Bağlama:**
- Mobil app'te "Bluetooth" sekmesine gidin
- "Bileklik Ara" butonuna tıklayın
- Bilekliğinizi seçip bağlanın
- Gerçek sensör verisi otomatik backend'e gönderilir
- **Detaylı kılavuz:** [BLE_KULLANIM.md](BLE_KULLANIM.md)

## 📋 Gereksinimler

**Sadece Node.js yeterli! Başka bir şey kurmanıza gerek yok.**

- **Node.js 18+** (https://nodejs.org)
- npm (Node.js ile birlikte gelir)
- **Expo Go** (mobil için, tamamen opsiyonel)

❌ **GEREKMEZ:**
- Python, Java, veya başka bir runtime
- MongoDB, PostgreSQL gibi harici veritabanı
- Docker
- Herhangi bir hesap oluşturma (email hariç - opsiyonel)

## ⚙️ Ayarlar (Settings Sayfası)

Eşik değerleri özelleştirilebilir:
- **minHR:** Minimum nabız (varsayılan: 40 bpm)
- **maxHR:** Maksimum nabız (varsayılan: 120 bpm)
- **minSpO₂:** Minimum oksijen (varsayılan: %92)
- **immobileSec:** Hareketsizlik süresi (varsayılan: 600 saniye)
- **fallG:** Düşme eşiği (varsayılan: 2.0g)

## 🏗️ Proje Yapısı

```
SmartGuard/
├── smartguard_api/       # Backend API
│   ├── src/
│   │   ├── server.js     # Express + Socket.io
│   │   ├── simulator.js  # Sensör simülasyonu (opsiyonel)
│   │   └── models/
│   │       └── Alarm.js  # SQLite model
│   └── smartguard.db     # Veritabanı (otomatik oluşur)
│
├── smartguard-web/       # Web Dashboard
│   └── src/
│       ├── app/          # Next.js pages
│       └── hooks/        # Custom hooks
│
└── smartguard-mobile/    # React Native App
    └── src/
        ├── screens/      # Mobil ekranlar (+ BluetoothScreen)
        ├── services/     # BLEService (bileklik bağlantısı)
        └── hooks/        # Custom hooks
```

## 🔧 Teknolojiler

**Backend:**
- Node.js + Express
- Socket.io (WebSocket)
- SQLite (better-sqlite3)
- Nodemailer (Email - opsiyonel)

**Web:**
- Next.js 14
- TailwindCSS
- Zustand (State)
- Socket.io-client

**Mobil:**
- React Native (Expo)
- react-native-ble-plx (Bluetooth)
- Socket.io-client
- Expo Notifications

**Email olmadan da tüm özellikler çalışır!** Email sadece alarm bildirimleri göndermek için.

Kullanmak isterseniz:

**Gmail için:**
1. `.env.example` dosyasını `.env` olarak kopyalayın
2. Google hesabında "2-Step Verification" aktif edin
3. https://myaccount.google.com/apppasswords adresinden "App Password" oluşturun
4. `.env` dosyasına email ve şifre girin

**Gmail olmadan da çalışır:** Email özelliğini kullanmazsanız hiçbir şey yapmanıza gerek yok
## 📧 Email Bildirimleri

Alarmlar email ile gönderilebilir. `.env` dosyasında SMTP ayarları yapılmalı:

**Gmail için:**
1. Google hesabında "2-Step Verification" aktif olmalı
2. "App Passwords" oluşturun
3. `.env` dosyasına ekleyin

## 🎮 Test Senaryoları

### Option 1: Simulator (Mock Veri)

Simulator çalışırken:
- **Normal durum:** Rastgele ama gerçekçi değerler
- **%1 olasılık:** Hareketsizlik senaryosu başlar (10 saniye)
- **%0.3 olasılık:** Düşme senaryosu başlar (8 saniye)

Konsol çıktısında görürsünüz:
```
🔴 HAREKETSİZLİK SENARYOSU BAŞLADI
🔴 DÜŞME SENARYOSU BAŞLADI
```

### Option 2: Gerçek Bileklik (BLE)

Mobil app'te:
1. "Bluetooth" sekmesine git
2. "Bileklik Ara" → Cihazı seç → Bağlan
3. Gerçek sensör verisi gelmeye başlar
4. **Simulator'ü kapat!** (İki kaynak çakışmasın)

**Detaylar:** [BLE_KULLANIM.md](BLE_KULLANIM.md)

## 📸 Ekran Görüntüleri

- **Status Dashboard:** Tüm vital sinyaller, ivme değerleri, aktivite durumu
- **Alarms History:** Geçmiş alarmlar, neden tetiklendiği, email gönderme
- **Settings:** Eşik değerleri özelleştirme

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit edin (`git commit -m 'feat: amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

## 👨‍💻 Geliştirici

Ozan Orhan - [@OzanOrhann](https://github.com/OzanOrhann)
