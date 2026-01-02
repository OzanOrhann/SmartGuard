/**
 * notification-server.js
 * 
 * Standalone bildirim sunucusu
 * Arkadaşının backend'ine entegre edilebilir veya ayrı çalıştırılabilir
 */

const express = require('express');
const cors = require('cors');
const notificationRoutes = require('./src/routes/notification');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'SmartGuard Notification Service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      'POST /api/notification/register-token': 'Push token kaydet',
      'POST /api/notification/send': 'Veri al ve bildirim gönder (Ana endpoint)',
      'POST /api/notification/push': 'Direkt push bildirim gönder',
      'GET /api/notification/token/:userId': 'Token al',
      'GET /api/notification/users': 'Kayıtlı kullanıcıları listele',
      'DELETE /api/notification/token/:userId': 'Token sil'
    }
  });
});

// Notification API routes
app.use('/api/notification', notificationRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Port
const PORT = process.env.NOTIFICATION_PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('  📱 Notification Service Started');
  console.log('========================================');
  console.log(`Port: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log('\nAPI Endpoints:');
  console.log('  POST /api/notification/register-token');
  console.log('  POST /api/notification/send');
  console.log('  POST /api/notification/push');
  console.log('  GET  /api/notification/users');
  console.log('========================================\n');
});

module.exports = app;
