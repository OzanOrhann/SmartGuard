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
  Alert
} from 'react-native';
import axios from 'axios';
import { API_BASE, Thresholds, useSensorData } from '../hooks/useSensorData';

export default function SettingsScreen() {
  const { thresholds } = useSensorData();
  const [localTh, setLocalTh] = useState<Thresholds>(thresholds);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalTh(thresholds);
  }, [thresholds]);

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
  }
});
