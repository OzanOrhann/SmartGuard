// App.tsx
import React, { useEffect, useState, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { API_BASE } from './src/hooks/useSensorData';

import  StatusScreen  from './src/screens/StatusScreen';
import AlarmsScreen from './src/screens/AlarmsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BluetoothScreen from './src/screens/BluetoothScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

type Credentials = {
  username: string;
  password: string;
} | null;

type StoredUser = { username: string; password: string };

type AuthContextType = {
  user: string | null;
  register: (username: string, password: string) => void;
  login: (username: string, password: string) => boolean;
  changePassword: (oldPass: string, newPass: string) => boolean;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  register: () => {},
  login: () => false,
  changePassword: () => false,
  logout: () => {}
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007aff',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { height: 60, paddingBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'pulse-outline';

          if (route.name === 'Durum') icon = 'pulse-outline';
          else if (route.name === 'Bluetooth') icon = 'bluetooth-outline';
          else if (route.name === 'Alarmlar') icon = 'alert-circle-outline';
          else if (route.name === 'Ayarlar') icon = 'settings-outline';
          else if (route.name === 'Profil') icon = 'person-circle-outline';

          return <Ionicons name={icon} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Durum" component={StatusScreen} />
      <Tab.Screen name="Bluetooth" component={BluetoothScreen} />
      <Tab.Screen name="Alarmlar" component={AlarmsScreen} />
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Akıllı Güvenlik İstemi Giriş' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Kayıt Ol' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [creds, setCreds] = useState<Credentials>(null);
  const [user, setUser] = useState<string | null>(null);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Push bildirimi izni + token kaydı (Expo)
  useEffect(() => {
    (async () => {
      try {
        const perm = await Notifications.requestPermissionsAsync();
        if (!perm.granted) return;
        const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId: '77c402f6-9d44-4750-ad01-156e0f421dbf' });
        const token = tokenResponse.data;
        await AsyncStorage.setItem('sg-push-token', token);
        // Kullanıcı kimliği varsa backend'e bildir
        const userId = await AsyncStorage.getItem('smartguard-user-id');
        if (userId) {
          fetch(`${API_BASE}/api/notify/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokens: [token], title: 'Push kaydı', body: 'Token alındı', data: { userId } })
          }).catch(() => {});
        }
      } catch (err) {
        console.log('Push token alınamadı:', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('sg-users');
        if (raw) {
          setUsers(JSON.parse(raw));
        }
        const lastUser = await AsyncStorage.getItem('sg-last-user');
        if (lastUser) {
          setUser(lastUser);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const saveUsers = async (list: StoredUser[]) => {
    setUsers(list);
    await AsyncStorage.setItem('sg-users', JSON.stringify(list));
  };

  const auth: AuthContextType = {
    user,
    register: async (username, password) => {
      const uname = username.trim();
      if (!uname || !password) return;
      const exists = users.find(u => u.username.toLowerCase() === uname.toLowerCase());
      if (exists) {
        const updated = users.map(u => u.username.toLowerCase() === uname.toLowerCase() ? { username: uname, password } : u);
        saveUsers(updated);
      } else {
        saveUsers([...users, { username: uname, password }]);
      }
      setCreds({ username: uname, password });
      setUser(uname);
      await AsyncStorage.setItem('sg-last-user', uname);
      const userId = uname.toLowerCase().replace(/[^a-z0-9]/g, '');
      await AsyncStorage.setItem('smartguard-user-id', userId);
    },
    login: (username, password) => {
      const uname = username.trim();
      const found = users.find(u => u.username.toLowerCase() === uname.toLowerCase() && u.password === password);
      if (!found) return false;
      setCreds({ username: found.username, password: found.password });
      setUser(found.username);
      AsyncStorage.setItem('sg-last-user', found.username);
      const userId = found.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      AsyncStorage.setItem('smartguard-user-id', userId);
      return true;
    },
    changePassword: (oldPass, newPass) => {
      if (!creds) return false;
      if (creds.password !== oldPass) return false;
      setCreds({ username: creds.username, password: newPass });
      const updated = users.map(u => u.username.toLowerCase() === creds.username.toLowerCase() ? { username: u.username, password: newPass } : u);
      saveUsers(updated);
      return true;
    },
    logout: () => {
      setUser(null);
      AsyncStorage.removeItem('smartguard-user-id');
      AsyncStorage.removeItem('sg-last-user');
    }
  };

  return (
    <AuthContext.Provider value={auth}>
      <NavigationContainer>
        {loaded && (user ? <MainTabs /> : <AuthStack />)}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
