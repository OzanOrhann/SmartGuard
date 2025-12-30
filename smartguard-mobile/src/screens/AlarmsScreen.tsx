// src/screens/AlarmsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSensorData, Measurement, API_BASE } from '../hooks/useSensorData';

type AlarmItem = {
  id: string;
  ts: number;
  kinds: string[];
  snapshot: Measurement;
};

// Teknik alarm kodunu Türkçeye çevir
function translateAlarm(kind: string): string {
  switch (kind) {
    case 'HR_LOW':
      return 'Nabız düşük';
    case 'HR_HIGH':
      return 'Nabız yüksek';
    case 'SPO2_LOW':
      return 'Oksijen doygunluğu düşük';
    case 'BP_HIGH':
      return 'Kan basıncı yüksek';
    case 'IMMOBILE':
      return 'Uzun süre hareketsizlik (Bayılma/Felç şüphesi)';
    case 'FALL':
      return 'Düşme tespit edildi';
    case 'CRITICAL_HR':
      return 'Kritik durum: Çok düşük nabız + hareketsizlik';
    case 'MANUAL':
      return 'Manuel yardım çağrısı';
    default:
      return kind;
  }
}

// Alarm açıklaması detayı
function getAlarmExplanation(kind: string, snapshot: Measurement): string {
  const totalG = snapshot.ax !== undefined && snapshot.ay !== undefined && snapshot.az !== undefined
    ? Math.sqrt(snapshot.ax ** 2 + snapshot.ay ** 2 + snapshot.az ** 2).toFixed(2)
    : '?';

  switch (kind) {
    case 'FALL':
      return `⚠ Ani yüksek ivme (${totalG}g) ve yere yakın pozisyon tespit edildi.`;
    case 'HR_LOW':
      return `⚠ Nabız ${snapshot.heartRate}bpm (Normal: 40-120bpm)`;
    case 'HR_HIGH':
      return `⚠ Nabız ${snapshot.heartRate}bpm (Normal: 40-120bpm)`;
    case 'SPO2_LOW':
      return `⚠ SpO₂ %${snapshot.spo2} (Minimum: %92)`;
    case 'IMMOBILE':
      return `⚠ Sensör değerlerinde değişim tespit edilmedi. Bayılma/felç şüphesi.`;
    case 'CRITICAL_HR':
      return `⚠⚠ Çok düşük nabız (${snapshot.heartRate}bpm) + hareketsizlik. Acil müdahale gerekebilir!`;
    default:
      return '';
  }
}

