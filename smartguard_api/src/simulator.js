// simulator.js
const axios = require('axios');

let ax = 0, ay = 0, az = 1;  // normal duruş (1g)
let lastMoveTime = Date.now();

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

function randomNormal(min, max) {
  return min + Math.random() * (max - min);
}

async function simulate() {
  const th = await loadThresholds();
  const alarms = [];

  // --- 1) Kalp Değeri ---
  let heartRate = Math.round(randomNormal(60, 90));
  if (Math.random() < 0.02) heartRate = Math.round(randomNormal(30, 45));  // ani düşük
  if (Math.random() < 0.02) heartRate = Math.round(randomNormal(130, 160)); // ani yüksek

  if (heartRate < th.minHR) alarms.push("HR_LOW");
  if (heartRate > th.maxHR) alarms.push("HR_HIGH");

  // --- 2) Oksijen Değeri ---
  let spo2 = Math.round(randomNormal(94, 99));
  if (Math.random() < 0.02) spo2 = Math.round(randomNormal(80, 88));  // düşük oksijen simülasyonu

  if (spo2 < th.minSpO2) alarms.push("SPO2_LOW");

  // --- 3) İvme (Düşme) ---
  if (Math.random() < 0.01) {
    // Ani düşme simülasyonu
    ax = randomNormal(3, 5);
    ay = randomNormal(3, 5);
    az = randomNormal(3, 5);
  } else {
    // Normal hafif hareket
    ax = randomNormal(-0.2, 0.2);
    ay = randomNormal(-0.2, 0.2);
    az = randomNormal(0.8, 1.2);
  }

  const totalG = Math.sqrt(ax * ax + ay * ay + az * az);
  if (totalG > th.fallG) alarms.push("FALL");

  // --- 4) Hareketsizlik ---
  const movedRecently = Math.random() < 0.90; // %90 normal hareket
  if (movedRecently) {
    lastMoveTime = Date.now();
  }

  const immobileTime = (Date.now() - lastMoveTime) / 1000;
  if (immobileTime > Math.min(th.immobileSec, 10)) {
    // Gerçek hayatta 600 sn kullanılacak ama test için 10 saniyeye sabitliyoruz
    alarms.push("IMMOBILE");
  }

  // --- 5) Kan Basıncı ---
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
    alarms
  };

  try {
    await axios.post("http://localhost:4000/api/sensor", payload);
    console.log("Gönderildi:", payload);
  } catch (err) {
    console.log("Gönderilemedi:", err.message);
  }
}

// Her 1 saniyede bir veri gönder
setInterval(simulate, 1000);
