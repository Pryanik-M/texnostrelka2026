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
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { login, saveTokens } from '../api/client';
import { RootStackParamList } from '../navigation/types';
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
      console.log('[Login] submit', values.email.trim());
      const response = await login(values.email.trim(), values.password);
      await saveTokens(response.access, response.refresh);
      console.log('[Login] success');
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      console.log('[Login] error', error);
      setServerError(error instanceof Error ? error.message : 'Ошибка входа');
    }
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
      >
        <View style={styles.content}>
          <Text style={styles.badge}>BANANOSUBS</Text>
          <Text style={styles.title}>Вход</Text>
          <Text style={styles.subtitle}>Введите email и пароль.</Text>

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
                    placeholder="Email"
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
                <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.passwordInput}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Пароль"
                    placeholderTextColor={Theme.colors.textMuted}
                    secureTextEntry={!isPasswordVisible}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible((prev) => !prev)}>
                    <Ionicons
                      name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Theme.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
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

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Забыли пароль?</Text>
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
  title: { fontSize: 32, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 16, fontFamily: 'Benzin-Medium' },
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
  cardTitle: { fontSize: 18, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 16, fontFamily: 'Benzin-Medium' },
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
  passwordContainer: {
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Theme.colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    color: Theme.colors.textPrimary,
    fontSize: 15,
  },
  errorText: { marginTop: 4, fontSize: 12, color: Theme.colors.danger },
  button: {
    marginTop: 24,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    ...Theme.shadow.glow,
  },
  buttonText: { color: Theme.colors.textOnAccent, fontSize: 16, fontWeight: '700' },
  secondaryButton: { marginTop: 12, alignItems: 'center' },
  secondaryButtonText: { color: Theme.colors.textSecondary, fontSize: 13 },
  secondaryLink: { color: Theme.colors.accent, fontWeight: '600' },
  forgotButton: { marginTop: 10, alignItems: 'center' },
  forgotText: { color: Theme.colors.accentStrong, fontSize: 13, fontWeight: '600' },
});




