// simulator.js
const axios = require('axios');

let ax = 0, ay = 0, az = 1;  // normal duruş (1g)
let lastMoveTime = Date.now();
let lastHR = 70;
let lastSpO2 = 97;
let fallDetected = false;
let fallTime = 0;
let immobileScenario = false;
let immobileStartTime = 0;

// Server'dan simulatorRunning durumunu al
let simulatorRunning = true;

async function loadThresholds() {
  try {
    const res = await axios.get('http://localhost:4000/api/thresholds');
    return res.data;
  } catch {
    return {
      minHR: 40,
      maxHR: 120,
      minSpO2: 92,
      immobileSec: 600,
      fallG: 2.0
    };
  }
}

async function getSimulatorStatus() {
  try {
    const res = await axios.get('http://localhost:4000/api/simulator/status');
    simulatorRunning = res.data.running;
  } catch (err) {
    // Hata durumunda varsayılan olarak çalışmaya devam et
  }
}

function randomNormal(min, max) {
  return min + Math.random() * (max - min);
}

async function simulate() {
  const th = await loadThresholds();
  const alarms = [];
  if (!immobileScenario && Math.random() < 0.01) {
    immobileScenario = true;
    immobileStartTime = Date.now();
    console.log("IMMOBILITY SCENARIO STARTED");
  }
  if (!fallDetected && !immobileScenario && Math.random() < 0.003) {
    ax = randomNormal(2.5, 4);
    ay = randomNormal(2.5, 4);
    az = randomNormal(2.5, 4);
    fallDetected = true;
    fallTime = Date.now();
    console.log("FALL SCENARIO STARTED");
  }
  let heartRate;
  if (immobileScenario) {
    heartRate = lastHR + Math.round(randomNormal(-1, 1));
  } else if (fallDetected && (Date.now() - fallTime) < 8000) {
    heartRate = Math.round(randomNormal(35, 42));
  } else {
    heartRate = Math.round(randomNormal(60, 90));
    if (Math.random() < 0.02) heartRate = Math.round(randomNormal(30, 45));
    if (Math.random() < 0.02) heartRate = Math.round(randomNormal(130, 160));
  }

  if (heartRate < th.minHR) alarms.push("HR_LOW");
  if (heartRate > th.maxHR) alarms.push("HR_HIGH");
  let spo2;
  if (immobileScenario) {
    spo2 = lastSpO2 + Math.round(randomNormal(-0.5, 0.5));
  } else if (fallDetected && (Date.now() - fallTime) < 8000) {
    spo2 = Math.round(randomNormal(85, 90));
  } else {
    spo2 = Math.round(randomNormal(94, 99));
    if (Math.random() < 0.02) spo2 = Math.round(randomNormal(80, 88));
  }

  if (spo2 < th.minSpO2) alarms.push("SPO2_LOW");
  if (fallDetected && (Date.now() - fallTime) < 8000) {
    ax = randomNormal(-0.05, 0.05);
    ay = randomNormal(-0.05, 0.05);
    az = randomNormal(0, 0.2);
  } else if (immobileScenario && (Date.now() - immobileStartTime) < 10000) {
    ax = randomNormal(-0.03, 0.03);
    ay = randomNormal(-0.03, 0.03);
    az = randomNormal(0.95, 1.05);
  } else {
    fallDetected = false;
    immobileScenario = false;
    ax = randomNormal(-0.2, 0.2);
    ay = randomNormal(-0.2, 0.2);
    az = randomNormal(0.8, 1.2);
    lastMoveTime = Date.now();
  }

  const totalG = Math.sqrt(ax * ax + ay * ay + az * az);
  if (totalG > th.fallG) {
    alarms.push("FALL");
  }
  const hrChange = Math.abs(heartRate - lastHR);
  const spo2Change = Math.abs(spo2 - lastSpO2);
  if (hrChange > 2 || spo2Change > 1 || totalG > 0.3) {
    lastMoveTime = Date.now();
  }
  lastHR = heartRate;
  lastSpO2 = spo2;

  const immobileTime = (Date.now() - lastMoveTime) / 1000;
  if (immobileTime > 5) {
    alarms.push("IMMOBILE");
  }
  if (heartRate < 45 && immobileTime > 3) {
    alarms.push("CRITICAL_HR");
  }
  const sysBP = Math.round(randomNormal(110, 130));
  const diaBP = Math.round(randomNormal(70, 85));

  const payload = {
    ts: Date.now(),
    heartRate,
    spo2,
    sysBP,
    diaBP,
    ax,
    ay,
    az,
    alarms,
    // Ek bilgiler arayüz için
    immobileTime: Math.round(immobileTime),
    fallDetected: fallDetected,
    totalG: parseFloat(totalG.toFixed(2))
  };

  try {
    await axios.post("http://localhost:4000/api/sensor", payload);
    console.log("Gönderildi:", payload);
  } catch (err) {
    console.log("Gönderilemedi:", err.message);
  }
}

// Her 1 saniyede bir veri gönder
setInterval(async () => {
  // Her tikte durumu kontrol et (anlık durdur/başlat)
  await getSimulatorStatus();

  // Eğer çalışmıyorsa veri gönderme
  if (!simulatorRunning) return;

  await simulate();
}, 1000);
