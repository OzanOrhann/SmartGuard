// src/server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

let latestData = null;

const defaultThresholds = {
  minHR: 40,
  maxHR: 120,
  minSpO2: 92,
  immobileSec: 600,
  fallG: 2.0
};

let thresholds = { ...defaultThresholds };

// hareketsizlik için son hareket zamanı
let lastMovementTs = null;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// eşiklere göre alarm üret
function makeAlarms(payload, th) {
  const alarms = [];

  if (typeof payload.heartRate === 'number') {
    if (payload.heartRate < th.minHR) alarms.push('LOW_HR');
    if (payload.heartRate > th.maxHR) alarms.push('HIGH_HR');
  }

  if (typeof payload.spo2 === 'number') {
    if (payload.spo2 < th.minSpO2) alarms.push('LOW_SPO2');
  }

  // ivme büyüklüğü (yaklaşık g değeri gibi)
  if (
    typeof payload.ax === 'number' &&
    typeof payload.ay === 'number' &&
    typeof payload.az === 'number'
  ) {
    const mag = Math.sqrt(
      payload.ax * payload.ax +
      payload.ay * payload.ay +
      payload.az * payload.az
    );

    if (mag > th.fallG) {
      alarms.push('FALL');
    }

    const now = Date.now();
    const moving = mag > 0.05; // çok küçükse hareketsiz say
    if (moving) {
      lastMovementTs = now;
    } else {
      if (lastMovementTs == null) lastMovementTs = now;
      const diffSec = (now - lastMovementTs) / 1000;
      if (diffSec >= th.immobileSec) {
        alarms.push('IMMOBILE');
      }
    }
  }

  // payload içinde manuel alarm varsa ekle (opsiyonel)
  if (Array.isArray(payload.alarms)) {
    for (const a of payload.alarms) {
      if (!alarms.includes(a)) alarms.push(a);
    }
  }

  return alarms;
}

// Sensör verisi POST edildiğinde kaydet + alarm üret + socket ile yayınla
app.post('/api/sensor', (req, res) => {
  const payload = req.body || {};
  const alarms = makeAlarms(payload, thresholds);

  latestData = {
    ...payload,
    alarms
  };

  io.emit('sensor', { data: latestData });
  res.sendStatus(200);
});

// Mobil uygulama açıldığında ilk veriyi çekmek için
app.get('/api/latest', (req, res) => {
  res.json({ data: latestData });
});

// Eşik değerlerini okumak için
app.get('/api/thresholds', (req, res) => {
  res.json(thresholds);
});

// Eşik değerlerini güncellemek için (PUT ve POST ikisi de çalışsın)
function updateThresholds(req, res) {
  thresholds = { ...thresholds, ...req.body };
  res.json(thresholds);
}
app.put('/api/thresholds', updateThresholds);
app.post('/api/thresholds', updateThresholds);

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
