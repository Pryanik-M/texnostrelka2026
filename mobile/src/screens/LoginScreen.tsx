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

import { login } from '../api/client';
import { AUTH_TOKEN_KEY, RootStackParamList } from '../navigation/AppNavigator';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

interface LoginFormValues {
  email: string;
  password: string;
}

const loginSchema = yup.object({
  email: yup.string().required('Введите email').email('Неверный формат email'),
  password: yup.string().required('Введите пароль').min(6, 'Минимум 6 символов'),
});

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    resolver: yupResolver(loginSchema) as any,
    mode: 'onChange',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await login(values.email.trim(), values.password);
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.access);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Ошибка входа');
    }
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.badge}>Монитор подписок</Text>
          <Text style={styles.title}>Добро пожаловать</Text>
          <Text style={styles.subtitle}>Вход через API с JWT-токеном.</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Вход</Text>

            <Text style={styles.label}>Email</Text>
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
                  placeholderTextColor={Theme.colors.textMuted}
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
                  placeholderTextColor={Theme.colors.textMuted}
                  secureTextEntry
                />
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

            {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}

            <TouchableOpacity
              style={[styles.button, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit(onSubmit as any)}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>{isSubmitting ? 'Входим...' : 'Войти'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.secondaryButtonText}>
                Нет аккаунта?{' '}
                <Text style={styles.secondaryLink}>Зарегистрироваться</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 80 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Theme.colors.surfaceAlt,
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  title: { fontSize: 32, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 16 },
  subtitle: { marginTop: 8, color: Theme.colors.textSecondary, fontSize: 14 },
  card: {
    marginTop: 32,
    padding: 20,
    borderRadius: Theme.radii.xl,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadow.soft,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 16 },
  label: { fontSize: 13, color: Theme.colors.textSecondary, marginBottom: 4 },
  input: {
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.colors.textPrimary,
    fontSize: 15,
    backgroundColor: Theme.colors.surfaceAlt,
  },
  inputError: { borderColor: Theme.colors.danger },
  errorText: { marginTop: 4, fontSize: 12, color: Theme.colors.danger },
  button: {
    marginTop: 24,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    ...Theme.shadow.glow,
  },
  buttonText: { color: Theme.colors.background, fontSize: 16, fontWeight: '700' },
  secondaryButton: { marginTop: 12, alignItems: 'center' },
  secondaryButtonText: { color: Theme.colors.textSecondary, fontSize: 13 },
  secondaryLink: { color: Theme.colors.accent, fontWeight: '600' },
});
