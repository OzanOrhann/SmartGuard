// BLEService.ts - Bileklikten sensör verisi okuma
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// ESP32 bileklik UUID'leri
const DEVICE_NAME_PREFIX = 'SmartGuard'; // ESP32 yayın adı: SmartGuard-ESP32 (cihaz yayın adı)
const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
const SPO2_MEASUREMENT = '00002a5f-0000-1000-8000-00805f9b34fb';
const ACCEL_MEASUREMENT = '12345678-1234-5678-1234-56789abcdef1';

interface SensorData {
  heartRate: number;
  spo2: number;
  ax: number;
  ay: number;
  az: number;
  timestamp: number;
}

class BLEService {
  private manager: BleManager;
  private device: Device | null = null;
  private onDataCallback: ((data: SensorData) => void) | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  // Android 12+ için Bluetooth izinleri
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(granted).every(val => val === 'granted');
      } else {
        // Android 11 ve altı
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === 'granted';
      }
    }
    return true; // iOS izinleri otomatik
  }

  // Bileklik tarama
  async startScan(
    onDeviceFound: (name: string, id: string) => void
  ): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth izinleri reddedildi');
    }

    const state = await this.manager.state();
    if (state !== 'PoweredOn') {
      throw new Error('Bluetooth kapalı, lütfen açın');
    }

    console.log('Scanning for devices...');

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Tarama hatası:', error);
        return;
      }

      if (device?.name) {
        console.log('Found device:', device.name, '| ID:', device.id);
      }

      if (device?.name) {
        console.log('Adding to list:', device.name);
        onDeviceFound(device.name, device.id);
      }
    });

    setTimeout(() => {
      this.manager.stopDeviceScan();
      console.log('Scan stopped');
    }, 10000);
  }

  // Taramayı manuel durdur
  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  // Bilekliğe bağlan
  async connect(deviceId: string): Promise<void> {
    try {
      console.log('Connecting:', deviceId);
      
      this.device = await this.manager.connectToDevice(deviceId, {
        timeout: 10000,
      });

      console.log('Connected:', this.device.name);

      await this.device.discoverAllServicesAndCharacteristics();
      console.log('Services discovered');

      // Sensör verilerini dinlemeye başla
      await this.subscribeToSensors();
    } catch (error) {
      console.error('Bağlantı hatası:', error);
      throw error;
    }
  }

  // Sensör verilerini dinle
  private async subscribeToSensors(): Promise<void> {
    if (!this.device) return;

    try {
      // Heart Rate dinle
      this.device.monitorCharacteristicForService(
        SERVICE_UUID,
        HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            console.error('HR okuma hatası:', error);
            return;
          }
          if (characteristic?.value) {
            const hr = this.parseHeartRate(characteristic.value);
            this.updateSensorData({ heartRate: hr });
          }
        }
      );

      // SpO2 dinle
      this.device.monitorCharacteristicForService(
        SERVICE_UUID,
        SPO2_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            console.error('SpO2 okuma hatası:', error);
            return;
          }
          if (characteristic?.value) {
            const spo2 = this.parseSpO2(characteristic.value);
            this.updateSensorData({ spo2 });
          }
        }
      );

      // Accelerometer dinle
      this.device.monitorCharacteristicForService(
        SERVICE_UUID,
        ACCEL_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            console.error('Accel okuma hatası:', error);
            return;
          }
          if (characteristic?.value) {
            const accel = this.parseAccelerometer(characteristic.value);
            this.updateSensorData(accel);
          }
        }
      );

      console.log('Monitoring sensors');
    } catch (error) {
      console.error('Sensor monitoring error:', error);
    }
  }

  // Heart Rate parsing (Bluetooth SIG standardı)
  private parseHeartRate(base64Value: string): number {
    const buffer = Buffer.from(base64Value, 'base64');
    const firstByte = buffer[0];
    
    // Bit 0: HR format (0 = UINT8, 1 = UINT16)
    if ((firstByte & 0x01) === 0) {
      return buffer[1]; // UINT8
    } else {
      return buffer.readUInt16LE(1); // UINT16
    }
  }

  // SpO2 parsing (Bluetooth SIG standardı)
  private parseSpO2(base64Value: string): number {
    const buffer = Buffer.from(base64Value, 'base64');
    // SpO2 genelde 1. byte'ta (0-100 arası)
    return buffer[1];
  }

  // Accelerometer parsing (bileklik özelinde değişir)
  private parseAccelerometer(base64Value: string): {
    ax: number;
    ay: number;
    az: number;
  } {
    const buffer = Buffer.from(base64Value, 'base64');
    
    // Örnek: 3 adet 16-bit signed integer (little-endian)
    // Gerçek bilekliğe göre bu format değişir!
    const ax = buffer.readInt16LE(0) / 1000; // m/s² cinsinden
    const ay = buffer.readInt16LE(2) / 1000;
    const az = buffer.readInt16LE(4) / 1000;

    return { ax, ay, az };
  }

  // Sensör verisini callback ile gönder
  private latestData: Partial<SensorData> = {};
  
  private updateSensorData(partial: Partial<SensorData>): void {
    this.latestData = { ...this.latestData, ...partial };

    // Tüm veriler varsa callback çağır
    if (
      this.latestData.heartRate &&
      this.latestData.spo2 &&
      this.latestData.ax !== undefined &&
      this.latestData.ay !== undefined &&
      this.latestData.az !== undefined &&
      this.onDataCallback
    ) {
      this.onDataCallback({
        heartRate: this.latestData.heartRate,
        spo2: this.latestData.spo2,
        ax: this.latestData.ax,
        ay: this.latestData.ay,
        az: this.latestData.az,
        timestamp: Date.now(),
      });
    }
  }

  // Veri dinleyici kaydet
  onData(callback: (data: SensorData) => void): void {
    this.onDataCallback = callback;
  }

  // Bağlantıyı kes
  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
      console.log('Bağlantı kesildi');
    }
  }

  // Bağlantı durumu
  isConnected(): boolean {
    return this.device !== null;
  }

  // Temizlik
  destroy(): void {
    this.manager.destroy();
  }
}

export default new BLEService();
