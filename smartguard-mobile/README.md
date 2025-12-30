# SmartGuard Mobile

React Native mobil uygulama (Expo + Development Client)

## Kurulum

### Gereksinimler

#### Yazılım
- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- **Git** ([git-scm.com](https://git-scm.com))
- **EAS CLI** (global): `npm install -g eas-cli`
- **Expo hesabı** ([expo.dev](https://expo.dev) - ücretsiz)

#### Cihaz Gereksinimleri
- **iOS**: 
  - iPhone/iPad (iOS 13+)
  - UDID'nizin Apple Developer hesabına kayıtlı olması
  - Apple Developer hesabı (ücretsiz veya ücretli)
  
- **Android**: 
  - Android cihaz (Android 6.0+)
  - Geliştirici modu etkin
  - Bilinmeyen kaynaklardan yüklemeye izin

#### Backend Bağımlılıkları
Mobil uygulama backend'e bağlı çalışır, bu yüzden aynı ağda backend de çalışmalı:

```bash
# Backend klasöründe (smartguard_api):
npm install
npm start  # Port 4000'de başlar
```

### Adımlar

1. **Repoyu klonlayın:**
```bash
git clone https://github.com/OzanOrhann/SmartGuard.git
cd SmartGuard/smartguard-mobile
```

2. **Paketleri yükleyin:**
```bash
npm install
```

**Not:** Tüm bağımlılıklar `package.json`'da tanımlı ve otomatik yüklenecek:
- React Native 0.81.5
- Expo SDK 54
- react-native-ble-plx (Bluetooth)
- expo-notifications (Push bildirimleri)
- socket.io-client (Real-time bağlantı)
- React Navigation (Navigasyon)
- Zustand (State management)
- TypeScript desteği

3. **EAS ile giriş yapın:**
```bash
eas login
```

4. **Development build oluşturun:**

iOS için:
```bash
eas build --profile development --platform ios
```

Android için:
```bash
eas build --profile development --platform android
```

Build tamamlandığında QR kod veya indirme linki verilecek.

5. **Cihazınıza yükleyin:**
- iOS: Safari'dan linki açın veya Apple Configurator 2 kullanın
- Android: QR'ı tarayın veya APK'yı indirin

6. **Uygulamayı başlatın:**
```bash
npx expo start --dev-client
```

Cihazınızdaki development client ile QR kodu tarayın.

## Özellikler

- **Bluetooth Low Energy**: Akıllı bileklik ile bağlantı (react-native-ble-plx)
- **Push Notifications**: Expo push notifications
- **Real-time**: Socket.IO ile canlı sensör verileri
- **Auth**: JWT tabanlı kimlik doğrulama

## Backend Bağlantısı

Backend URL'ini ayarlamak için [src/config.ts](src/config.ts) dosyasını düzenleyin:

```typescript
export const API_URL = 'http://YOUR_LOCAL_IP:4000';
```

**Önemli:** Localhost yerine bilgisayarınızın yerel ağ IP'sini kullanın:
- Windows: `ipconfig` → "IPv4 Address"
- macOS/Linux: `ifconfig` → "inet"
- Örnek: `http://192.168.1.100:4000`

Backend'i başlatmak için ana dizinde:
```bash
cd ../smartguard_api
npm install
npm start
```

Backend gerekli veritabanı ve servisleri otomatik oluşturur.

## Yüklü Paketler

Projeye import edilebilir tüm kütüphaneler:

### UI & Navigation
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
```

### Bluetooth
```typescript
import { BleManager } from 'react-native-ble-plx';
```

### Push Notifications
```typescript
import * as Notifications from 'expo-notifications';
```

### Data & State
```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import io from 'socket.io-client';
```

### Forms
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
```

## Notlar

- `/android` ve `/ios` klasörleri gitignore'da çünkü EAS Build otomatik oluşturuyor
- Expo Go **kullanmayın** - BLE desteği yok, development client gerekli
- UDID'nizi Apple Developer'a kaydetmeniz gerekiyor (iOS için)
