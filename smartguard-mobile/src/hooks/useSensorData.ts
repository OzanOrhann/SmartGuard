import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config';

// Backend URL (config.ts dosyasından geliyor)
export const API_BASE = BACKEND_URL;

export type Thresholds = {
  minHR: number;
  maxHR: number;
  minSpO2: number;
  immobileSec: number;
  fallG: number;
};

export type Measurement = {
  ts: number;
  heartRate: number;
  spo2: number;
  sysBP: number;
  diaBP: number;
  ax: number;
  ay: number;
  az: number;
  alarms: string[];
  immobileTime?: number;
  fallDetected?: boolean;
  totalG?: number;
};

type HookState = {
  data: Measurement | null;
  thresholds: Thresholds;
  loading: boolean;
  error?: string;
};

const defaultThresholds: Thresholds = {
  minHR: 40,
  maxHR: 120,
  minSpO2: 92,
  immobileSec: 600,
  fallG: 2.0
};

export function useSensorData(): HookState {
  const [state, setState] = useState<HookState>({
    data: null,
    thresholds: defaultThresholds,
    loading: true
  });

  useEffect(() => {
    const socket: Socket = io(API_BASE); // Backend URL

    socket.on('connect', () => {
      console.log('Connected to backend');
      setState(s => ({ ...s, loading: false }));
    });

    socket.on('sensor', (data: { data: Measurement }) => {
      setState(s => ({ ...s, data: data.data }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from backend');
    });

    // İlk veriyi çek
    fetch(`${API_BASE}/api/latest`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setState(s => ({ ...s, data: data.data, loading: false }));
        }
      })
      .catch(err => {
        setState(s => ({ ...s, error: err.message, loading: false }));
      });

    // Thresholds çek
    fetch(`${API_BASE}/api/thresholds`)
      .then(res => res.json())
      .then(thresholds => {
        setState(s => ({ ...s, thresholds }));
      })
      .catch(err => {
        console.log('Thresholds fetch error:', err);
      });

    return () => {
      socket.disconnect();
    };
  }, []);

  return state;
}
