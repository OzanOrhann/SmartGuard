'use client'

import { useSensorData, Measurement } from '@/hooks/useSensorData'
import { useEffect, useState } from 'react'
import { Bell, AlertCircle, Clock, Mail, X } from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface AlarmItem {
  id: string
  ts: number
  kinds: string[]
  snapshot: Measurement
}

interface EmailModalState {
  open: boolean
  alarmId: string | null
  alarmType: string
  email: string
}

function translateAlarm(kind: string): string {
  const translations: Record<string, string> = {
    HR_LOW: 'Nabız düşük',
    HR_HIGH: 'Nabız yüksek',
    SPO2_LOW: 'Oksijen doygunluğu düşük',
    BP_HIGH: 'Kan basıncı yüksek',
    IMMOBILE: 'Uzun süre hareketsizlik (Bayılma/Felç şüphesi)',
    FALL: 'Düşme şüphesi',
    CRITICAL_HR: 'Kritik nabız seviyesi (Bayılma şüphesi)',
    MANUAL: 'Manuel yardım çağrısı',
  }
  return translations[kind] || kind
}

export default function AlarmsPage() {
  const { data } = useSensorData()
  const { user } = useAuthStore()
  const [history, setHistory] = useState<AlarmItem[]>([])
  const [emailModal, setEmailModal] = useState<EmailModalState>({
    open: false,
    alarmId: null,
    alarmType: '',
    email: '',
  })
  const [sending, setSending] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Sayfaya ilk geldiğinde backend'den çek, yoksa localStorage'dan yükle
  useEffect(() => {
    if (!user) return
    
    const loadHistory = async () => {
      try {
        // Önce backend'den dene
        const response = await axios.get(`${API_URL}/api/alarms/history/${user.id}`)
        if (response.data.alarms && response.data.alarms.length > 0) {
          setHistory(response.data.alarms)
          // Backend verilerini local'e de kaydet
          const storageKey = `smartguard-alarms-${user.id}`
          localStorage.setItem(storageKey, JSON.stringify(response.data.alarms))
        } else {
          // Backend boşsa localStorage'dan yükle
          const storageKey = `smartguard-alarms-${user.id}`
          const saved = localStorage.getItem(storageKey)
          if (saved) {
            const localData = JSON.parse(saved)
            setHistory(localData)
            // Local verileri backend'e sync et
            for (const alarm of localData) {
              await axios.post(`${API_URL}/api/alarms/save`, {
                userId: user.id,
                alarm
              })
            }
          } else {
            setHistory([])
          }
        }
      } catch (err) {
        console.error('Backend yüklenemedi, localStorage kullanılıyor:', err)
        // Backend erişilemezse localStorage'dan yükle
        const storageKey = `smartguard-alarms-${user.id}`
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          try {
            setHistory(JSON.parse(saved))
          } catch (parseErr) {
            console.error('Alarm geçmişi yüklenemedi:', parseErr)
            setHistory([])
          }
        } else {
          setHistory([])
        }
      } finally {
        setLoadingHistory(false)
      }
    }
    
    loadHistory()
  }, [user])

  useEffect(() => {
    if (!data || !data.alarms || data.alarms.length === 0 || !user) return

    setHistory((prev) => {
      // Aynı timestamp varsa tekrar ekleme
      if (prev.length > 0 && prev[0].ts === data.ts) return prev

      const entry: AlarmItem = {
        id: String(data.ts),
        ts: data.ts,
        kinds: data.alarms,
        snapshot: data,
      }

      const newHistory = [entry, ...prev].slice(0, 50)
      
      // Hem localStorage hem backend'e kaydet
      const storageKey = `smartguard-alarms-${user.id}`
      localStorage.setItem(storageKey, JSON.stringify(newHistory))
      
      // Backend'e async kaydet (başarısız olursa sorun değil)
      axios.post(`${API_URL}/api/alarms/save`, {
        userId: user.id,
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
        console.warn('Backend alarm kaydetme hatası (local kayıt yapıldı):', err)
      })
      
      return newHistory
    })
  }, [data?.ts, data?.alarms?.join(','), user])

  const handleSendEmail = (alarmItem: AlarmItem) => {
    setEmailModal({
      open: true,
      alarmId: alarmItem.id,
      alarmType: alarmItem.kinds.map(translateAlarm).join(', '),
      email: '',
    })
    setEmailError('')
  }

  const submitEmail = async () => {
    if (!emailModal.email.trim()) {
      setEmailError('E-mail adresi gerekli')
      return
    }
    if (!emailModal.email.includes('@')) {
      setEmailError('Geçerli bir e-mail adresi girin')
      return
    }
    setEmailError('')
    setSending(true)
    try {
      const selected = history.find(h => h.id === emailModal.alarmId)
      const response = await axios.post(`${API_URL}/api/notify/email`, {
        alarmType: emailModal.alarmType,
        reasons: selected ? selected.kinds.map(translateAlarm) : [emailModal.alarmType],
        severity: 'CRITICAL',
        timestamp: selected ? selected.ts : Date.now(),
        snapshot: selected ? selected.snapshot : undefined,
        email: emailModal.email,
      })
      if (response.data.success) {
        setEmailModal({ open: false, alarmId: null, alarmType: '', email: '' })
        alert('E-mail başarıyla gönderildi!')
      } else {
        setEmailError(response.data.error || 'E-mail gönderme hatası')
      }
    } catch (err: any) {
      setEmailError(err.response?.data?.error || 'E-mail gönderme hatası')
      console.error('Email error:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Bell className="text-blue-600" />
          Alarm Geçmişi
        </h2>
        <p className="text-gray-600">Son 50 alarm kaydı</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-8 rounded-lg text-center">
          <AlertCircle className="inline mb-2" size={48} />
          <p className="font-medium">Henüz alarm kaydı yok</p>
          <p className="text-sm mt-1">Sistem normal çalışıyor</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const time = new Date(item.ts).toLocaleString('tr-TR')
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock size={16} />
                    {time}
                  </div>
                  <div className="flex gap-2 items-center">
                    {item.kinds.map((kind, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                      >
                        {translateAlarm(kind)}
                      </span>
                    ))}
                    <button
                      onClick={() => handleSendEmail(item)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition"
                    >
                      <Mail size={14} />
                      E-mail
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Nabız:</span>{' '}
                    <span className={`font-semibold ${
                      item.snapshot?.heartRate < 40 || item.snapshot?.heartRate > 120 
                        ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {item.snapshot?.heartRate || 'N/A'} {item.snapshot?.heartRate ? 'bpm' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">SpO₂:</span>{' '}
                    <span className={`font-semibold ${
                      item.snapshot?.spo2 < 92 ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {item.snapshot?.spo2 || 'N/A'}{item.snapshot?.spo2 ? '%' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Kan Basıncı:</span>{' '}
                    <span className="font-semibold text-gray-800">
                      {item.snapshot?.sysBP || 'N/A'}/{item.snapshot?.diaBP || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">İvme:</span>{' '}
                    <span className={`font-semibold ${
                      item.snapshot?.ax !== undefined && 
                      Math.sqrt(item.snapshot.ax ** 2 + item.snapshot.ay ** 2 + item.snapshot.az ** 2) > 2
                        ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {item.snapshot?.ax !== undefined && item.snapshot?.ay !== undefined && item.snapshot?.az !== undefined
                        ? Math.sqrt(
                            item.snapshot.ax ** 2 + item.snapshot.ay ** 2 + item.snapshot.az ** 2
                          ).toFixed(2) + ' g'
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Alarm Nedeni Açıklaması */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 space-y-1">
                    {item.kinds.includes('FALL') && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">⚠</span>
                        <span><strong>Düşme:</strong> Ani yüksek ivme ({item.snapshot?.ax !== undefined ? Math.sqrt(item.snapshot.ax ** 2 + item.snapshot.ay ** 2 + item.snapshot.az ** 2).toFixed(2) : '?'}g) ve yere yakın pozisyon tespit edildi.</span>
                      </div>
                    )}
                    {item.kinds.includes('HR_LOW') && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">⚠</span>
                        <span><strong>Düşük Nabız:</strong> Nabız {item.snapshot?.heartRate}bpm (Normal: 40-120bpm)</span>
                      </div>
                    )}
                    {item.kinds.includes('HR_HIGH') && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">⚠</span>
                        <span><strong>Yüksek Nabız:</strong> Nabız {item.snapshot?.heartRate}bpm (Normal: 40-120bpm)</span>
                      </div>
                    )}
                    {item.kinds.includes('SPO2_LOW') && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">⚠</span>
                        <span><strong>Düşük Oksijen:</strong> SpO₂ %{item.snapshot?.spo2} (Minimum: %92)</span>
                      </div>
                    )}
                    {item.kinds.includes('IMMOBILE') && (
                      <div className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">⚠</span>
                        <span><strong>Hareketsizlik:</strong> Sensör değerlerinde değişim tespit edilmedi. Bayılma/felç şüphesi.</span>
                      </div>
                    )}
                    {item.kinds.includes('CRITICAL_HR') && (
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">⚠⚠</span>
                        <span><strong>KRİTİK:</strong> Çok düşük nabız ({item.snapshot?.heartRate}bpm) + hareketsizlik. Acil müdahale gerekebilir!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {emailModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Mail size={20} className="text-blue-600" />
                E-mail Gönder
              </h3>
              <button
                onClick={() =>
                  setEmailModal({ open: false, alarmId: null, alarmType: '', email: '' })
                }
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Alarm Türü:</p>
              <p className="font-medium text-gray-800">{emailModal.alarmType}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail Adresi
              </label>
              <input
                type="email"
                value={emailModal.email}
                onChange={(e) => {
                  setEmailModal({ ...emailModal, email: e.target.value })
                  setEmailError('')
                }}
                placeholder="example@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {emailError && <p className="text-red-600 text-sm mt-2">{emailError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setEmailModal({ open: false, alarmId: null, alarmType: '', email: '' })
                }
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={submitEmail}
                disabled={sending || !emailModal.email.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {sending ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
