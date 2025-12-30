// ProfileScreen.tsx
import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert } from 'react-native';
import { AuthContext } from '../../App';

export default function ProfileScreen() {
  const { user, changePassword, logout } = useContext(AuthContext);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  function handleChangePassword() {
    const ok = changePassword(oldPass, newPass);
    if (!ok) {
      Alert.alert('Hata', 'Mevcut şifre yanlış.');
      return;
    }
    setOldPass('');
    setNewPass('');
    Alert.alert('Bilgi', 'Şifre güncellendi.');
  }

  function handleLogout() {
    logout();
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.info}>Giriş yapan kullanıcı: {user}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Şifre Değiştir</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Mevcut şifre</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={oldPass}
            onChangeText={setOldPass}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Yeni şifre</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPass}
            onChangeText={setNewPass}
          />
        </View>

        <View style={styles.button}>
          <Button title="Şifreyi Güncelle" onPress={handleChangePassword} />
        </View>
      </View>

      <View style={styles.logout}>
        <Button title="Çıkış Yap" color="#ff3b30" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    padding: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4
  },
  info: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 16
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  field: {
    marginBottom: 12
  },
  label: {
    fontSize: 13,
    color: '#6e6e73',
    marginBottom: 4
  },
  input: {
    backgroundColor: '#f9f9fb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea'
  },
  button: {
    marginTop: 8
  },
  logout: {
    marginTop: 24
  }
});
