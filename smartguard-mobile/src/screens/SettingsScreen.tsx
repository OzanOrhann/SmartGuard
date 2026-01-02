// src/screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Button,
  Alert,
  TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE, Thresholds, useSensorData } from '../hooks/useSensorData';

export default function SettingsScreen() {
  const { thresholds } = useSensorData();
  const [localTh, setLocalTh] = useState<Thresholds>(thresholds);
  const [saving, setSaving] = useState(false);
  const [notifyUsers, setNotifyUsers] = useState<string[]>([]);
  const [newUserId, setNewUserId] = useState('');

  useEffect(() => {
    setLocalTh(thresholds);
  }, [thresholds]);

  // Bildirim hedef kullanıcılarını yükle
  useEffect(() => {
    AsyncStorage.getItem('notify-users').then(stored => {
      if (stored) {
        setNotifyUsers(JSON.parse(stored));
      }
    });
  }, []);

  // Hedef kullanıcı ekle
  const addNotifyUser = async () => {
    const userId = newUserId.trim();
    if (!userId) {
      Alert.alert('Hata', 'Kullanıcı ID boş olamaz');
      return;
    }
    if (notifyUsers.includes(userId)) {
      Alert.alert('Hata', 'Bu kullanıcı zaten ekli');
      return;
    }
    const updated = [...notifyUsers, userId];
    setNotifyUsers(updated);
    await AsyncStorage.setItem('notify-users', JSON.stringify(updated));
    setNewUserId('');
    Alert.alert('Başarılı', `${userId} bildirim listesine eklendi`);
  };

  // Hedef kullanıcı sil
  const removeNotifyUser = async (userId: string) => {
    const updated = notifyUsers.filter(u => u !== userId);
    setNotifyUsers(updated);
    await AsyncStorage.setItem('notify-users', JSON.stringify(updated));
    Alert.alert('Silindi', `${userId} bildirim listesinden çıkarıldı`);
  };

  function updateField<K extends keyof Thresholds>(key: K, value: string) {
    const num = Number(value.replace(',', '.'));
    if (isNaN(num)) return;
    setLocalTh(t => ({ ...t, [key]: num }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      Keyboard.dismiss();
      await axios.put(`${API_BASE}/api/thresholds`, localTh);
      Alert.alert('Kaydedildi', 'Eşik değerleri güncellendi.');
    } catch (e) {
      Alert.alert('Hata', 'Eşik değerleri kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    Keyboard.dismiss();
    setLocalTh(thresholds);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Eşik Değerleri</Text>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Min Nabız</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={String(localTh.minHR)}
                onChangeText={v => updateField('minHR', v)}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Max Nabız</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={String(localTh.maxHR)}
                onChangeText={v => updateField('maxHR', v)}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Min SpO₂ (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(localTh.minSpO2)}
              onChangeText={v => updateField('minSpO2', v)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Hareketsizlik süresi (sn)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(localTh.immobileSec)}
              onChangeText={v => updateField('immobileSec', v)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Düşme eşiği (g)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={String(localTh.fallG)}
              onChangeText={v => updateField('fallG', v)}
            />
          </View>

          <View style={styles.buttonRow}>
            <View style={styles.button}>
              <Button title="Vazgeç" onPress={handleCancel} disabled={saving} />
            </View>
            <View style={styles.button}>
              <Button title="Kaydet" onPress={handleSave} disabled={saving} />
            </View>

            {/* Bildirim Hedef Kullanıcıları */}
            <Text style={[styles.title, { marginTop: 32 }]}>📲 Push Bildirim Gönderilecekler</Text>
            
            <View style={styles.addUserSection}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Kullanıcı ID"
                value={newUserId}
                onChangeText={setNewUserId}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.addButton} onPress={addNotifyUser}>
                <Text style={styles.addButtonText}>+ Ekle</Text>
              </TouchableOpacity>
            </View>

            {notifyUsers.length === 0 ? (
              <Text style={styles.emptyText}>Henüz hedef kullanıcı eklenmedi</Text>
            ) : (
              <View style={styles.userList}>
                {notifyUsers.map((userId) => (
                  <View key={userId} style={styles.userItem}>
                    <Text style={styles.userIdText}>{userId}</Text>
                    <TouchableOpacity onPress={() => removeNotifyUser(userId)}>
                      <Text style={styles.removeButton}>🗑️ Sil</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <Text style={styles.helpText}>
              💡 Alarm oluştuğunda bu kullanıcılara push bildirim gönderilir
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f2f7'
  },
  container: {
    padding: 16,
    paddingTop: 24 // ekran çok yukarı yapışmasın
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  field: {
    flex: 1,
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    color: '#6e6e73',
    marginBottom: 4
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e5ea'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24
  },
  button: {
    flex: 1,
    marginHorizontal: 4
  },
  addUserSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  addButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center'
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  userList: {
    gap: 8,
    marginBottom: 16
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5ea'
  },
  userIdText: {
    fontSize: 16,
    fontWeight: '500'
  },
  removeButton: {
    fontSize: 14,
    color: '#ff3b30'
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginVertical: 16
  },
  helpText: {
    fontSize: 13,
    color: '#6e6e73',
    fontStyle: 'italic',
    marginTop: 8
  }
});
