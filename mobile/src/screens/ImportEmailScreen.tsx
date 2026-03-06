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

import { importFromEmail } from '../api/mockApi';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Subscription } from '../types';
import { CATEGORY_LABELS } from '../constants/categories';

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
  const { fetchSubscriptions } = useSubscriptionStore();

  const [text, setText] = useState(
    'Списание 799 руб. Netflix 15.04.2026',
  );
  const [preview, setPreview] = useState<Subscription | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setIsParsing(true);
    setError(null);
    setPreview(null);
    try {
      const result = await importFromEmail(text);
      if (!result) {
        setError('Не удалось распознать подписку в тексте письма.');
      } else {
        setPreview(result);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Произошла ошибка при разборе письма.',
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleAdd = async () => {
    await fetchSubscriptions();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Импорт из письма банка</Text>
        <Text style={styles.subtitle}>
          Вставьте текст SMS или письма от банка. Мы попробуем автоматически
          создать подписку.
        </Text>

        <Text style={styles.label}>Текст письма</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
          placeholder="Вставь текст письма от банка, например:&#10;Списание 799 руб. Netflix 15.04.2026"
          placeholderTextColor="#6b7280"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryButton, isParsing && { opacity: 0.7 }]}
          onPress={handleImport}
          disabled={isParsing || !text.trim()}
        >
          <Text style={styles.primaryButtonText}>
            {isParsing ? 'Импортируем...' : 'Импортировать'}
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
                <Text style={styles.previewValue}>
                  {formatDate(preview.nextChargeDate)}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleAdd}>
              <Text style={styles.secondaryButtonText}>Добавить</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  subtitle: {
    marginTop: 4,
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    color: '#9ca3af',
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 140,
    color: '#e5e7eb',
    fontSize: 15,
    backgroundColor: '#020617',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#f97373',
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '700',
  },
  previewCard: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
    padding: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  previewSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  previewValue: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  secondaryButton: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
});

