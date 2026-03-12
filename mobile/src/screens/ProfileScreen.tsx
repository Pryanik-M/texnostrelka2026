import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';

import {
  AUTH_TOKEN_KEY,
  connectEmail,
  emailDisconnect,
  emailSync,
  getProfile,
  registerDevice,
  testPush,
} from '../api/client';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<{
    username: string;
    email: string;
    emailAccount?: string | null;
    candidatesCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [pushRegistering, setPushRegistering] = useState(false);
  const [password, setPassword] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProfile();
      setProfile({
        username: response.username,
        email: response.email,
        emailAccount: response.email_account ?? null,
        candidatesCount: response.candidates_count ?? 0,
      });
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleConnectEmail = async () => {
    if (!password.trim()) {
      Alert.alert('Нужен пароль приложения', 'Введите пароль приложения от почты.');
      return;
    }
    setConnecting(true);
    try {
      const response = await connectEmail(password.trim());
      if (response.error) {
        Alert.alert('Ошибка подключения', response.error);
      } else {
        Alert.alert('Почта подключена', response.message ?? 'Готово');
        setPassword('');
        await loadProfile();
      }
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось подключить почту');
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncEmail = async () => {
    setSyncing(true);
    try {
      const response = await emailSync();
      Alert.alert('Синхронизация запущена', response.message ?? 'Проверьте кандидатов через пару минут.');
      await loadProfile();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось запустить синхронизацию');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectEmail = async () => {
    setDisconnecting(true);
    try {
      const response = await emailDisconnect();
      Alert.alert('Почта отключена', response.message ?? 'Готово');
      await loadProfile();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось отключить почту');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRegisterPush = async () => {
    setPushRegistering(true);
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (settings.status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== 'granted') {
          Alert.alert('Разрешение нужно', 'Без разрешения уведомления не будут приходить.');
          setPushRegistering(false);
          return;
        }
      }

      const token = await Notifications.getDevicePushTokenAsync();
      await registerDevice(token.data);
      Alert.alert('Устройство зарегистрировано', 'Теперь можно отправлять тестовое уведомление.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось зарегистрировать устройство';
      const hint = message.includes('FirebaseApp')
        ? 'Push на Android требует настройки Firebase/FCM. Если пока не настраиваем — можно пропустить.'
        : message;
      Alert.alert('Ошибка', hint);
    } finally {
      setPushRegistering(false);
    }
  };

  const handleTestPush = async () => {
    try {
      await testPush();
      Alert.alert('Отправлено', 'Тестовое уведомление отправлено.');
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось отправить тест');
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  };

  const hasEmail = !!profile?.emailAccount;
  const candidatesCount = profile?.candidatesCount ?? 0;

  const candidatesLabel = useMemo(() => {
    if (!candidatesCount) return 'Кандидатов пока нет';
    return `Кандидаты (${candidatesCount})`;
  }, [candidatesCount]);

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Профиль</Text>
        <Text style={styles.subtitle}>
          Управляйте подключенной почтой, уведомлениями и кандидатами.
        </Text>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Theme.colors.accent} />
            <Text style={styles.loadingText}>Загружаем профиль...</Text>
          </View>
        )}

        {profile && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{profile.username}</Text>
            <Text style={styles.cardMeta}>Email для входа: {profile.email}</Text>
            <Text style={styles.cardMeta}>
              Почта для импорта: {profile.emailAccount ?? 'не подключена'}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Почта</Text>
          {!hasEmail ? (
            <>
              <Text style={styles.sectionHint}>
                Введите пароль приложения для подключения Gmail.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Пароль приложения"
                placeholderTextColor={Theme.colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={[styles.primaryButton, connecting && { opacity: 0.7 }]}
                onPress={handleConnectEmail}
                disabled={connecting}
              >
                <Text style={styles.primaryButtonText}>
                  {connecting ? 'Подключаем...' : 'Подключить почту'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sectionHint}>
                Запускайте синхронизацию и отключайте почту при необходимости.
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, syncing && { opacity: 0.7 }]}
                onPress={handleSyncEmail}
                disabled={syncing}
              >
                <Text style={styles.primaryButtonText}>
                  {syncing ? 'Синхронизируем...' : 'Синхронизировать почту'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, disconnecting && { opacity: 0.7 }]}
                onPress={handleDisconnectEmail}
                disabled={disconnecting}
              >
                <Text style={styles.secondaryButtonText}>
                  {disconnecting ? 'Отключаем...' : 'Отключить почту'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Кандидаты</Text>
          <Text style={styles.sectionHint}>Кандидаты приходят после анализа почты.</Text>
          <TouchableOpacity
            style={[styles.primaryButton, !candidatesCount && { opacity: 0.6 }]}
            onPress={() => navigation.getParent()?.navigate('Candidates' as never)}
            disabled={!candidatesCount}
          >
            <Text style={styles.primaryButtonText}>{candidatesLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Уведомления</Text>
          <Text style={styles.sectionHint}>
            Зарегистрируйте устройство для push и отправьте тест.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, pushRegistering && { opacity: 0.7 }]}
            onPress={handleRegisterPush}
            disabled={pushRegistering}
          >
            <Text style={styles.primaryButtonText}>
              {pushRegistering ? 'Регистрируем...' : 'Зарегистрировать устройство'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleTestPush}>
            <Text style={styles.secondaryButtonText}>Тестовое уведомление</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    color: Theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  card: {
    marginBottom: 14,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  input: {
    marginTop: 12,
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.colors.textPrimary,
    fontSize: 15,
    backgroundColor: Theme.colors.surfaceAlt,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Theme.colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.accent,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
