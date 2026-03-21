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

import { forgotPassword, forgotVerify, resetPassword } from '../api/client';
import { RootStackParamList } from '../navigation/types';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'code' | 'reset';

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmail = async () => {
    setServerError(null);
    if (!email.trim()) {
      setServerError('Введите email');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep('code');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setServerError(null);
    if (!code.trim()) {
      setServerError('Введите код');
      return;
    }
    setLoading(true);
    try {
      await forgotVerify(code.trim());
      setStep('reset');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Не удалось проверить код');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setServerError(null);
    if (!password || !confirmPassword) {
      setServerError('Введите новый пароль');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(password, confirmPassword);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Не удалось обновить пароль');
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Восстановление пароля</Text>
          <Text style={styles.subtitle}>Отправим код и поможем задать новый пароль.</Text>

          <View style={styles.card}>
            {step === 'email' && (
              <>
                <Text style={styles.cardTitle}>Шаг 1: email</Text>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={Theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.7 }]}
                  onPress={handleEmail}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Отправляем...' : 'Отправить код'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'code' && (
              <>
                <Text style={styles.cardTitle}>Шаг 2: код</Text>
                <Text style={styles.label}>Код из письма</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="Введите код"
                  placeholderTextColor={Theme.colors.textMuted}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.7 }]}
                  onPress={handleVerify}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Проверяем...' : 'Подтвердить код'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'reset' && (
              <>
                <Text style={styles.cardTitle}>Шаг 3: новый пароль</Text>
                <Text style={styles.label}>Новый пароль</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Новый пароль"
                  placeholderTextColor={Theme.colors.textMuted}
                  secureTextEntry
                />
                <Text style={[styles.label, { marginTop: 12 }]}>Повтор пароля</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Повторите пароль"
                  placeholderTextColor={Theme.colors.textMuted}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.7 }]}
                  onPress={handleReset}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Сохраняем...' : 'Сохранить пароль'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>Вернуться ко входу</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 72 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Theme.colors.surfaceAlt,
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 16,
    fontFamily: 'Benzin-Medium',
  },
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 16,
    fontFamily: 'Benzin-Medium',
  },
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
  errorText: { marginTop: 8, fontSize: 12, color: Theme.colors.danger },
  button: {
    marginTop: 20,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    ...Theme.shadow.glow,
  },
  buttonText: { color: Theme.colors.textOnAccent, fontSize: 16, fontWeight: '700' },
  secondaryButton: { marginTop: 12, alignItems: 'center' },
  secondaryButtonText: { color: Theme.colors.textSecondary, fontSize: 13 },
});
