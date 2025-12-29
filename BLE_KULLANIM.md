# 🩺 Bluetooth BLE Entegrasyonu

SmartGuard artık **gerçek bilekliklerden** (fitness tracker/smartwatch) sensör verisi alabilir!

## 🎯 Mimari

```
Bileklik (BLE) → Mobil App → Backend (REST/WebSocket) → Web Dashboard
```

## 📱 Mobil App - BLE Desteği

### Desteklenen Sensörler

- ❤️ **Heart Rate** (Kalp Atışı) - Standard Bluetooth SIG servis
- 🫁 **SpO₂** (Oksijen Saturasyonu) - Pulse Oximeter servisi
- 📊 **Accelerometer** (İvme) - Custom servis (bileklik özelinde)

### UUID'ler (Standart Bluetooth)

```typescript
// Heart Rate Service (Standart)
HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb'
HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb'

// Pulse Oximeter (Standart)
SPO2_SERVICE = '00001822-0000-1000-8000-00805f9b34fb'
SPO2_MEASUREMENT = '00002a5f-0000-1000-8000-00805f9b34fb'

// Accelerometer (Bileklik özelinde değişir!)
ACCEL_SERVICE = '0000181a-0000-1000-8000-00805f9b34fb'
ACCEL_MEASUREMENT = '00002a58-0000-1000-8000-00805f9b34fb'
```

⚠️ **ÖNEMLİ:** Accelerometer UUID'leri bilekliğinize göre değişir! `BLEService.ts` dosyasında düzenleyin.

## 🚀 Kullanım

### 1. Bilekliği Açın

- Bilekliğinizi açın ve Bluetooth'u aktif edin
- Cihaz ismi `SmartGuard` ile başlamalı (değiştirilebilir)

### 2. Mobil App'te Bluetooth Ekranını Açın

```typescript
// App.tsx'te zaten ekli
<Tab.Screen name="Bluetooth" component={BluetoothScreen} />
```

### 3. Bileklik Arama

1. "🔍 Bileklik Ara" butonuna tıklayın
2. 10 saniye boyunca yakındaki BLE cihazları taranır
3. Bulunduğunda listede görünür

### 4. Bağlantı

1. Listeden bilekliğinizi seçin
2. Otomatik bağlanır ve sensörleri dinlemeye başlar
3. Veriler backend'e otomatik gönderilir

### 5. Simulator'ü Durdurma

Bileklik bağlıyken simulator çalışmamalı:

```bash
# Simulator terminali kapatın veya Ctrl+C
```

## 🔧 Backend (Değişiklik YOK!)

Backend zaten BLE veya simulator ayırt etmez. Sadece `/api/sensor` endpoint'ine veri gelir:

```javascript
POST /api/sensor
{
  heartRate: 72,
  spo2: 98,
  acceleration: { x: 0.05, y: 0.02, z: 9.81 },
  timestamp: 1735478400000
}
```

## 📋 Gereksinimler

### Android
```xml
<!-- AndroidManifest.xml - ZATEN EKLİ -->
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### iOS
```json
// Info.plist - Expo Config'de otomatik
{
  "NSBluetoothAlwaysUsageDescription": "SmartGuard bileklikten sensör verisi alır"
}
```

### NPM Paketi
```json
// package.json - ZATEN EKLİ
{
  "react-native-ble-plx": "^3.5.0"
}
```

## 🛠️ Kendi Bilekliğinize Uyarlama

### 1. Device Name Değiştirme

`BLEService.ts`:
```typescript
const DEVICE_NAME_PREFIX = 'SmartGuard'; // Bilekliğinizin ismini girin
// Örnek: 'Mi Band', 'Fitbit', 'Xiaomi Watch'
```

### 2. UUID Bulma

Bilekliğinizin UUID'lerini öğrenmek için:

**Option 1: nRF Connect (Önerilen)**
1. nRF Connect uygulamasını indirin (Play Store/App Store)
2. Bilekliğinizi tarayın
3. Bağlanın ve servisleri görün
4. UUID'leri not edin

**Option 2: Web Bluetooth (Chrome)**
```javascript
// Chrome'da: chrome://bluetooth-internals
navigator.bluetooth.requestDevice({
  acceptAllDevices: true,
  optionalServices: ['heart_rate', 'pulse_oximeter']
})
```

### 3. Veri Parsing Değiştirme

Bileklik farklı format kullanıyorsa `BLEService.ts` içinde:

```typescript
// Örnek: Xiaomi Mi Band 6
private parseAccelerometer(base64Value: string) {
  const buffer = Buffer.from(base64Value, 'base64');
  
  // Mi Band 6: 8-bit signed integers
  const ax = buffer.readInt8(0) / 64.0; // Scale factor 64
  const ay = buffer.readInt8(1) / 64.0;
  const az = buffer.readInt8(2) / 64.0;
  
  return { ax, ay, az };
}
```

## 🐛 Sorun Giderme

### "Bluetooth kapalı" hatası
```bash
# Android: Ayarlar → Bluetooth → Açık
# iOS: Kontrol Merkezi → Bluetooth → Açık
```

### "İzinler reddedildi"
```bash
# Android: Ayarlar → Uygulamalar → SmartGuard → İzinler
# Konum ve Bluetooth izinlerini verin
```

### Cihaz bulunamıyor
1. Bileklik tamamen şarjlı olmalı
2. Başka cihaza bağlı olmamalı
3. Bluetooth mesafesi max 10 metre
4. Cihaz ismi `DEVICE_NAME_PREFIX` ile eşleşmeli

### Veri gelmiyor
```typescript
// BLEService.ts içinde debug log ekleyin:
console.log('RAW DATA:', base64Value);
console.log('PARSED:', { heartRate, spo2, ax, ay, az });
```

### UUID hataları
```
Error: Service not found
```
→ UUID'ler yanlış, nRF Connect ile doğru UUID'leri bulun

## 🎮 Test Modu

Gerçek bileklik yoksa **simulator modunda** test edin:

```bash
cd smartguard_api
node src/simulator.js  # Mock veri üretir
```

Bileklik bağlıyken simulator'ü kapatın!

## 📊 Veri Akışı

```
1. Bileklik → BLE → BluetoothScreen (React Native)
2. BluetoothScreen → axios → Backend (/api/sensor)
3. Backend → Socket.io → Web Dashboard
4. Backend → SQLite → Alarm sistemi
```

## 🔐 Güvenlik

- BLE bağlantısı **encrypted** (Bluetooth 4.0+)
- Sadece mobil uygulama bilekliğe erişir
- Backend hiçbir zaman BLE cihazına direkt bağlanmaz
- Konum izni sadece BLE tarama için gerekli (Android zorunluluğu)

## 📚 Kaynaklar

- **Bluetooth SIG:** https://www.bluetooth.com/specifications/specs/
- **react-native-ble-plx:** https://github.com/dotintent/react-native-ble-plx
- **nRF Connect:** https://www.nordicsemi.com/Products/Development-tools/nrf-connect-for-mobile

## 🚀 Roadmap

- [ ] iOS test
- [ ] Bluetooth otomatik yeniden bağlanma
- [ ] Birden fazla bileklik desteği
- [ ] Veri cache (bağlantı kopunca buffer)
- [ ] Battery seviyesi gösterimi
- [ ] Bileklik firmware update

---

**Backend değişiklik gerektirmiyor!** Sadece mobil app BLE desteği ekledik. 🎉
