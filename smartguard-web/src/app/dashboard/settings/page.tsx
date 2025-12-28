'use client'

import { useState, useEffect } from 'react'
import { useSensorData } from '@/hooks/useSensorData'
import { Settings as SettingsIcon, Save, AlertCircle } from 'lucide-react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function SettingsPage() {
  const { thresholds: initialThresholds } = useSensorData()
  const [minHR, setMinHR] = useState(40)
  const [maxHR, setMaxHR] = useState(120)
  const [minSpO2, setMinSpO2] = useState(92)
  const [immobileSec, setImmobileSec] = useState(600)
  const [fallG, setFallG] = useState(2.0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialThresholds) {
      setMinHR(initialThresholds.minHR)
      setMaxHR(initialThresholds.maxHR)
      setMinSpO2(initialThresholds.minSpO2)
      setImmobileSec(initialThresholds.immobileSec)
      setFallG(initialThresholds.fallG)
    }
  }, [initialThresholds])

  const handleSave = async () => {
    setSuccess(false)
    setError('')

    try {
      await axios.post(`${API_URL}/api/thresholds`, {
        minHR,
        maxHR,
        minSpO2,
        immobileSec,
        fallG,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Ayarlar kaydedilemedi')
    }
  }

  const handleReset = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/thresholds/reset`)
      const t = res.data
      setMinHR(t.minHR)
      setMaxHR(t.maxHR)
      setMinSpO2(t.minSpO2)
      setImmobileSec(t.immobileSec)
      setFallG(t.fallG)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Varsayılan ayarlara dönülemedi')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <SettingsIcon className="text-blue-600" />
          Alarm Eşikleri
        </h2>
        <p className="text-gray-600">Sistem alarm eşiklerini özelleştirin</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✓ Ayarlar başarıyla kaydedildi
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Nabız */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Nabız (bpm)
              </label>
              <input
                type="number"
                value={minHR}
                onChange={(e) => setMinHR(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maksimum Nabız (bpm)
              </label>
              <input
                type="number"
                value={maxHR}
                onChange={(e) => setMaxHR(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* SpO2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Oksijen Doygunluğu (%)
            </label>
            <input
              type="number"
              value={minSpO2}
              onChange={(e) => setMinSpO2(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Hareketsizlik */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hareketsizlik Süresi (saniye)
            </label>
            <input
              type="number"
              value={immobileSec}
              onChange={(e) => setImmobileSec(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bu süreden uzun hareketsiz kalınca alarm üretilir
            </p>
          </div>

          {/* Düşme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Düşme Eşiği (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={fallG}
              onChange={(e) => setFallG(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              İvme büyüklüğü bu değeri aştığında düşme alarmı üretilir
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            <Save size={18} />
            Kaydet
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
          >
            Varsayılana Dön
          </button>
        </div>
      </div>
    </div>
  )
}
