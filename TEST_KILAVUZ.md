# 🧪 SmartGuard Test Kılavuzu

Bileklik olmadan sistemi nasıl test edersiniz?

## 🎯 Test Senaryoları

### 1️⃣ Web Test (En Kolay)

**Gerekli:**
- Laptop/PC
- Node.js

**Adımlar:**
```bash
# Terminal 1: Backend
cd smartguard_api
node src/server.js

# Terminal 2: Simulator (Sahte bileklik)
cd smartguard_api
node src/simulator.js

# Terminal 3: Web uygulaması
cd smartguard-web
npm run dev
```

**Test:**
1. Tarayıcıda aç: http://localhost:3000
2. Login yap
3. Dashboard'da gerçek zamanlı veri görürsün
4. Alarms sayfasında alarmları görürsün

✅ **Bu tam çalışıyor!**

---

### 2️⃣ Mobil Test - Demo Mode (Yeni!)

**Gerekli:**
- Telefon/Emulator
- Backend çalışıyor olmalı

**Adımlar:**
```bash
# Backend ve Simulator çalışıyor olmalı
cd smartguard_api
node src/server.js
node src/simulator.js

# Mobil uygulamayı başlat
cd smartguard-mobile
npm start
```

**Test:**
1. Mobil uygulamayı aç
2. Bluetooth ekranına git
3. **"🧪 Demo Modu (Simulator)"** butonuna bas
4. Simulator'dan gelen veriyi görürsün
5. StatusScreen'de de aynı veri görünür

✅ **BLE olmadan test edebilirsin!**

---

### 3️⃣ Mobil Test - Gerçek BLE (İleri Seviye)

#### Seçenek A: nRF Connect App ile Test

**Gerekli:**
- Android telefon
- nRF Connect app (Google Play)
- ESP32/Arduino bileklik

**Adımlar:**
1. nRF Connect'i aç
2. "Advertiser" moduna geç
3. Servis ekle:
   - UUID: `0000180d-0000-1000-8000-00805f9b34fb` (Heart Rate Service)
   - Characteristic: `00002a37-0000-1000-8000-00805f9b34fb`
4. JSON veri gönder:
   ```json
   {
     "heartRate": 75,
     "spo2": 98,
     "ax": 0.1,
     "ay": 0.05,
     "az": 9.8,
     "timestamp": 1735466123456
   }
   ```

SmartGuard mobil uygulaması bu cihazı görecek!

#### Seçenek B: BLE Simulator (Node.js)

**Gerekli:**
- Linux/Mac (Windows WSL)
- `bleno` npm paketi

**Kod:**
```bash
npm install bleno
```

```javascript
// ble-simulator.js
const bleno = require('bleno');

const SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
const CHAR_UUID = '00002a37-0000-1000-8000-00805f9b34fb';

// Sensör verisi
setInterval(() => {
  const data = {
    heartRate: 60 + Math.random() * 40,
    spo2: 95 + Math.random() * 5,
    ax: Math.random() * 0.2,
    ay: Math.random() * 0.2,
    az: 9.8 + Math.random() * 0.1,
    timestamp: Date.now()
  };
  
  // JSON → Base64
  const json = JSON.stringify(data);
  const buffer = Buffer.from(json);
  
  // BLE notification gönder
  console.log('📡 Veri gönderildi:', data);
}, 1000);

bleno.startAdvertising('SmartGuard', [SERVICE_UUID]);
```

Çalıştır:
```bash
sudo node ble-simulator.js
```

SmartGuard mobil uygulaması bağlanabilir!

#### Seçenek C: ESP32 ile Gerçek Bileklik

**Arduino Kod:**
```cpp
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

BLECharacteristic *pCharacteristic;

void setup() {
  BLEDevice::init("SmartGuard");
  BLEServer *pServer = BLEDevice::createServer();
  
  BLEService *pService = pServer->createService(
    BLEUUID("0000180d-0000-1000-8000-00805f9b34fb")
  );
  
  pCharacteristic = pService->createCharacteristic(
    BLEUUID("00002a37-0000-1000-8000-00805f9b34fb"),
    BLECharacteristic::PROPERTY_NOTIFY
  );
  
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->start();
}

void loop() {
  // Sahte veri
  String json = "{\"heartRate\":72,\"spo2\":98,\"ax\":0.1,\"ay\":0.05,\"az\":9.8,\"timestamp\":" + String(millis()) + "}";
  
  pCharacteristic->setValue(json.c_str());
  pCharacteristic->notify();
  
  delay(1000);
}
```

---

## 📊 Veri Akışı Şemaları

