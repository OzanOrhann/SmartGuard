'use client'

import { useAuthStore } from '@/stores/authStore'
import { User, Shield, Lock } from 'lucide-react'
import { useState } from 'react'

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const changePassword = useAuthStore((state) => state.changePassword)

  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!user) return null

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <User className="text-blue-600" />
          Profil
        </h2>
        <p className="text-gray-600">Hesap bilgileriniz</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-4xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{user.username}</h3>
            <p className="text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <User className="text-gray-600 mt-1" size={20} />
            <div>
              <div className="text-sm text-gray-500 mb-1">Kullanıcı Adı</div>
              <div className="font-medium text-gray-800">{user.username}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <Shield className="text-gray-600 mt-1" size={20} />
            <div>
              <div className="text-sm text-gray-500 mb-1">Rol</div>
              <div className="font-medium text-gray-800 capitalize">{user.role}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock size={18} /> Şifre Yenileme
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
              <input
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {message && (
              <div className={`${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'} border px-4 py-3 rounded-xl text-sm`}>
                {message.text}
              </div>
            )}

            <div>
              <button
                onClick={() => {
                  setMessage(null)
                  if (!oldPass || !newPass) {
                    setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun' })
                    return
                  }
                  if (newPass.length < 4) {
                    setMessage({ type: 'error', text: 'Yeni şifre en az 4 karakter olmalı' })
                    return
                  }
                  if (newPass !== confirmPass) {
                    setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' })
                    return
                  }
                  const ok = changePassword(oldPass, newPass)
                  if (ok) {
                    setOldPass('')
                    setNewPass('')
                    setConfirmPass('')
                    setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi' })
                  } else {
                    setMessage({ type: 'error', text: 'Mevcut şifre hatalı' })
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Şifreyi Güncelle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
