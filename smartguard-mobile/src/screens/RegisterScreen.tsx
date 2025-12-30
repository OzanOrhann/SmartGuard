// RegisterScreen.tsx
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../../App';

type Props = NativeStackScreenProps<any, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  function handleRegister() {
    if (!username || !password) {
      Alert.alert('Uyarı', 'Kullanıcı adı ve şifre zorunlu.');
      return;
    }
    if (password !== password2) {
      Alert.alert('Uyarı', 'Şifreler uyuşmuyor.');
      return;
    }
    register(username.trim(), password);
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Kayıt Ol</Text>

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

      <View style={styles.field}>
        <Text style={styles.label}>Şifre (tekrar)</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password2}
          onChangeText={setPassword2}
        />
      </View>

      <View style={styles.button}>
        <Button title="Kayıt Ol" onPress={handleRegister} />
      </View>

      <View style={styles.button}>
        <Button title="Geri dön" onPress={() => navigation.goBack()} />
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
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24
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
