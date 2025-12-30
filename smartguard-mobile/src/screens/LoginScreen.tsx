// LoginScreen.tsx
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../../App';

type Props = NativeStackScreenProps<any, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    const ok = login(username.trim(), password);
    if (!ok) {
      Alert.alert('Giriş başarısız', 'Kullanıcı adı veya şifre hatalı.');
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Akıllı Güvenlik İstemi</Text>
      <Text style={styles.subtitle}>Yaşlı / riskli birey güvenli izleme</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Kullanıcı adı</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.button}>
        <Button title="Giriş Yap" onPress={handleLogin} />
      </View>

      <View style={styles.button}>
        <Button
          title="Hesabın yok mu? Kayıt ol"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f2f2f7'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    color: '#8e8e93'
  },
  field: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
    color: '#6e6e73'
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e5ea'
  },
  button: {
    marginTop: 12
  }
});
