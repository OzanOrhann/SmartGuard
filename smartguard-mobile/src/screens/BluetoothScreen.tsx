// BluetoothScreen.tsx - Bileklik bağlantı ekranı
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,

  Alert,
  StyleSheet,
} from 'react-native';
import BLEService from '../services/BLEService';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface Device {
  name: string;
  id: string;
}

export default function BluetoothScreen() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connected, setConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [sensorData, setSensorData] = useState<any>(null);

  useEffect(() => {
    // BLE'den gelen verileri dinle
    BLEService.onData(async (data) => {
      console.log('BLE Sensor data:', data);
      setSensorData(data);

      try {
        // Backend'e gönder (Web dashboard'da görünsün)
        await axios.post(`${BACKEND_URL}/api/sensor`, {
          heartRate: data.heartRate,
          spo2: data.spo2,
          acceleration: {
            x: data.ax,
            y: data.ay,
            z: data.az,
          },
          timestamp: data.timestamp,
        });
      } catch (error) {
        console.error('Backend gönderim hatası:', error);
      }
    });

    return () => {
      BLEService.disconnect();
    };
  }, []);

  // Bileklik tarama
  const handleScan = async () => {
    setDevices([]);
    setScanning(true);

    try {
      await BLEService.startScan((name, id) => {
        setDevices((prev) => {
          // Zaten eklenmişse tekrar ekleme
          if (prev.some((d) => d.id === id)) return prev;
          return [...prev, { name, id }];
        });
      });

      setTimeout(() => {
        setScanning(false);
      }, 10000);
    } catch (error: any) {
      Alert.alert('Hata', error.message);
      setScanning(false);
    }
  };

  // Bilekliğe bağlan
  const handleConnect = async (device: Device) => {
    try {
      await BLEService.connect(device.id);
      setConnected(true);
      setCurrentDevice(device);
      Alert.alert('Başarılı', `${device.name} bağlandı!`);
    } catch (error: any) {
      Alert.alert('Bağlantı Hatası', error.message);
    }
  };

  // Bağlantıyı kes
  const handleDisconnect = async () => {
    await BLEService.disconnect();
    setConnected(false);
    setCurrentDevice(null);
    setSensorData(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bileklik Bağlantısı</Text>

      {/* Bağlantı durumu */}
      {connected && currentDevice ? (
        <View style={styles.connectedCard}>
          <Text style={styles.connectedText}>
            Bağlı: {currentDevice.name}
          </Text>
          
          {sensorData && (
            <View style={styles.sensorBox}>
              <Text style={styles.sensorText}>
                Kalp Atışı: {sensorData.heartRate} bpm
              </Text>
              <Text style={styles.sensorText}>
                SpO₂: {sensorData.spo2}%
              </Text>
              <Text style={styles.sensorText}>
                İvme: {sensorData.ax.toFixed(2)}g, {sensorData.ay.toFixed(2)}g, {sensorData.az.toFixed(2)}g
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Text style={styles.buttonText}>Bağlantıyı Kes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Tarama butonu */}
          <TouchableOpacity
            style={[styles.scanButton, scanning && styles.scanningButton]}
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>  Taranıyor...</Text>
              </>
            ) : (
              <Text style={styles.buttonText}>Bileklik Ara</Text>
            )}
          </TouchableOpacity>

          {/* Bulunan cihazlar */}
          {devices.length > 0 && (
                <View style={styles.devicesContainer}>
                  <Text style={styles.subtitle}>Bulunan Cihazlar:</Text>
                  <FlatList
                    data={devices}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.deviceCard}
                        onPress={() => handleConnect(item)}
                      >
                        <Text style={styles.deviceName}>{item.name}</Text>
                        <Text style={styles.deviceId}>{item.id}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
        </>
      )}

      {/* Bilgi metni */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Bileklik yoksa StatusScreen'i kullan (simülatör verisi)
        </Text>
        <Text style={styles.infoText}>
          Bu ekran yalnızca gerçek BLE bileklik bağlantısı içindir
         </Text>
         <Text style={styles.infoText}>
           Bilekliği açın ve "Bileklik Ara" butonuna tıklayın
         </Text>
       </View>

      {/* Simulator uyarısı */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          Bileklik bağlıyken simülatörü kapatın
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  connectedCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  connectedText: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sensorBox: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  sensorText: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  scanButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanningButton: {
    backgroundColor: '#64748b',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devicesContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    fontWeight: '600',
    marginBottom: 12,
  },
  deviceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  deviceName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});
