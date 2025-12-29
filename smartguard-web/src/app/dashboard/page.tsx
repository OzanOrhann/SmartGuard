'use client'

import { useSensorData } from '@/hooks/useSensorData'
import { Heart, Activity, Wind, AlertCircle, Clock, Play, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function translateAlarm(kind: string): string {
  const translations: Record<string, string> = {
    HR_LOW: 'Nabız düşük',
    HR_HIGH: 'Nabız yüksek',
    SPO2_LOW: 'Oksijen doygunluğu düşük',
    BP_HIGH: 'Kan basıncı yüksek',
    IMMOBILE: 'Uzun süre hareketsizlik',
    FALL: 'Düşme şüphesi',
    MANUAL: 'Manuel yardım çağrısı',
  }
  return translations[kind] || kind
}

export default function DashboardPage() {
  const { data, thresholds, loading, error, simulatorRunning } = useSensorData()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastAlarmTs = useRef<number | null>(null)
  const [simulatorLoading, setSimulatorLoading] = useState(false)

  // Alarm sesi çal (browser notification)
  useEffect(() => {
    if (!data || !data.alarms || data.alarms.length === 0) return
    if (lastAlarmTs.current === data.ts) return
    lastAlarmTs.current = data.ts

    // Browser notification (permission gerekli)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SmartGuard Alarm', {
        body: data.alarms.map(translateAlarm).join(', '),
        icon: '/favicon.ico',
      })
    }
  }, [data?.ts, data?.alarms])

  // Notification izni iste
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Simulator durumunu kontrol et
  const handleSimulatorToggle = async () => {
    setSimulatorLoading(true)
    try {
      const endpoint = simulatorRunning ? '/api/simulator/stop' : '/api/simulator/start'
      await axios.post(`${API_URL}${endpoint}`)
    } catch (err) {
      console.error('Simulator kontrol hatası:', err)
    } finally {
      setSimulatorLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Veri bekleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <AlertCircle className="inline mr-2" />
          {error}
        </div>
      </div>
    )
  }

  const lastTime = data ? new Date(data.ts).toLocaleTimeString('tr-TR') : 'Bekleniyor'
  const hasAlarms = data.alarms && data.alarms.length > 0
  const accelMag = Math.sqrt(data.ax ** 2 + data.ay ** 2 + data.az ** 2).toFixed(2)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Anlık Durum</h2>
          <p className="text-gray-600 flex items-center gap-2">
            <Clock size={16} />
            Son güncelleme: {data ? new Date(data.ts).toLocaleTimeString('tr-TR') : 'Bekleniyor'}
          </p>
        </div>
        <button
          onClick={handleSimulatorToggle}
          disabled={simulatorLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            simulatorRunning
              ? 'bg-red-100 hover:bg-red-200 text-red-700'
              : 'bg-green-100 hover:bg-green-200 text-green-700'
          } ${simulatorLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {simulatorRunning ? (
            <>
              <Square size={18} />
              Durdur
            </>
          ) : (
            <>
              <Play size={18} />
              Başlat
            </>
          )}
        </button>
      </div>

      {/* Alarm Banner */}
      {hasAlarms && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5" size={24} />
            <div>
              <h3 className="font-bold text-red-800 mb-1">ALARM</h3>
              <ul className="text-red-700 text-sm space-y-1">
                {data.alarms.map((alarm, idx) => (
                  <li key={idx}>• {translateAlarm(alarm)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Vital Signs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <Heart className="text-red-500" size={32} />
            <span className="text-sm text-gray-500">Nabız</span>
          </div>
          <div className="text-4xl font-bold text-gray-800 mb-1">{data.heartRate}</div>
          <div className="text-gray-500 text-sm">bpm</div>
          {thresholds && (
            <div className="mt-3 text-xs text-gray-400">
              Normal: {thresholds.minHR} - {thresholds.maxHR}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <Wind className="text-blue-500" size={32} />
            <span className="text-sm text-gray-500">Oksijen</span>
          </div>
          <div className="text-4xl font-bold text-gray-800 mb-1">{data.spo2}</div>
          <div className="text-gray-500 text-sm">% SpO₂</div>
          {thresholds && (
            <div className="mt-3 text-xs text-gray-400">
              Minimum: {thresholds.minSpO2}%
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <Activity className="text-purple-500" size={32} />
            <span className="text-sm text-gray-500">Hareket</span>
          </div>
          <div className="text-4xl font-bold text-gray-800 mb-1">{accelMag}</div>
          <div className="text-gray-500 text-sm">g (ivme)</div>
          {thresholds && (
            <div className="mt-3 text-xs text-gray-400">
              Düşme eşiği: {thresholds.fallG}g
            </div>
          )}
        </div>
      </div>

      {/* Accelerometer Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">İvme Detayları</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">X Ekseni</div>
              <div className="text-2xl font-bold text-gray-800">{data.ax.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Y Ekseni</div>
              <div className="text-2xl font-bold text-gray-800">{data.ay.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Z Ekseni</div>
              <div className="text-2xl font-bold text-gray-800">{data.az.toFixed(3)}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Toplam İvme:</span>
              <span className="text-xl font-bold text-purple-600">{accelMag} g</span>
            </div>
            {data.fallDetected && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm font-medium">
                <AlertCircle size={16} />
                Düşme tespit edildi!
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktivite Durumu</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Hareketsizlik Süresi</div>
              <div className="text-3xl font-bold text-gray-800">
                {data.immobileTime || 0} <span className="text-lg text-gray-500">saniye</span>
              </div>
              {thresholds && data.immobileTime > 10 && (
                <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  Dikkat: Uzun süredir hareketsiz ({thresholds.immobileSec}s eşiği)
                </div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500 mb-2">Hareket Durumu</div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                data.immobileTime < 5 
                  ? 'bg-green-100 text-green-700' 
                  : data.immobileTime < 10
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {data.immobileTime < 5 
                  ? '✓ Aktif' 
                  : data.immobileTime < 10
                  ? '⚠ Düşük aktivite'
                  : '⚠ Hareketsiz'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
