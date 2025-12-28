import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  role: 'user' | 'admin'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  register: (username: string, password: string) => boolean
  logout: () => void
}

// Basit mock auth (demo için) - başlangıçta boş, kayıt olarak kullanıcı oluşturulur
// localStorage'dan yükle veya boş diziye başla
let mockUsers: Array<{
  id: string
  username: string
  password: string
  role: 'user' | 'admin'
}> = typeof window !== 'undefined' 
  ? JSON.parse(localStorage.getItem('smartguard-users') || '[]')
  : []

// mockUsers değiştiğinde localStorage'a kaydet
const saveMockUsers = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('smartguard-users', JSON.stringify(mockUsers))
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (username: string, password: string) => {
        const uname = username.trim().toLowerCase()
        const found = mockUsers.find(
          (u) => u.username.toLowerCase() === uname && u.password === password
        )
        if (found) {
          set({
            user: { id: found.id, username: found.username, role: found.role },
            isAuthenticated: true,
          })
          return true
        }
        return false
      },
      register: (username: string, password: string) => {
        const uname = username.trim()
        if (!uname || !password) return false
        // Kullanıcı zaten var mı kontrol et (case-insensitive)
        const exists = mockUsers.find((u) => u.username.toLowerCase() === uname.toLowerCase())
        if (exists) return false
        
        // Yeni kullanıcı ekle
        const newUser = {
          id: String(mockUsers.length + 1),
          username: uname,
          password,
          role: 'user' as const,
        }
        mockUsers.push(newUser)
        saveMockUsers() // localStorage'a kaydet
        
        // Otomatik giriş yap
        set({
          user: { id: newUser.id, username: newUser.username, role: newUser.role },
          isAuthenticated: true,
        })
        return true
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'smartguard-auth',
    }
  )
)
