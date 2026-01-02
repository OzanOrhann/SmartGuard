/**
 * NotificationService.js
 * 
 * Telefon A'dan gelen verileri alıp Telefon B'ye push bildirim gönderir.
 * Standalone modül - Herhangi bir backend'e entegre edilebilir.
 */

class NotificationService {
  constructor() {
    this.pushTokens = new Map(); // userId -> token mapping (in-memory)
  }

  /**
   * Push token kaydet
   * @param {string} userId - Kullanıcı ID
   * @param {string} token - Expo push token
   */
  registerToken(userId, token) {
    if (!token || !token.startsWith('ExponentPushToken')) {
      throw new Error('Geçersiz Expo push token');
    }
    this.pushTokens.set(userId, token);
    console.log(`[NotificationService] Token registered for user: ${userId}`);
    return { success: true, userId, token };
  }

  /**
   * Kullanıcının token'ını al
   * @param {string} userId - Kullanıcı ID
   */
  getToken(userId) {
    return this.pushTokens.get(userId) || null;
  }

  /**
   * Tüm kayıtlı kullanıcıları listele
   */
  listUsers() {
    return Array.from(this.pushTokens.keys());
  }

  /**
   * Push bildirim gönder (Expo Push API)
   * @param {Object} params - Bildirim parametreleri
   * @param {string|string[]} params.tokens - Expo push token(lar)
   * @param {string} params.title - Bildirim başlığı
   * @param {string} params.body - Bildirim içeriği
   * @param {Object} params.data - Ekstra veri (opsiyonel)
   */
  async sendPushNotification({ tokens, title, body, data = {} }) {
    try {
      const tokenList = Array.isArray(tokens) ? tokens : [tokens];
      const validTokens = tokenList.filter(t => 
        typeof t === 'string' && t.startsWith('ExponentPushToken')
      );

      if (validTokens.length === 0) {
        throw new Error('Geçerli push token bulunamadı');
      }

      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title || 'Bildirim',
        body: body || 'Yeni bir bildirim aldınız',
        data: data,
        priority: 'high',
        channelId: 'default'
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messages)
      });

      const result = await response.json();
      
      console.log(`[NotificationService] Sent ${validTokens.length} notification(s)`);
      
      return {
        success: true,
        sent: validTokens.length,
        result: result
      };
    } catch (error) {
      console.error('[NotificationService] Push error:', error);
      throw error;
    }
  }

  /**
   * Veri al ve bildirim gönder (Ana fonksiyon)
   * @param {Object} params - İstek parametreleri
   * @param {Object} params.data - Gönderilecek veri
   * @param {string[]} params.targetUsers - Hedef kullanıcı ID'leri
   * @param {string} params.title - Bildirim başlığı (opsiyonel)
   * @param {string} params.body - Bildirim içeriği (opsiyonel)
   */
  async processAndNotify({ data, targetUsers, title, body }) {
    console.log('[NotificationService] Processing data:', data);

    // Veriyi işle (burada istediğin gibi formatla)
    const processedData = this.processIncomingData(data);

    // Hedef kullanıcıların token'larını al
    const tokens = targetUsers
      .map(userId => this.getToken(userId))
      .filter(token => token !== null);

    if (tokens.length === 0) {
      throw new Error('Hedef kullanıcılar için push token bulunamadı');
    }

    // Bildirim gönder
    return await this.sendPushNotification({
      tokens,
      title: title || processedData.title,
      body: body || processedData.body,
      data: processedData
    });
  }

  /**
   * Gelen veriyi işle ve formatla
   * Bu fonksiyonu ihtiyacına göre değiştirebilirsin
   * @param {Object} data - Ham veri
   */
  processIncomingData(data) {
    // Örnek format dönüşümleri
    const processed = {
      ...data,
      timestamp: data.timestamp || Date.now(),
      received_at: new Date().toISOString()
    };

    // Veri tipine göre başlık/içerik oluştur
    if (data.type === 'fall') {
      processed.title = '🚨 Düşme Algılandı!';
      processed.body = `İvme: ${data.value}G - Acil durum`;
    } else if (data.type === 'heartRate') {
      processed.title = '❤️ Kalp Atışı';
      processed.body = `${data.value} BPM`;
    } else if (data.type === 'spo2') {
      processed.title = '🫁 Oksijen Seviyesi';
      processed.body = `%${data.value}`;
    } else if (data.type === 'immobile') {
      processed.title = '⚠️ Hareketsizlik';
      processed.body = `${data.duration} saniye hareketsiz`;
    } else {
      processed.title = data.title || 'Yeni Veri';
      processed.body = data.body || JSON.stringify(data);
    }

    return processed;
  }

  /**
   * Token'ı kaldır
   * @param {string} userId - Kullanıcı ID
   */
  removeToken(userId) {
    const deleted = this.pushTokens.delete(userId);
    console.log(`[NotificationService] Token removed for user: ${userId}`);
    return { success: deleted };
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
