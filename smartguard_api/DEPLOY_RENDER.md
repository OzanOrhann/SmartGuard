# 🚀 Render.com Deploy Rehberi

## Hızlı Deploy (2 dakika)

### 1. GitHub'a Push
```bash
git add .
git commit -m "Add notification service"
git push origin main
```

### 2. Render.com'a Git

1. [render.com](https://render.com) → Ücretsiz kaydol
2. **New** → **Web Service**
3. GitHub repository'yi bağla: `SmartGuard`
4. **Build Command:** `npm install`
5. **Start Command:** `node notification-server.js`
6. Plan: **Free**
7. **Create Web Service**

✅ Deploy başlar! URL: `https://smartguard-xxx.onrender.com`

### 3. Environment Variables (Opsiyonel)

Render dashboard → Environment:
```
NOTIFICATION_PORT=5000
NODE_ENV=production
```

### 4. Mobil Uygulamada URL Güncelle

```typescript
// src/config.ts
export const NOTIFICATION_API = 'https://smartguard-xxx.onrender.com';
```

## İki Servis Birden Deploy

Ana backend + Bildirim servisi ayrı olarak:

### Yöntem 1: Tek Repository, İki Service

**render.yaml** zaten hazır! Render otomatik 2 servis oluşturur:
- `smartguard-api` (Port 4000)
- `smartguard-notifications` (Port 5000)

### Yöntem 2: Manuel (İki ayrı web service)

1. **Servis 1:** Ana Backend
   - Start Command: `node src/server.js`
   
2. **Servis 2:** Notification
   - Start Command: `node notification-server.js`
   - Environment: `NOTIFICATION_PORT=5000`

## Ücretsiz Tier Limitleri

✅ **750 saat/ay** (1 servis sürekli açık kalabilir)
✅ **100 GB bandwidth**
✅ **512 MB RAM**
⚠️ 15 dakika inaktivite sonrası uyur (ilk istek 30sn sürer)

## Keep Alive (Uykudan Koruma)

Render'ı uyumaktan korumak için:

```bash
# Cron job (her 10 dakikada ping)
curl https://smartguard-xxx.onrender.com
```

Veya UptimeRobot kullan (ücretsiz): [uptimerobot.com](https://uptimerobot.com)

## Test Et

```bash
# Health check
curl https://smartguard-xxx.onrender.com

# Token kaydet
curl -X POST https://smartguard-xxx.onrender.com/api/notification/register-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","token":"ExponentPushToken[xxx]"}'
```

## Alternatif: Railway.app

Railway daha hızlı deploy:

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

$5 ücretsiz kredi (monthly renewal).

## Logs

Render dashboard → Logs sekmesi → Real-time server logları

## Domain (Opsiyonel)

Render'da custom domain ekleyebilirsin:
- Settings → Custom Domain → `smartguard.yourdomain.com`

## 🔒 Production Ayarları

`.env` dosyası (Render Environment'a ekle):
```
NODE_ENV=production
NOTIFICATION_PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```
