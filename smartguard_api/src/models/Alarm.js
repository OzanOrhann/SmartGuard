const Database = require('better-sqlite3');
const path = require('path');

// SQLite database dosyası (smartguard_api klasöründe oluşur)
const dbPath = path.join(__dirname, '..', '..', 'smartguard.db');
const db = new Database(dbPath);

// Alarms tablosunu oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS alarms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    alarmId TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    kinds TEXT NOT NULL,
    hr REAL,
    spo2 REAL,
    systolic REAL,
    diastolic REAL,
    ax REAL,
    ay REAL,
    az REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_userId ON alarms(userId);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON alarms(timestamp DESC);
`);

console.log('✅ SQLite veritabanı hazır:', dbPath);

// Alarm kaydetme
const saveAlarm = db.prepare(`
  INSERT INTO alarms (userId, alarmId, timestamp, kinds, hr, spo2, systolic, diastolic, ax, ay, az)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Kullanıcının alarmlarını getir
const getAlarmsByUserId = db.prepare(`
  SELECT * FROM alarms 
  WHERE userId = ? 
  ORDER BY timestamp DESC 
  LIMIT 100
`);

// Kullanıcının alarm sayısını getir
const countAlarmsByUserId = db.prepare(`
  SELECT COUNT(*) as count FROM alarms WHERE userId = ?
`);

module.exports = {
  db,
  saveAlarm,
  getAlarmsByUserId,
  countAlarmsByUserId
};