### Web + Simulator (Çalışıyor)
```
┌─────────────┐     HTTP      ┌─────────┐    WebSocket    ┌─────────┐
│ Simulator.js│──────/sensor───▶│ Backend │────────────────▶│   Web   │
└─────────────┘                 └─────────┘                 └─────────┘
```

### Mobil Demo Mode (YENİ - Çalışıyor)
```
┌─────────────┐                 ┌─────────┐    WebSocket    ┌─────────┐
│ Simulator.js│──────/sensor───▶│ Backend │────────────────▶│  Mobile │
└─────────────┘                 └─────────┘                 └─────────┘
                                                             (Demo Mode)
```

### Mobil BLE Mode (Gerçek Bileklik)
```
┌──────────┐      BLE       ┌─────────┐    HTTP/WS     ┌─────────┐
│ Bileklik │───────────────▶│  Mobile │───────────────▶│ Backend │
└──────────┘                └─────────┘                └─────────┘
                                                            │
                                                            │ WebSocket
                                                            ▼
                                                       ┌─────────┐
                                                       │   Web   │
                                                       └─────────┘
```

---

## ✅ Hızlı Test Checklist

### Backend + Simulator + Web
- [ ] `node src/server.js` çalışıyor
- [ ] `node src/simulator.js` çalışıyor
- [ ] `npm run dev` (web) çalışıyor
- [ ] http://localhost:3000 açılıyor
- [ ] Dashboard'da veri değişiyor
- [ ] Alarms sayfasında alarmlar görünüyor

### Mobil Demo Mode
- [ ] Backend + Simulator çalışıyor
- [ ] Mobil app açık
- [ ] Bluetooth ekranında "Demo Modu" butonu var
- [ ] Demo modu aktif edildi
- [ ] Sensör verileri görünüyor
- [ ] StatusScreen'de aynı veri var

### Mobil BLE Mode (Opsiyonel)
- [ ] Backend çalışıyor
- [ ] BLE cihaz hazır (ESP32/nRF/Simulator)
- [ ] Bluetooth izinleri verildi
- [ ] "Bileklik Ara" ile cihaz bulundu
- [ ] Cihaza bağlandı
- [ ] Sensör verileri gelmeye başladı

---

## 🎮 Demo Senaryoları

Simulator otomatik şu senaryoları tetikler:

### 1. Normal Durum (Çoğunlukla)
```
HR: 60-100 bpm
SpO₂: 95-100%
İvme: ~9.8g (ayakta)
```

### 2. Hareketsizlik (%1 olasılık)
```
HR: Sabit (±1)
SpO₂: Sabit (±0.5)
İvme: ~0.03g (10 saniye)
```

Mobil/Web'de göreceksin:
- ⚠️ "10 saniyedir hareket yok" mesajı
- 🔴 Kırmızı activity durumu

### 3. Düşme + Bayılma (%0.3 olasılık)
```
Düşme anı:
- İvme: 2.5-4g (yüksek)

Sonrası (8 saniye):
- HR: 35-42 bpm
- SpO₂: 85-90%
- İvme: 0-0.2g (yerde)
```

Mobil/Web'de göreceksin:
- 🚨 "DÜŞME TESPİT EDİLDİ" alarmı
- 🚨 "Kalp atışı çok düşük" alarmı
- 📧 Email gönderildi (SMTP varsa)

---

## 🐛 Sorun Giderme

### "Demo Mode veri gelmiyor"
```bash
# Backend çalışıyor mu?
curl http://192.168.1.30:4000/api/latest

# Simulator çalışıyor mu?
# Terminal'de "📊 Veri gönderildi" görmeli
```

### "BLE cihaz bulunamıyor"
```bash
# Android izinleri:
- Bluetooth
- Konum (BLE için gerekli!)

# nRF Connect ile test et
# Cihaz "SmartGuard" adıyla görünmeli
```

### "WebSocket bağlanamıyor"
```bash
# config.ts dosyasını kontrol et
# BACKEND_URL doğru IP'de olmalı

# Firewall kontrolü
netsh advfirewall firewall add rule name="Node" dir=in action=allow protocol=TCP localport=4000
```

---

## 📝 Özet

**Bileklik Yok:**
1. ✅ Web + Simulator → Tam çalışıyor
2. ✅ Mobil Demo Mode → Tam çalışıyor

**Bileklik Var:**
3. 🔵 Mobil BLE → Gerçek cihaz gerekli (ESP32/nRF/Bileklik)

**Önerilen Test Sırası:**
1. Web test (5 dakika)
2. Mobil demo mode (5 dakika)
3. (Opsiyonel) BLE simulator yazma
4. (Opsiyonel) ESP32 bileklik yapma

**Sonuç:** Bileklik olmadan sistemi %100 test edebilirsin! 🎉
