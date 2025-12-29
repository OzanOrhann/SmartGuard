# 🩺 Bluetooth Bileklik Bağlantısı - Hızlı Kılavuz

## ✅ Ne Yaptık?

Artık **gerçek bilekliklerden** (smartwatch/fitness tracker) sensör verisi okuyabilirsin!

```
Bileklik (BLE) → Mobil App → Backend → Web Dashboard
              Bluetooth      WiFi       WebSocket
```

## 📱 Nasıl Kullanılır?

### 1. Bilekliğini Hazırla
- Bilekliği aç
- Bluetooth'u aktif et
- Şarjlı olduğundan emin ol

### 2. Mobil App'i Aç
```bash
cd smartguard-mobile
npm install
npx expo start
```

### 3. Bluetooth Sekmesine Git
- Alt menüde "🩵 Bluetooth" sekmesi var
- Tıkla

### 4. Bileklik Ara
- "🔍 Bileklik Ara" butonuna bas
- 10 saniye tarama yapar
- Bilekliğin görünür

### 5. Bağlan
- Listeden bilekliğini seç
- Otomatik bağlanır
- ✅ "Bağlı: SmartGuard-AB12" mesajı görünür

### 6. Sensör Verilerini Gör
```
❤️ Kalp Atışı: 72 bpm
🫁 SpO₂: 98%
📊 İvme: 0.05g, 0.02g, 9.81g
```

### 7. Simulator'ü Kapat!
**ÖNEMLİ:** Bileklik bağlıyken simulator kapalı olmalı.

```bash
# Simulator terminalinde Ctrl+C
```

## 🔧 Backend Değişiklik Gerektirmiyor!

Backend zaten hazır. Mobil app verilerinbackend'e gönderiyor, backend alarm kontrolü yapıyor.

```javascript
// Backend sadece bu endpoint'i dinliyor:
POST /api/sensor
{
  heartRate: 72,
  spo2: 98,
  acceleration: { x: 0.05, y: 0.02, z: 9.81 }
}
```

## 🛠️ Kendi Bilekliğine Uyarla

### 1. Cihaz İsmini Değiştir

`smartguard-mobile/src/services/BLEService.ts`:

```typescript
const DEVICE_NAME_PREFIX = 'SmartGuard'; // Bilekliğinin ismine değiştir
// Örnek: 'Mi Band', 'Fitbit', 'Galaxy Watch'
```

### 2. UUID'leri Bul

**nRF Connect** uygulamasını indir (ücretsiz):
- Play Store / App Store'dan yükle
- Bilekliğini tara
- Bağlan
- Servisleri gör
- UUID'leri kopyala

`BLEService.ts` içinde UUID'leri güncelle:

```typescript
// Heart Rate (genelde standart)
const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';

// SpO2 (genelde standart)
const SPO2_SERVICE = '00001822-0000-1000-8000-00805f9b34fb';
const SPO2_MEASUREMENT = '00002a5f-0000-1000-8000-00805f9b34fb';

// Accelerometer (bilekliğine göre değişir!)
const ACCEL_SERVICE = 'senin-uuid';
const ACCEL_MEASUREMENT = 'senin-uuid';
```

### 3. Veri Formatını Ayarla

Bilekliğin farklı format kullanıyorsa:

```typescript
// BLEService.ts içinde:
private parseAccelerometer(base64Value: string) {
  const buffer = Buffer.from(base64Value, 'base64');
  
  // Örnek: Xiaomi Mi Band 6
  const ax = buffer.readInt8(0) / 64.0; // Scale factor
  const ay = buffer.readInt8(1) / 64.0;
  const az = buffer.readInt8(2) / 64.0;
  
  return { ax, ay, az };
}
```

## 📋 Gereksinimler

### Android
```xml
<!-- AndroidManifest.xml - ZATEN EKLİ -->
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### NPM
```json
// package.json - ZATEN EKLİ
"react-native-ble-plx": "^3.5.0"
```

## ❓ Sorun Giderme

### "Bluetooth kapalı"
- Ayarlar → Bluetooth → Aç

### "İzinler reddedildi"
- Ayarlar → Uygulamalar → SmartGuard → İzinler
- Konum ve Bluetooth izinlerini ver

### Cihaz bulunamıyor
- Bileklik şarjlı olmalı
- Başka cihaza bağlı olmamalı
- Max 10 metre mesafede olmalı
- Cihaz ismi `DEVICE_NAME_PREFIX` ile eşleşmeli

### Veri gelmiyor
```typescript
// BLEService.ts içinde debug:
console.log('RAW:', base64Value);
console.log('PARSED:', { hr, spo2, ax, ay, az });
```

## 🎯 Özet

1. ✅ BLE servisi hazır
2. ✅ Bluetooth ekranı eklendi
3. ✅ Android izinleri hazır
4. ✅ Backend zaten uyumlu
5. ✅ Web dashboard gerçek zamanlı gösterir

**Sadece bilekliğini bağla ve kullan!** 🚀

---

**Detaylı dokümantasyon:** [BLE_KULLANIM.md](BLE_KULLANIM.md)
