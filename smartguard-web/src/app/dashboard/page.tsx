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
      new Notification('Akıllı Güvenlik İstemi Alarm', {
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Anlık Durum</h2>
          <p className="text-gray-600 flex items-center gap-2 text-sm">
            <Clock size={16} />
            Son güncelleme: {data ? new Date(data.ts).toLocaleTimeString('tr-TR') : 'Bekleniyor'}
          </p>
        </div>
        <button
          onClick={handleSimulatorToggle}
          disabled={simulatorLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow ${
            simulatorRunning
              ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
              : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
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
        <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2 text-lg">Alarm Tespit Edildi</h3>
              <ul className="text-red-800 text-sm space-y-1.5">
                {data.alarms.map((alarm, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    {translateAlarm(alarm)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Vital Signs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <Heart className="text-red-500" size={24} />
            </div>
            <span className="text-sm font-medium text-gray-500">Nabız</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">{data.heartRate}</div>
          <div className="text-gray-500 text-sm font-medium">bpm</div>
          {thresholds && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Normal aralık: <span className="font-semibold text-gray-700">{thresholds.minHR} - {thresholds.maxHR}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Wind className="text-blue-500" size={24} />
            </div>
            <span className="text-sm font-medium text-gray-500">Oksijen</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">{data.spo2}</div>
          <div className="text-gray-500 text-sm font-medium">% SpO₂</div>
          {thresholds && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Minimum: <span className="font-semibold text-gray-700">{thresholds.minSpO2}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Activity className="text-purple-500" size={24} />
            </div>
            <span className="text-sm font-medium text-gray-500">Hareket</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">{accelMag}</div>
          <div className="text-gray-500 text-sm font-medium">g (ivme)</div>
          {thresholds && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Düşme eşiği: <span className="font-semibold text-gray-700">{thresholds.fallG}g</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accelerometer Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">İvme Detayları</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">X Ekseni</div>
              <div className="text-2xl font-bold text-gray-900">{data.ax.toFixed(3)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">Y Ekseni</div>
              <div className="text-2xl font-bold text-gray-900">{data.ay.toFixed(3)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">Z Ekseni</div>
              <div className="text-2xl font-bold text-gray-900">{data.az.toFixed(3)}</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            {data.fallDetected && (
              <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700 text-sm font-medium">
                <AlertCircle size={18} />
                Düşme tespit edildi
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Aktivite Durumu</h3>
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-3">Hareketsizlik Süresi</div>
              <div className="text-4xl font-bold text-gray-900">
                {data.immobileTime || 0} <span className="text-xl text-gray-500 font-normal">saniye</span>
              </div>
              {thresholds && data.immobileTime > 10 && (
                <div className="mt-3 px-3 py-2 bg-orange-50 rounded-lg text-xs text-orange-700 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>Dikkat: Uzun süredir hareketsiz (Eşik: {thresholds.immobileSec}s)</span>
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-3">Hareket Durumu</div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                data.immobileTime < 5 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : data.immobileTime < 10
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {data.immobileTime < 5 
                  ? '✓ Aktif' 
                  : data.immobileTime < 10
                  ? '⚠ Düşük Aktivite'
                  : '⚠ Hareketsiz'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
