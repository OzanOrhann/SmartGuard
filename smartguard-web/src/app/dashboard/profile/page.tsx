'use client'

import { useAuthStore } from '@/stores/authStore'
import { User, Mail, Shield } from 'lucide-react'

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)

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

      <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
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

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <Mail className="text-gray-600 mt-1" size={20} />
            <div>
              <div className="text-sm text-gray-500 mb-1">E-posta</div>
              <div className="font-medium text-gray-800">{user.username}@smartguard.com</div>
              <p className="text-xs text-gray-400 mt-1">(Örnek veri)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">Hesap Bilgileri</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Hesap ID: {user.id}</p>
            <p>• Kayıt Tarihi: 01 Ocak 2025</p>
            <p>• Son Giriş: Şu an</p>
          </div>
        </div>
      </div>
    </div>
  )
}
