import React from 'react';
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

import { AUTH_TOKEN_KEY, RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

interface RegisterFormValues {
  email: string;
  password: string;
  fullName: string;
}

const registerSchema = yup.object({
  email: yup
    .string()
    .required('Введите email')
    .email('Неверный формат email'),
  password: yup
    .string()
    .required('Введите пароль')
    .min(6, 'Минимум 6 символов'),
  fullName: yup
    .string()
    .required('Введите ФИО')
    .min(3, 'Слишком короткое имя'),
});

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'fake-jwt-123');

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch {
      // здесь можно показать тост/алерт об ошибке
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.gradientBackground} />
      <View style={styles.content}>
        <Text style={styles.badge}>Регистрация</Text>
        <Text style={styles.title}>Создайте аккаунт</Text>
        <Text style={styles.subtitle}>
          Личный кабинет поможет контролировать подписки и избегать неожиданных списаний.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Заполните данные</Text>

          <Text style={styles.label}>ФИО</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Иванов Иван Иванович"
                placeholderTextColor="#6b7280"
              />
            )}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName.message}</Text>
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur] } }) => (
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
                placeholder="Минимум 6 символов"
                placeholderTextColor="#6b7280"
                secureTextEntry
              />
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>
              Уже есть аккаунт?{' '}
              <Text style={{ color: '#38bdf8', fontWeight: '600' }}>Войти</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  gradientBackground: {
    position: 'absolute',
    top: -140,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: '#1e293b',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0f172a',
    color: '#9ca3af',
    fontSize: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#e5e7eb',
    marginTop: 16,
  },
  subtitle: {
    marginTop: 8,
    color: '#9ca3af',
    fontSize: 14,
  },
  card: {
    marginTop: 32,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 15,
    backgroundColor: '#020617',
  },
  inputError: {
    borderColor: '#f97373',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#f97373',
  },
  button: {
    marginTop: 24,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#9ca3af',
    fontSize: 13,
  },
});

