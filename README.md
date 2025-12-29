# SmartGuard

Real-time health monitoring system for elderly and at-risk individuals.

## Features

- Real-time vital signs monitoring (HR, SpO2, BP)
- Motion tracking with 3-axis accelerometer
- Automatic alarm detection (immobility, fall, critical vitals)
- Email notifications and alarm history
- Web dashboard and mobile app with BLE support
- Sensor data simulator for testing

## Quick Start

### Prerequisites

Node.js 18+ required.

### Installation

```bash
git clone https://github.com/OzanOrhann/SmartGuard.git
cd SmartGuard
```

### 1. Backend API

```bash
cd smartguard_api
npm install
node src/server.js
```

Runs at http://localhost:4000

### 2. Simulator (Optional)

```bash
cd smartguard_api
node tools/simulator.js
```

Skip this when using real BLE device.

### 3. Web Dashboard

```bash
cd smartguard-web
npm install
npm run dev
```

Open http://localhost:3000

### 4. Mobile App (Optional)

```bash
cd smartguard-mobile
npm install
npx expo start
```

Scan QR with Expo Go or build with EAS.

## Configuration

### Email Notifications (Optional)

```bash
cd smartguard_api
cp .env.example .env
```

Edit `.env` with your Gmail SMTP credentials.

### Threshold Settings

Adjust alarm thresholds via web settings page or API endpoint.

## Architecture

```
smartguard_api/       Backend (Node.js, Express, Socket.io, SQLite)
smartguard-web/       Web dashboard (Next.js 14, TypeScript, Tailwind)
smartguard-mobile/    Mobile app (React Native, Expo, BLE support)
```

## License

Educational purposes.
