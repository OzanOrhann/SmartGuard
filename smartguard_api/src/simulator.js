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

  // --- ÖZEL SENARYOLAR ---
  
  // Senaryo 1: Hareketsizlik simülasyonu (%1 olasılık - 10 saniye)
  if (!immobileScenario && Math.random() < 0.01) {
    immobileScenario = true;
    immobileStartTime = Date.now();
    console.log("🔴 HAREKETSİZLİK SENARYOSU BAŞLADI");
  }
  
  // Senaryo 2: Düşme + Bayılma simülasyonu (%0.3 olasılık)
  if (!fallDetected && !immobileScenario && Math.random() < 0.003) {
    ax = randomNormal(2.5, 4);
    ay = randomNormal(2.5, 4);
    az = randomNormal(2.5, 4);
    fallDetected = true;
    fallTime = Date.now();
    console.log("🔴 DÜŞME SENARYOSU BAŞLADI");
  }

  // --- 1) Kalp Değeri ---
  let heartRate;
  if (immobileScenario) {
    // Hareketsiz senaryoda: Sabit değer (çok az değişim)
    heartRate = lastHR + Math.round(randomNormal(-1, 1));
  } else if (fallDetected && (Date.now() - fallTime) < 8000) {
    // Düşme sonrası bayılma: Çok düşük nabız
    heartRate = Math.round(randomNormal(35, 42));
  } else {
    // Normal
    heartRate = Math.round(randomNormal(60, 90));
    if (Math.random() < 0.02) heartRate = Math.round(randomNormal(30, 45));  // ani düşük
    if (Math.random() < 0.02) heartRate = Math.round(randomNormal(130, 160)); // ani yüksek
  }

  if (heartRate < th.minHR) alarms.push("HR_LOW");
  if (heartRate > th.maxHR) alarms.push("HR_HIGH");

  // --- 2) Oksijen Değeri ---
  let spo2;
  if (immobileScenario) {
    // Hareketsiz senaryoda: Sabit değer
    spo2 = lastSpO2 + Math.round(randomNormal(-0.5, 0.5));
  } else if (fallDetected && (Date.now() - fallTime) < 8000) {
    // Düşme sonrası: Düşük oksijen
    spo2 = Math.round(randomNormal(85, 90));
  } else {
    // Normal
    spo2 = Math.round(randomNormal(94, 99));
    if (Math.random() < 0.02) spo2 = Math.round(randomNormal(80, 88));
  }

  if (spo2 < th.minSpO2) alarms.push("SPO2_LOW");

  // --- 3) İvme (Düşme) ---
  if (fallDetected && (Date.now() - fallTime) < 8000) {
    // Düşme sonrası yerde hareketsiz (8 saniye)
    ax = randomNormal(-0.05, 0.05);
    ay = randomNormal(-0.05, 0.05);
    az = randomNormal(0, 0.2); // Yere yakın
  } else if (immobileScenario && (Date.now() - immobileStartTime) < 10000) {
    // Hareketsizlik senaryosu (10 saniye) - oturur/ayakta durgun
    ax = randomNormal(-0.03, 0.03);
    ay = randomNormal(-0.03, 0.03);
    az = randomNormal(0.95, 1.05); // Dik duruş
  } else {
    // Normal hareket - senaryolar sona erdi
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

  // --- 4) Hareketsizlik (Sensör değerlerinin değişmemesi) ---
  const hrChange = Math.abs(heartRate - lastHR);
  const spo2Change = Math.abs(spo2 - lastSpO2);
  
  // Sensör değerleri değişiyorsa hareket var
  if (hrChange > 2 || spo2Change > 1 || totalG > 0.3) {
    lastMoveTime = Date.now();
  }
  
  lastHR = heartRate;
  lastSpO2 = spo2;

  const immobileTime = (Date.now() - lastMoveTime) / 1000;
  if (immobileTime > 5) {
    // 5 saniye hareketsizlik
    alarms.push("IMMOBILE");
  }
  
  // --- 5) Nabız Kontrolü (çok düşük nabız - bayılma/felç belirtisi) ---
  if (heartRate < 45 && immobileTime > 3) {
    alarms.push("CRITICAL_HR");
  }

  // --- 6) Kan Basıncı ---
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
