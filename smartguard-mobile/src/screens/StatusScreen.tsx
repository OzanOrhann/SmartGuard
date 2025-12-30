// src/screens/StatusScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSensorData, API_BASE } from '../hooks/useSensorData';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

// Bildirim davranışı (uygulama açıkken de popup göstersin)
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false
    } as Notifications.NotificationBehavior;
  }
});



export default function StatusScreen() {
  const { data, thresholds, loading, error } = useSensorData();
  const [simulatorRunning, setSimulatorRunning] = useState(true);
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  // Aynı alarmı iki kere bildirmemek için
  const lastAlarmTs = useRef<number | null>(null);

  // Simulator durumunu kontrol et
  useEffect(() => {
    axios.get(`${API_BASE}/api/simulator/status`)
      .then(res => setSimulatorRunning(res.data.running))
      .catch(err => console.error('Simulator status error:', err));
  }, []);

  const handleSimulatorToggle = async () => {
    setSimulatorLoading(true);
    try {
      const endpoint = simulatorRunning ? '/api/simulator/stop' : '/api/simulator/start';
      const res = await axios.post(`${API_BASE}${endpoint}`);
      setSimulatorRunning(res.data.running);
    } catch (err) {
      console.error('Simulator kontrol hatası:', err);
    } finally {
      setSimulatorLoading(false);
    }
  };

  const triggerImmobile = async (seconds: number, immediate: boolean) => {
    setScenarioLoading(true);
    try {
      await axios.post(`${API_BASE}/api/simulator/scenario`, { type: 'immobile', seconds, immediate });
    } catch (err) {
      console.error('Senaryo tetikleme hatası:', err);
    } finally {
      setScenarioLoading(false);
    }
  };

  // Uygulama açıldığında bildirim izni iste
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // Her yeni alarm geldiğinde bildirim gönder
  useEffect(() => {
    if (!data || !data.alarms || data.alarms.length === 0) return;

    // Aynı timestamp'e sahip alarmı tekrar gösterme
    if (lastAlarmTs.current === data.ts) return;
    lastAlarmTs.current = data.ts;

    const body = data.alarms.join(', '); // Örn: "HR_LOW, SPO2_LOW"

    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Akıllı Güvenlik İstemi Alarm',
        body
      },
      trigger: null // hemen göster
    });
  }, [data?.ts, data?.alarms?.join(',')]);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.wait}>Veri bekleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </SafeAreaView>
    );
  }

  const lastTime = new Date(data.ts).toLocaleTimeString('tr-TR');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Akıllı Güvenlik İstemi</Text>
          <Text style={styles.subtitle}>Yaşlı / riskli birey durum izleme</Text>
        </View>
        <TouchableOpacity
          style={[styles.controlButton, simulatorRunning ? styles.stopButton : styles.startButton]}
          onPress={handleSimulatorToggle}
          disabled={simulatorLoading}
        >
          {simulatorLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.controlButtonText}>
              {simulatorRunning ? '⏸️ Durdur' : '▶️ Başlat'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.cards}>
        <View style={styles.cardLarge}>
          <Text style={styles.cardLabel}>Nabız</Text>
          <Text style={styles.bigValue}>{data.heartRate} bpm</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Oksijen (SpO₂)</Text>
            <Text style={styles.midValue}>{data.spo2} %</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Kan Basıncı</Text>
            <Text style={styles.midValue}>
              {data.sysBP}/{data.diaBP} mmHg
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Hareket / Düşme</Text>
          <Text style={styles.motion}>
            ax: {data.ax.toFixed(2)}   ay: {data.ay.toFixed(2)}   az: {data.az.toFixed(2)}
          </Text>
          {data.totalG !== undefined && (
            <Text style={styles.motion}>
              Toplam İvme: {data.totalG} g
            </Text>
          )}
          {data.fallDetected && (
            <Text style={[styles.motion, { color: '#ef4444', fontWeight: 'bold' }]}>
              🔴 Düşme tespit edildi!
            </Text>
          )}
          <Text style={styles.cardHint}>Düşme eşiği: {thresholds.fallG.toFixed(1)} g</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Aktivite Durumu</Text>
          <Text style={styles.motion}>
            Hareketsizlik: {data.immobileTime !== undefined ? data.immobileTime : 0} saniye
          </Text>
          <Text style={[
            styles.motion,
            { 
              color: data.immobileTime < 5 ? '#22c55e' : 
                     data.immobileTime < 10 ? '#f59e0b' : '#ef4444',
              fontWeight: 'bold'
            }
          ]}>
            {data.immobileTime < 5 ? '✓ Aktif' : 
             data.immobileTime < 10 ? '⚠ Düşük aktivite' : 
             '⚠ Hareketsiz'}
          </Text>

          <View style={styles.scenarioRow}>
            <TouchableOpacity
              disabled={scenarioLoading}
              onPress={() => triggerImmobile(15, false)}
              style={[styles.scenarioBtn, { backgroundColor: '#2563eb' }]}
            >
              {scenarioLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.scenarioBtnText}>Hareketsizlik (15 sn)</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={scenarioLoading}
              onPress={() => triggerImmobile(15, true)}
              style={[styles.scenarioBtn, { backgroundColor: '#7c3aed' }]}
            >
              {scenarioLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.scenarioBtnText}>Hemen Alarm (15 sn)</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Son güncelleme: {lastTime}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 16
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f7'
  },
  wait: {
    fontSize: 16,
    color: '#8e8e93'
  },
  error: {
    fontSize: 16,
    color: 'red'
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center'
  },
  stopButton: {
    backgroundColor: '#ef4444'
  },
  startButton: {
    backgroundColor: '#22c55e'
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 4
  },
  cards: {
    flex: 1,
    gap: 12
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  cardLarge: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    elevation: 2
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    elevation: 2
  },
  cardLabel: {
    fontSize: 13,
    color: '#6e6e73',
    marginBottom: 6
  },
  bigValue: {
    fontSize: 32,
    fontWeight: '700'
  },
  midValue: {
    fontSize: 24,
    fontWeight: '600'
  },
  motion: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  cardHint: {
    fontSize: 12,
    color: '#8e8e93'
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 10
  },
  footerText: {
    fontSize: 12,
    color: '#8e8e93'
  },
  scenarioRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  scenarioBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  scenarioBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  }
});
