import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as SecureStore from 'expo-secure-store';

import { register, registerVerify } from '../api/client';
import { AUTH_TOKEN_KEY, RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

interface RegisterFormValues {
  email: string;
  password: string;
  username: string;
}

const registerSchema = yup.object({
  email: yup.string().required('Введите email').email('Неверный формат email'),
  password: yup
    .string()
    .required('Введите пароль')
    .min(8, 'Минимум 8 символов')
    .matches(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
    .matches(/[0-9]/, 'Нужна хотя бы одна цифра'),
  username: yup.string().required('Введите username').min(3, 'Минимум 3 символа'),
});

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [code, setCode] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { email: '', password: '', username: '' },
    resolver: yupResolver(registerSchema) as any,
    mode: 'onChange',
  });

  const onRegister = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await register(values.email.trim(), values.username.trim(), values.password);
      setStep('verify');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Ошибка регистрации');
    }
  };

  const onVerify = async () => {
    setServerError(null);
    try {
      const response = await registerVerify(code.trim());
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.access);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Ошибка подтверждения');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.gradientBackground} />
      <View style={styles.content}>
        <Text style={styles.badge}>Регистрация</Text>
        <Text style={styles.title}>Создайте аккаунт</Text>
        <Text style={styles.subtitle}>
          Новый API использует код подтверждения на email.
        </Text>

        <View style={styles.card}>
          {step === 'register' ? (
            <>
              <Text style={styles.cardTitle}>Шаг 1: данные</Text>

              <Text style={styles.label}>Username</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.username && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="ivanov_ivan"
                    placeholderTextColor="#6b7280"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}

              <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="you@example.com"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

              <Text style={[styles.label, { marginTop: 16 }]}>Пароль</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Минимум 8 символов, 1 заглавная, 1 цифра"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

              <TouchableOpacity style={[styles.button, isSubmitting && { opacity: 0.7 }]} onPress={handleSubmit(onRegister as any)} disabled={isSubmitting}>
                <Text style={styles.buttonText}>{isSubmitting ? 'Отправляем...' : 'Получить код'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Шаг 2: код из email</Text>
              <Text style={styles.label}>Код подтверждения</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
              />
              <TouchableOpacity style={[styles.button, !code.trim() && { opacity: 0.7 }]} onPress={onVerify} disabled={!code.trim()}>
                <Text style={styles.buttonText}>Подтвердить и войти</Text>
              </TouchableOpacity>
            </>
          )}

          {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryButtonText}>Уже есть аккаунт? <Text style={{ color: '#38bdf8', fontWeight: '600' }}>Войти</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  gradientBackground: {
    position: 'absolute', top: -140, right: -80, width: 280, height: 280, borderRadius: 280,
    backgroundColor: '#1e293b', opacity: 0.9,
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 72 },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
    backgroundColor: '#0f172a', color: '#9ca3af', fontSize: 12,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#e5e7eb', marginTop: 16 },
  subtitle: { marginTop: 8, color: '#9ca3af', fontSize: 14 },
  card: {
    marginTop: 32, padding: 20, borderRadius: 24, backgroundColor: '#020617', borderWidth: 1,
    borderColor: '#111827', shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#e5e7eb', marginBottom: 16 },
  label: { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
  input: {
    borderRadius: 12, borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12,
    paddingVertical: 10, color: '#e5e7eb', fontSize: 15, backgroundColor: '#020617',
  },
  inputError: { borderColor: '#f97373' },
  errorText: { marginTop: 8, fontSize: 12, color: '#f97373' },
  button: {
    marginTop: 24, borderRadius: 14, backgroundColor: '#22c55e', paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#020617', fontSize: 16, fontWeight: '700' },
  secondaryButton: { marginTop: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#9ca3af', fontSize: 13 },
});
