// src/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const os = require('os');
const dns = require('multicast-dns')();
const { saveAlarm, getAlarmsByUserId, countAlarmsByUserId } = require('./models/Alarm');

const app = express();
app.use(cors());
app.use(express.json());

// Nodemailer SMTP transporter (env vars varsa kullan)
let emailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('SMTP email service active:', process.env.SMTP_USER);
} else {
  console.log('SMTP settings not found, using mock mode');
}

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

// Simulator kontrol durumu
let simulatorRunning = true;

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
    if (payload.heartRate < th.minHR) alarms.push('HR_LOW');
    if (payload.heartRate > th.maxHR) alarms.push('HR_HIGH');
  }

  if (typeof payload.spo2 === 'number') {
    if (payload.spo2 < th.minSpO2) alarms.push('SPO2_LOW');
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

// Varsayılan eşiklere dön
app.post('/api/thresholds/reset', (req, res) => {
  thresholds = { ...defaultThresholds };
  res.json(thresholds);
});

// Simulator kontrolü
app.get('/api/simulator/status', (req, res) => {
  res.json({ running: simulatorRunning });
});

app.post('/api/simulator/stop', (req, res) => {
  simulatorRunning = false;
  res.json({ message: 'Simulator durduruldu', running: simulatorRunning });
});

app.post('/api/simulator/start', (req, res) => {
  simulatorRunning = true;
  res.json({ message: 'Simulator başlatıldı', running: simulatorRunning });
});

// E-mail bildirim gönder
app.post('/api/notify/email', async (req, res) => {
  const { alarmType, severity, timestamp, email, snapshot, reasons } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Geçersiz e-mail adresi' 
    });
  }
  
  const tsText = new Date(timestamp || Date.now()).toLocaleString('tr-TR');
  const reasonText = Array.isArray(reasons) && reasons.length
    ? reasons.join(', ')
    : String(alarmType || 'Alarm');

  const snapshotText = snapshot ? `\nDeğerler:\n- Nabız: ${snapshot.heartRate} bpm\n- SpO₂: ${snapshot.spo2}%\n- İvme: ${Math.sqrt((snapshot.ax||0)**2 + (snapshot.ay||0)**2 + (snapshot.az||0)**2).toFixed(2)} g` : '';

  const message = `SmartGuard Alarm Bildirimi\n\nSaat/Tarih: ${tsText}\nŞiddet: ${severity || 'CRITICAL'}\nSebep(ler): ${reasonText}${snapshotText}\n\nBu bildirim SmartGuard tarafından otomatik oluşturulmuştur.`;

  // Eğer SMTP ayarları varsa gerçek e-mail gönder
  if (emailTransporter) {
    try {
      await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: `SmartGuard Alarm - ${reasonText}`,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">🚨 SmartGuard Alarm Bildirimi</h2>
            <p><strong>Saat/Tarih:</strong> ${tsText}</p>
            <p><strong>Şiddet:</strong> <span style="color: #dc2626;">${severity || 'CRITICAL'}</span></p>
            <p><strong>Sebep(ler):</strong> ${reasonText}</p>
            ${snapshot ? `
              <h3>Ölçüm Değerleri:</h3>
              <ul>
                <li><strong>Nabız:</strong> ${snapshot.heartRate} bpm</li>
                <li><strong>SpO₂:</strong> ${snapshot.spo2}%</li>
                <li><strong>İvme:</strong> ${Math.sqrt((snapshot.ax||0)**2 + (snapshot.ay||0)**2 + (snapshot.az||0)**2).toFixed(2)} g</li>
              </ul>
            ` : ''}
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">Bu bildirim SmartGuard tarafından otomatik oluşturulmuştur.</p>
          </div>
        `,
      });
      
      console.log(`\nEMAIL SENT: ${email}`);
      
      res.json({ 
        success: true, 
        message: `${email} adresine e-mail başarıyla gönderildi`,
        messagePreview: message
      });
    } catch (error) {
      console.error('E-mail gönderim hatası:', error);
      res.status(500).json({
        success: false,
        error: 'E-mail gönderilemedi: ' + error.message
      });
    }
  } else {
    console.log(`\nEMAIL SENT (MOCK):`);
    console.log(`   To: ${email}`);
    console.log(`   Subject: SmartGuard Alarm - ${reasonText}`);
    console.log(`   İçerik:\n${message}`);
    console.log(`   ---`);
    
    res.json({ 
      success: true, 
      message: `${email} adresine e-mail gönderildi (mock - SMTP ayarları yapılmadı)`,
      messagePreview: message
    });
  }
});

// Alarm geçmişi kaydetme (POST)
app.post('/api/alarms/save', (req, res) => {
  const { userId, alarm } = req.body;
  
  if (!userId || !alarm) {
    return res.status(400).json({ error: 'userId ve alarm gerekli' });
  }

  try {
    // SQLite'a kaydet
    saveAlarm.run(
      userId,
      alarm.id,
      alarm.ts,
      JSON.stringify(alarm.kinds), // Array'i JSON string olarak sakla
      alarm.hr || null,
      alarm.spo2 || null,
      alarm.systolic || null,
      alarm.diastolic || null,
      alarm.ax || null,
      alarm.ay || null,
      alarm.az || null
    );
    
    // Toplam alarm sayısını al
    const result = countAlarmsByUserId.get(userId);
    const count = result.count;
    console.log(`Alarm saved to SQLite - User: ${userId}, Total: ${count}`);
    
    res.json({ success: true, count });
  } catch (err) {
    console.error('Alarm save error:', err);
    res.status(500).json({ error: 'Alarm kaydedilemedi' });
  }
});

// Alarm geçmişi çekme (GET) - SQLite'tan
app.get('/api/alarms/history/:userId', (req, res) => {
  const { userId } = req.params;
  
  try {
    // SQLite'tan userId'ye göre alarmları çek (en yeni önce)
    const alarms = getAlarmsByUserId.all(userId);
    
    // Frontend'in beklediği formata dönüştür
    const formattedAlarms = alarms.map(a => {
      let kinds = [];
      try {
        // kinds string ise parse et, array ise direkt kullan
        kinds = typeof a.kinds === 'string' ? JSON.parse(a.kinds) : a.kinds;
      } catch (parseErr) {
        console.warn('Kinds parse hatası:', a.kinds, parseErr);
        kinds = [];
      }
      
      return {
        id: a.alarmId,
        ts: a.timestamp,
        kinds: kinds,
        snapshot: {
          heartRate: a.hr,
          spo2: a.spo2,
          sysBP: a.systolic,
          diaBP: a.diastolic,
          ax: a.ax || 0,
          ay: a.ay || 0,
          az: a.az || 0
        }
      };
    });
    
    console.log(`Alarm history queried from SQLite - User: ${userId}, Count: ${formattedAlarms.length}`);
    
    res.json({ alarms: formattedAlarms });
  } catch (err) {
    console.error('Alarm history fetch error:', err);
    res.status(500).json({ error: 'Alarm geçmişi alınamadı', alarms: [] });
  }
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
  // Local IP'yi bul
  const interfaces = os.networkInterfaces();
  let localIp = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4 ve internal olmayan adresi al
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
  }

  console.log(`\nBackend running: http://0.0.0.0:${PORT}`);
  console.log(`iPhone access: http://smartguard.local:${PORT}`);
  console.log(`Local PC: http://${localIp}:${PORT}\n`);

  dns.on('query', (query) => {
    if (query.questions[0].name === 'smartguard.local') {
      dns.respond([
        {
          name: 'smartguard.local',
          type: 'A',
          ttl: 300,
          data: localIp
        }
      ]);
      console.log(`mDNS response: smartguard.local -> ${localIp}`);
    }
  });
});
