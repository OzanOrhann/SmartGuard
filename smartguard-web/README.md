# SmartGuard Web — Güvenli İzleme Web Uygulaması

Modern, responsive web tabanlı SmartGuard izleme platformu. Next.js 14, TypeScript, Tailwind CSS ile geliştirilmiştir.

## Özellikler

- ✅ **Gerçek Zamanlı İzleme**: Socket.io ile anlık sensör verisi
- ✅ **Alarm Sistemi**: Browser notification ve alarm geçmişi
- ✅ **Responsive Tasarım**: Mobil, tablet ve desktop uyumlu
- ✅ **Kolay Kurulum**: Tek komutla çalışır
- ✅ **Authentication**: Güvenli giriş sistemi
- ✅ **Özelleştirilebilir Eşikler**: Alarm eşiklerini web üzerinden ayarlayın

## Gereksinimler

- Node.js 18+ ve npm/yarn
- Çalışan `smartguard_api` sunucusu (varsayılan: http://localhost:3001)

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
cd smartguard-web
npm install
```

### 2. Ortam Değişkenlerini Ayarla

`.env.local` dosyası oluştur:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Geliştirme Sunucusunu Çalıştır

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç.

### 4. Giriş Yap

Demo kullanıcılar:
- **Admin**: `admin` / `123`
- **User**: `user` / `123`

## Sayfalar

- **Login** (`/login`): Kullanıcı girişi
- **Register** (`/register`): Yeni kullanıcı kaydı (mock)
- **Dashboard** (`/dashboard`): Anlık sensör verileri
- **Alarms** (`/dashboard/alarms`): Alarm geçmişi
- **Settings** (`/dashboard/settings`): Eşik ayarları
- **Profile** (`/dashboard/profile`): Kullanıcı profili

## API Bağlantısı

Uygulama `smartguard_api` sunucusuna bağlanır:
- REST: `/api/sensor`, `/api/thresholds`
- Socket.io: Gerçek zamanlı veri akışı

API çalışmıyorsa "Sunucuya bağlanılamıyor" hatası alırsınız. API'yi başlatmak için:

```bash
cd smartguard_api
npm install
npm start
```

## Production Build

```bash
npm run build
npm start
```

## Teknolojiler

- **Framework**: Next.js 14 (App Router)
- **Dil**: TypeScript
- **Stil**: Tailwind CSS
- **State**: Zustand
- **API**: Axios + Socket.io-client
- **İkonlar**: Lucide React

## Klasör Yapısı

```
smartguard-web/
├── src/
│   ├── app/
│   │   ├── dashboard/       # Dashboard sayfaları
│   │   ├── login/           # Login sayfası
│   │   ├── register/        # Register sayfası
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global stiller
│   ├── stores/
│   │   └── authStore.ts     # Auth state management
│   └── hooks/
│       └── useSensorData.ts # Sensör verisi hook
├── public/                  # Statik dosyalar
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Mobil vs Web

- **Mobil** (`smartguard-mobile`): React Native, iOS/Android, BLE desteği
- **Web** (`smartguard-web`): Next.js, tarayıcı tabanlı, hızlı erişim

Her iki platform da aynı `smartguard_api` sunucusuna bağlanır.

## Katkıda Bulunma

1. Repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing`)
5. Pull Request açın

## Lisans

Bu proje eğitim amaçlıdır.
