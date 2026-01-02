# 📱 Notification Kullanım Örnekleri

## 1. Token Kaydet (Uygulama Başlangıcında)

```typescript
// App.tsx veya LoginScreen.tsx
import { registerPushToken } from './src/utils/NotificationHelper';

// Kullanıcı giriş yaptığında
async function onUserLogin(userId: string) {
  await registerPushToken(userId);
}

// Örnek:
onUserLogin('user123');
```

## 2. Düşme Algılandığında Bildirim

```typescript
// StatusScreen.tsx veya sensör okuma kısmında
import { sendFallAlert } from './src/utils/NotificationHelper';

// Düşme tespit edilince
if (accelMagnitude > 2.0) {
  await sendFallAlert(
    accelMagnitude,
    ['user456', 'user789'] // Hedef kullanıcılar (aile/doktorlar)
  );
}
```

## 3. Hareketsizlik Bildirimi

```typescript
import { sendImmobileAlert } from './src/utils/NotificationHelper';

// 30 saniye hareketsiz kalınca
if (immobileDuration > 30) {
  await sendImmobileAlert(
    immobileDuration,
    ['family_user_id']
  );
}
```

## 4. Özel Bildirim

```typescript
import { sendNotification } from './src/utils/NotificationHelper';

// İstediğin formatta
await sendNotification(
  {
    type: 'custom',
    title: 'Pil Düşük',
    body: '%15 pil kaldı',
    batteryLevel: 15,
    timestamp: Date.now()
  },
  ['user123']
);
```

## 5. Tam Entegrasyon Örneği

```typescript
// StatusScreen.tsx
import { useEffect, useState } from 'react';
import { useSensorData } from '../hooks/useSensorData';
import { sendFallAlert, sendImmobileAlert, registerPushToken } from '../utils/NotificationHelper';

export default function StatusScreen() {
  const { sensorData } = useSensorData();
  const [targetUsers, setTargetUsers] = useState(['family_user_id']);

  // Token kaydı (sayfa yüklenince)
  useEffect(() => {
    registerPushToken('current_user_id');
  }, []);

  // Düşme kontrolü
  useEffect(() => {
    if (sensorData?.alarm?.type === 'FALL') {
      sendFallAlert(sensorData.accel.magnitude, targetUsers);
    }
  }, [sensorData?.alarm]);

  // Hareketsizlik kontrolü
  useEffect(() => {
    if (sensorData?.alarm?.type === 'IMMOBILE') {
      sendImmobileAlert(sensorData.immobileTime, targetUsers);
    }
  }, [sensorData?.alarm]);

  return (
    // ... UI
  );
}
```

## 6. Ayarlar Ekranında Hedef Kullanıcıları Yönet

```typescript
// SettingsScreen.tsx
import { useState } from 'react';

export default function SettingsScreen() {
  const [notifyUsers, setNotifyUsers] = useState(['family_user_id']);

  const addUser = (userId: string) => {
    setNotifyUsers([...notifyUsers, userId]);
    // AsyncStorage'da sakla
    AsyncStorage.setItem('notify-users', JSON.stringify([...notifyUsers, userId]));
  };

  return (
    <View>
      <Text>Bildirim Gönderilecek Kişiler:</Text>
      {notifyUsers.map(userId => (
        <Text key={userId}>{userId}</Text>
      ))}
      {/* Ekle/Sil butonları */}
    </View>
  );
}
```

## Test

```bash
# Local test (Expo dev client ile)
curl -X POST https://smartguard-4zfy.onrender.com/api/notification/register-token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","token":"ExponentPushToken[xxxxxx]"}'
```

## Notlar

- **Render Free Tier:** 15 dakika inaktivite sonrası uyur (ilk istek 30sn sürebilir)
- **Token:** Her kullanıcı uygulama başlarken token kaydetmeli
- **Hedef Kullanıcılar:** AsyncStorage'da saklanabilir veya backend'den çekilebilir
- **Offline:** Bildirim göndermek için internet gerekli
