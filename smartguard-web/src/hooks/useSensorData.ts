import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'

export interface Measurement {
  ts: number
  heartRate: number
  spo2: number
  ax: number
  ay: number
  az: number
  alarms: string[]
}

export interface Thresholds {
  minHR: number
  maxHR: number
  minSpO2: number
  immobileSec: number
  fallG: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function useSensorData() {
  const [data, setData] = useState<Measurement | null>(null)
  const [thresholds, setThresholds] = useState<Thresholds | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulatorRunning, setSimulatorRunning] = useState<boolean>(true)

  useEffect(() => {
    let socket: Socket | null = null

    // İlk veriyi ve eşikleri çek
    const fetchInitial = async () => {
      try {
        const [latestRes, thresholdsRes, simStatusRes] = await Promise.all([
          axios.get(`${API_URL}/api/latest`),
          axios.get(`${API_URL}/api/thresholds`),
          axios.get(`${API_URL}/api/simulator/status`),
        ])
        setData(latestRes.data?.data || null)
        setThresholds(thresholdsRes.data)
        setSimulatorRunning(Boolean(simStatusRes.data?.running))
        setLoading(false)
      } catch (err) {
        setError('Sunucuya bağlanılamıyor')
        setLoading(false)
      }
    }

    fetchInitial()

    // Socket.io bağlantısı (dayanıklı reconnect ayarları)
    socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socket.on('connect', () => {
      setError(null)
    })

    socket.on('sensor', (payload: { data: Measurement }) => {
      setData(payload.data)
    })

    socket.on('disconnect', () => {
      setError('Bağlantı kesildi')
    })

    // Simülatör durumunu periyodik kontrol et
    const statusTimer = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/simulator/status`)
        const running = Boolean(res.data?.running)
        setSimulatorRunning(running)
      } catch {
        // Hata olursa devam et, socket zaten hata gösteriyor
      }
    }, 2000)

    return () => {
      if (socket) {
        socket.disconnect()
      }
      clearInterval(statusTimer)
    }
  }, [])

  return { data, thresholds, loading, error, simulatorRunning }
}
