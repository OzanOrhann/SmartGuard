/**
 * notification.js
 * 
 * Bildirim API route'ları
 * Bu dosyayı herhangi bir Express app'e ekleyebilirsin
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/NotificationService');

/**
 * POST /api/notification/register-token
 * Push token kaydet
 * Body: { userId: string, token: string }
 */
router.post('/register-token', (req, res) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: 'userId ve token gerekli'
      });
    }

    const result = notificationService.registerToken(userId, token);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notification/send
 * Veri al ve bildirim gönder (Ana endpoint)
 * Body: {
 *   data: Object (sensör verisi veya herhangi bir veri),
 *   targetUsers: string[] (hedef kullanıcı ID'leri),
 *   title?: string (opsiyonel başlık),
 *   body?: string (opsiyonel içerik)
 * }
 */
router.post('/send', async (req, res) => {
  try {
    const { data, targetUsers, title, body } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'data gerekli'
      });
    }

    if (!targetUsers || !Array.isArray(targetUsers) || targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'targetUsers array gerekli (en az 1 kullanıcı)'
      });
    }

    const result = await notificationService.processAndNotify({
      data,
      targetUsers,
      title,
      body
    });

    res.json(result);
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notification/push
 * Direkt push bildirim gönder (manuel kullanım)
 * Body: {
 *   tokens: string | string[],
 *   title: string,
 *   body: string,
 *   data?: Object
 * }
 */
router.post('/push', async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;

    if (!tokens) {
      return res.status(400).json({
        success: false,
        error: 'tokens gerekli'
      });
    }

    const result = await notificationService.sendPushNotification({
      tokens,
      title: title || 'Bildirim',
      body: body || 'Yeni bildirim',
      data: data || {}
    });

    res.json(result);
  } catch (error) {
    console.error('Push notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/notification/token/:userId
 * Kullanıcının token'ını al
 */
router.get('/token/:userId', (req, res) => {
  const { userId } = req.params;
  const token = notificationService.getToken(userId);
  
  if (!token) {
    return res.status(404).json({
      success: false,
      error: 'Token bulunamadı'
    });
  }

  res.json({
    success: true,
    userId,
    token
  });
});

/**
 * GET /api/notification/users
 * Kayıtlı kullanıcıları listele
 */
router.get('/users', (req, res) => {
  const users = notificationService.listUsers();
  res.json({
    success: true,
    count: users.length,
    users
  });
});

/**
 * DELETE /api/notification/token/:userId
 * Token'ı kaldır
 */
router.delete('/token/:userId', (req, res) => {
  const { userId } = req.params;
  const result = notificationService.removeToken(userId);
  res.json(result);
});

module.exports = router;