export default function AlarmsScreen() {
  const { data } = useSensorData();
  const [history, setHistory] = useState<AlarmItem[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [emailModal, setEmailModal] = useState<{
    visible: boolean;
    alarmId: string | null;
    alarmType: string;
    email: string;
  }>({ visible: false, alarmId: null, alarmType: '', email: '' });
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load user ID from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('smartguard-user-id').then(id => {
      if (id) setUserId(id);
    });
  }, []);

  // Load alarm history from backend first, fallback to AsyncStorage
  useEffect(() => {
    if (!userId) return;
    
    const loadHistory = async () => {
      try {
        // Önce backend'den dene
        const response = await axios.get(`${API_BASE}/api/alarms/history/${userId}`);
        if (response.data.alarms && response.data.alarms.length > 0) {
          setHistory(response.data.alarms);
          // Backend verilerini AsyncStorage'a da kaydet
          const storageKey = `smartguard-alarms-${userId}`;
          await AsyncStorage.setItem(storageKey, JSON.stringify(response.data.alarms));
        } else {
          // Backend boşsa AsyncStorage'dan yükle
          const storageKey = `smartguard-alarms-${userId}`;
          const saved = await AsyncStorage.getItem(storageKey);
          if (saved) {
            const localData = JSON.parse(saved);
            setHistory(localData);
            // Local verileri backend'e sync et (alanları düzleştir)
            for (const alarm of localData) {
              const s = alarm.snapshot || {} as Measurement;
              await axios.post(`${API_BASE}/api/alarms/save`, {
                userId,
                alarm: {
                  id: String(alarm.ts),
                  ts: alarm.ts,
                  kinds: alarm.kinds,
                  hr: s.heartRate,
                  spo2: s.spo2,
                  systolic: s.sysBP,
                  diastolic: s.diaBP,
                  ax: s.ax,
                  ay: s.ay,
                  az: s.az
                }
              });
            }
          } else {
            setHistory([]);
          }
        }
      } catch (err) {
        console.warn('Backend yüklenemedi, AsyncStorage kullanılıyor:', err);
        // Backend erişilemezse AsyncStorage'dan yükle
        const storageKey = `smartguard-alarms-${userId}`;
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          try {
            setHistory(JSON.parse(saved));
          } catch (parseErr) {
            console.error('Alarm geçmişi yüklenemedi:', parseErr);
            setHistory([]);
          }
        } else {
          setHistory([]);
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    
    loadHistory();
  }, [userId]);

  useEffect(() => {
    if (!data || !data.alarms || data.alarms.length === 0 || !userId) return;

    setHistory(prev => {
      // Aynı saniyedeki alarmı iki kez ekleme
      if (prev.length > 0 && prev[0].ts === data.ts) return prev;

      const entry: AlarmItem = {
        id: String(data.ts),
        ts: data.ts,
        kinds: data.alarms,
        snapshot: data
      };

      const newHistory = [entry, ...prev].slice(0, 50);
      
      // Hem AsyncStorage hem backend'e kaydet
      const storageKey = `smartguard-alarms-${userId}`;
      AsyncStorage.setItem(storageKey, JSON.stringify(newHistory));
      
      // Backend'e async kaydet (başarısız olursa sorun değil) - alanları düzleştirerek
      axios.post(`${API_BASE}/api/alarms/save`, {
        userId,
        alarm: {
          id: String(data.ts),
          ts: data.ts,
          kinds: data.alarms,
          hr: data.heartRate,
          spo2: data.spo2,
          systolic: data.sysBP,
          diastolic: data.diaBP,
          ax: data.ax,
          ay: data.ay,
          az: data.az
        }
      }).catch(err => {
        console.warn('Backend alarm kaydetme hatası (local kayıt yapıldı):', err);
      });
      
      return newHistory;
    });
  }, [data?.ts, data?.alarms?.join(','), userId]);

  const handleSendEmail = (alarmItem: AlarmItem) => {
    setEmailModal({
      visible: true,
      alarmId: alarmItem.id,
      alarmType: alarmItem.kinds.map(translateAlarm).join(', '),
      email: ''
    });
  };

  const submitEmail = async () => {
    if (!emailModal.email.trim()) {
      Alert.alert('Hata', 'E-mail adresi gerekli');
      return;
    }
    if (!emailModal.email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-mail adresi girin');
      return;
    }

    setSending(true);
    try {
      const selected = history.find(h => h.id === emailModal.alarmId);
      const response = await axios.post(`${API_BASE}/api/notify/email`, {
        alarmType: emailModal.alarmType,
        reasons: selected ? selected.kinds.map(translateAlarm) : [emailModal.alarmType],
        severity: 'CRITICAL',
        timestamp: selected ? selected.ts : Date.now(),
        snapshot: selected ? selected.snapshot : undefined,
        email: emailModal.email,
      });
      
      if (response.data.success) {
        setEmailModal({ visible: false, alarmId: null, alarmType: '', email: '' });
        Alert.alert('Başarılı', 'E-mail başarıyla gönderildi!');
      } else {
        Alert.alert('Hata', response.data.error || 'E-mail gönderme hatası');
      }
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.error || 'E-mail gönderme hatası');
    } finally {
      setSending(false);
    }
  };

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.empty}>Henüz alarm üretilmedi.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        style={styles.list}
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => {
          const time = new Date(item.ts).toLocaleTimeString('tr-TR');
          const readableKinds = item.kinds.map(translateAlarm).join(', ');
          const totalG = item.snapshot?.ax !== undefined && item.snapshot?.ay !== undefined && item.snapshot?.az !== undefined
            ? Math.sqrt(item.snapshot.ax ** 2 + item.snapshot.ay ** 2 + item.snapshot.az ** 2).toFixed(2)
            : 'N/A';

          return (
            <View style={styles.card}>
              <Text style={styles.alarmKinds}>{readableKinds}</Text>
              <Text style={styles.time}>{time}</Text>
              
              <View style={styles.detailsGrid}>
                <Text style={[styles.detailItem, 
                  (item.snapshot?.heartRate < 40 || item.snapshot?.heartRate > 120) && styles.criticalValue
                ]}>
                  HR: {item.snapshot?.heartRate || 'N/A'} bpm
                </Text>
                <Text style={[styles.detailItem,
                  (item.snapshot?.spo2 < 92) && styles.criticalValue
                ]}>
                  SpO₂: {item.snapshot?.spo2 || 'N/A'}%
                </Text>
                <Text style={styles.detailItem}>
                  BP: {item.snapshot?.sysBP || 'N/A'}/{item.snapshot?.diaBP || 'N/A'}
                </Text>
                <Text style={[styles.detailItem,
                  (parseFloat(totalG) > 2) && styles.criticalValue
                ]}>
                  İvme: {totalG} g
                </Text>
              </View>

              {/* Alarm Nedenleri */}
              <View style={styles.explanations}>
                {item.kinds.map(kind => {
                  const explanation = getAlarmExplanation(kind, item.snapshot);
                  if (!explanation) return null;
                  return (
                    <Text key={kind} style={styles.explanation}>
                      {explanation}
                    </Text>
                  );
                })}
              </View>

              <TouchableOpacity 
                style={styles.emailButton}
                onPress={() => handleSendEmail(item)}
              >
                <Text style={styles.emailButtonText}>E-mail Gönder</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Email Modal */}
      <Modal
        visible={emailModal.visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEmailModal({ visible: false, alarmId: null, alarmType: '', email: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>E-mail Gönder</Text>
            <Text style={styles.modalSubtitle}>Alarm: {emailModal.alarmType}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="E-mail adresi"
              value={emailModal.email}
              onChangeText={text => setEmailModal({ ...emailModal, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEmailModal({ visible: false, alarmId: null, alarmType: '', email: '' })}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.sendButton, sending && styles.disabledButton]}
                onPress={submitEmail}
                disabled={sending}
              >
                <Text style={styles.sendButtonText}>{sending ? 'Gönderiliyor...' : 'Gönder'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  list: {
    backgroundColor: '#f3f4f6'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6'
  },
  empty: {
    fontSize: 14,
    color: '#6b7280'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 1
  },
  emailButton: {
    marginTop: 10,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#e5e7eb'
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600'
  },
  sendButton: {
    backgroundColor: '#3b82f6'
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.5
  },
  alarmKinds: {
    fontSize: 15,
    fontWeight: '700',
    color: '#b91c1c',
    marginBottom: 4
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  detailItem: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  criticalValue: {
    color: '#ef4444',
    fontWeight: 'bold'
  },
  explanations: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  explanation: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 16
  }
});
