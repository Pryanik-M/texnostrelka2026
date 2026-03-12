import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Subscription } from '../types';
import { CATEGORY_LABELS } from '../constants/categories';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

const formatCurrency = (value: number) => `${value.toLocaleString('ru-RU')} ₽/мес`;

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const ImportEmailScreen: React.FC = () => {
  const navigation = useNavigation();
  const { importFromEmailText, fetchSubscriptions, isLoading } = useSubscriptionStore();

  const [text, setText] = useState('Списание 799 руб. Netflix 15.04.2026');
  const [preview, setPreview] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    setPreview(null);
    const result = await importFromEmailText(text);
    if (!result) {
      setError('Не удалось распознать подписку в тексте письма.');
    } else {
      setPreview(result);
    }
  };

  const handleAdd = async () => {
    await fetchSubscriptions();
    navigation.goBack();
  };

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Импорт из письма банка</Text>
          <Text style={styles.subtitle}>
            Вставьте текст SMS или письма от банка. Приложение создаст подписку в локальном списке.
          </Text>

          <Text style={styles.label}>Текст письма</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={text}
            onChangeText={setText}
            placeholder="Списание 799 руб. Netflix 15.04.2026"
            placeholderTextColor={Theme.colors.textMuted}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.primaryButton, (isLoading || !text.trim()) && { opacity: 0.7 }]}
            onPress={handleImport}
            disabled={isLoading || !text.trim()}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Импортируем...' : 'Импортировать'}
            </Text>
          </TouchableOpacity>

          {preview && (
            <>
              <Text style={[styles.label, { marginTop: 24 }]}>Предпросмотр подписки</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>{preview.name}</Text>
                <Text style={styles.previewSubtitle}>
                  {CATEGORY_LABELS[preview.category] ?? preview.category}
                </Text>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Стоимость</Text>
                  <Text style={styles.previewValue}>{formatCurrency(preview.price)}</Text>
                </View>

                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Следующее списание</Text>
                  <Text style={styles.previewValue}>{formatDate(preview.nextChargeDate)}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleAdd}>
                <Text style={styles.secondaryButtonText}>Добавить</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Theme.colors.textPrimary },
  subtitle: { marginTop: 4, color: Theme.colors.textSecondary, fontSize: 13, marginBottom: 16 },
  label: { marginTop: 12, marginBottom: 4, fontSize: 13, color: Theme.colors.textSecondary },
  textArea: {
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 140,
    color: Theme.colors.textPrimary,
    fontSize: 15,
    backgroundColor: Theme.colors.surfaceAlt,
  },
  errorText: { marginTop: 6, fontSize: 12, color: Theme.colors.danger },
  primaryButton: {
    marginTop: 20,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    ...Theme.shadow.glow,
  },
  primaryButtonText: { color: Theme.colors.background, fontSize: 16, fontWeight: '700' },
  previewCard: {
    marginTop: 8,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
  },
  previewTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.textPrimary },
  previewSubtitle: { marginTop: 4, fontSize: 13, color: Theme.colors.textSecondary },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  previewLabel: { fontSize: 13, color: Theme.colors.textSecondary },
  previewValue: { fontSize: 14, color: Theme.colors.textPrimary },
  secondaryButton: {
    marginTop: 16,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.accentStrong,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: { color: Theme.colors.accentStrong, fontSize: 14, fontWeight: '600' },
});
