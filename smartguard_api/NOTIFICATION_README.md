# 📱 SmartGuard Notification Service

Standalone bildirim servisi. Telefon A'dan gelen verileri alıp Telefon B'ye push bildirim gönderir.

## 🚀 Kullanım

### 1. Standalone Server (Ayrı Çalıştır)

```bash
node notification-server.js
```

Port: **5000** (veya `NOTIFICATION_PORT` env variable)

### 2. Mevcut Backend'e Entegre Et

```javascript
// server.js veya app.js
const notificationRoutes = require('./src/routes/notification');

app.use('/api/notification', notificationRoutes);
```

## 📡 API Endpoints

### 1. Token Kaydet

**POST** `/api/notification/register-token`

```json
{
  "userId": "user123",
  "token": "ExponentPushToken[xxxxxx]"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user123",
  "token": "ExponentPushToken[xxxxxx]"
}
```

---

### 2. Veri Gönder + Bildirim (Ana Endpoint) ⭐

**POST** `/api/notification/send`

```json
{
  "data": {
    "type": "fall",
    "value": 2.5,
    "timestamp": 1704240000000
  },
  "targetUsers": ["user123", "user456"]
}
```

**Response:**
```json
{
  "success": true,
  "sent": 2,
  "result": { ... }
}
```

**Desteklenen veri tipleri:**
- `type: "fall"` → 🚨 Düşme Algılandı
- `type: "heartRate"` → ❤️ Kalp Atışı
- `type: "spo2"` → 🫁 Oksijen Seviyesi
- `type: "immobile"` → ⚠️ Hareketsizlik

---

### 3. Direkt Push Gönder

**POST** `/api/notification/push`

```json
{
  "tokens": "ExponentPushToken[xxxxxx]",
  "title": "Test Bildirim",
  "body": "Merhaba!",
  "data": { "custom": "value" }
}
```

---

### 4. Token Al

**GET** `/api/notification/token/:userId`

**Response:**
```json
{
  "success": true,
  "userId": "user123",
  "token": "ExponentPushToken[xxxxxx]"
}
```

---

### 5. Kullanıcıları Listele

**GET** `/api/notification/users`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "users": ["user123", "user456"]
}
```

---

### 6. Token Sil

**DELETE** `/api/notification/token/:userId`

## 💻 Kullanım Örnekleri

### Mobil App (React Native)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000';

// 1. Token kaydet (uygulama başlangıcında)
async function registerToken() {
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id'
  });
  
  await axios.post(`${API_URL}/api/notification/register-token`, {
    userId: 'user123',
    token: token.data
  });
}

// 2. Veri gönder + Bildirim
async function sendDataAndNotify() {
  await axios.post(`${API_URL}/api/notification/send`, {
    data: {
      type: 'fall',
      value: 2.5,
      timestamp: Date.now()
    },
    targetUsers: ['user123'] // Telefon B
  });
}
```

### Backend (Node.js)

```javascript
const notificationService = require('./src/services/NotificationService');

// Token kaydet
notificationService.registerToken('user123', 'ExponentPushToken[xxx]');

// Bildirim gönder
await notificationService.processAndNotify({
  data: { type: 'fall', value: 2.5 },
  targetUsers: ['user123']
});
```

## 🎨 Veri Formatını Özelleştir

`src/services/NotificationService.js` → `processIncomingData()` fonksiyonunu düzenle:

```javascript
processIncomingData(data) {
  // Kendi formatını ekle
  if (data.type === 'custom') {
    return {
      title: '⚡ Özel Uyarı',
      body: `Değer: ${data.value}`,
      ...data
    };
  }
  
  return data;
}
```

## 🌐 Ücretsiz Server Deploy

### Render.com (Önerilen)

1. GitHub'a push
2. [render.com](https://render.com) → New Web Service
3. Connect repository
4. Build Command: `npm install`
5. Start Command: `node notification-server.js`
6. Deploy!

### Railway.app

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Fly.io

```bash
fly launch
fly deploy
```

## 📦 Paket Gereksinimleri

```json
{
  "express": "^4.19.0",
  "cors": "^2.8.5"
}
```

## 🔒 Güvenlik

Production'da:
- API key ekle (header: `X-API-Key`)
- Rate limiting ekle
- Token'ları database'de sakla (şimdi in-memory)

## 🆘 Sorun Giderme

**Token geçersiz:**
```
Geçersiz Expo push token
```
→ Token `ExponentPushToken[...]` formatında olmalı

**Bildirim gitmiyor:**
- Cihazda bildirim izinleri açık mı?
- Token doğru mu? `/api/notification/token/:userId` ile kontrol et
- Expo hesabı active mi?

## 📝 Test

```bash
# Health check
curl http://localhost:5000

# Token kaydet
curl -X POST http://localhost:5000/api/notification/register-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","token":"ExponentPushToken[xxx]"}'

# Bildirim gönder
curl -X POST http://localhost:5000/api/notification/send \
  -H "Content-Type: application/json" \
  -d '{"data":{"type":"fall","value":2.5},"targetUsers":["test"]}'
```
