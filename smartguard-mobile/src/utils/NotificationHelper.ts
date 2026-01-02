/**
 * NotificationHelper.ts
 * 
 * Push bildirim yardımcı fonksiyonları
 */

import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { NOTIFICATION_API } from '../config';

export interface NotificationData {
  type?: 'fall' | 'heartRate' | 'spo2' | 'immobile' | string;
  value?: number;
  title?: string;
  body?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Push token'ı notification servisine kaydet
 * @param userId - Kullanıcı ID (unique identifier)
 */
export async function registerPushToken(userId: string): Promise<boolean> {
  try {
    // Bildirim izni al
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return false;
    }

    // Expo push token al
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '77c402f6-9d44-4750-ad01-156e0f421dbf'
    });

    // Notification servisine kaydet
    const response = await axios.post(
      `${NOTIFICATION_API}/api/notification/register-token`,
      {
        userId,
        token: token.data
      }
    );

    console.log('[NotificationHelper] Token registered:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('[NotificationHelper] Register token error:', error);
    return false;
  }
}

/**
 * Veri gönder ve hedef kullanıcılara bildirim tetikle
 * @param data - Gönderilecek veri
 * @param targetUsers - Hedef kullanıcı ID'leri
 */
export async function sendNotification(
  data: NotificationData,
  targetUsers: string[]
): Promise<boolean> {
  try {
    const response = await axios.post(
      `${NOTIFICATION_API}/api/notification/send`,
      {
        data: {
          ...data,
          timestamp: data.timestamp || Date.now()
        },
        targetUsers
      }
    );

    console.log('[NotificationHelper] Notification sent:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('[NotificationHelper] Send notification error:', error);
    return false;
  }
}

/**
 * Düşme algılandığında bildirim gönder
 */
export async function sendFallAlert(
  accelMagnitude: number,
  targetUsers: string[]
): Promise<boolean> {
  return sendNotification(
    {
      type: 'fall',
      value: accelMagnitude,
      title: '🚨 Düşme Algılandı!',
      body: `İvme: ${accelMagnitude.toFixed(2)}G - Acil durum`
    },
    targetUsers
  );
}

/**
 * Hareketsizlik algılandığında bildirim gönder
 */
export async function sendImmobileAlert(
  duration: number,
  targetUsers: string[]
): Promise<boolean> {
  return sendNotification(
    {
      type: 'immobile',
      value: duration,
      title: '⚠️ Hareketsizlik Uyarısı',
      body: `${duration} saniye hareketsiz`
    },
    targetUsers
  );
}

/**
 * Kalp atışı anormalliği bildirimi
 */
export async function sendHeartRateAlert(
  heartRate: number,
  targetUsers: string[]
): Promise<boolean> {
  return sendNotification(
    {
      type: 'heartRate',
      value: heartRate,
      title: '❤️ Kalp Atışı Uyarısı',
      body: `${heartRate} BPM - Normal aralık dışında`
    },
    targetUsers
  );
}

/**
 * Oksijen seviyesi düşük bildirimi
 */
export async function sendSpO2Alert(
  spo2: number,
  targetUsers: string[]
): Promise<boolean> {
  return sendNotification(
    {
      type: 'spo2',
      value: spo2,
      title: '🫁 Oksijen Seviyesi Düşük',
      body: `SpO2: %${spo2}`
    },
    targetUsers
  );
}
