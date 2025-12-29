# SmartGuard API

Backend API servisi - Sağlık sensör verileri, alarm sistemi ve WebSocket desteği.

## 🚀 Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Ortam değişkenlerini ayarlayın:**
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
PORT=4000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📦 Çalıştırma

**Backend sunucusunu başlatın:**
```bash
node src/server.js
```

**Simulator'ı başlatın:** (Ayrı terminal)
```bash
node src/simulator.js
```

Server http://localhost:4000 adresinde çalışacak.

## 🗄️ Veritabanı

SQLite kullanılıyor - otomatik olarak `smartguard.db` dosyası oluşturulur.

## 📡 API Endpoints

- `GET /api/latest` - Son sensör verisi
- `GET /api/thresholds` - Eşik değerleri
- `POST /api/thresholds` - Eşik güncelleme
- `GET /api/alarms/history/:userId` - Alarm geçmişi
- `POST /api/alarms/save` - Alarm kaydetme
- `POST /api/alarms/email` - Alarm email gönderme
- `POST /api/simulator/start` - Simulator başlat
- `POST /api/simulator/stop` - Simulator durdur
- `GET /api/simulator/status` - Simulator durumu

## 🔌 WebSocket

Socket.io ile real-time veri akışı:
- `sensor` event: Canlı sensör verileri
