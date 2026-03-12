import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { CATEGORY_LABELS } from '../constants/categories';
import { BillingPeriod } from '../types';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

type DetailRouteProp = RouteProp<RootStackParamList, 'SubscriptionDetail'>;

const periodMap: Record<BillingPeriod, string> = {
  day: 'день',
  week: 'нед',
  month: 'мес',
  year: 'год',
};

const formatCurrency = (value: number, period: BillingPeriod) => {
  const base = value.toLocaleString('ru-RU');
  return `${base} ₽/${periodMap[period]}`;
};

const formatDate = (isoDate: string | undefined) => {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTimeShort = (isoDate?: string) => {
  if (!isoDate) return 'ещё не использовалась';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const SubscriptionDetailScreen: React.FC = () => {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation();
  const { subscriptions, update, remove } = useSubscriptionStore();

  const subscription = useMemo(
    () => subscriptions.find((s) => s.id === route.params?.subscriptionId),
    [subscriptions, route.params],
  );

  if (!subscription) {
    return (
      <ScreenBackground>
        <View style={styles.missingContainer}>
          <Text style={styles.missingTitle}>Подписка не найдена</Text>
          <Text style={styles.missingText}>
            Возможно, она была удалена или ещё не загружена.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Вернуться назад</Text>
          </TouchableOpacity>
        </View>
      </ScreenBackground>
    );
  }

  const categoryLabel = CATEGORY_LABELS[subscription.category] ?? subscription.category;

  const handleCancel = () => {
    const template = `Тема: Отмена подписки ${subscription.name}\n\nЗдравствуйте!\n\nПрошу отменить мою подписку на сервис «${subscription.name}».\n\nДанные подписки:\n- Сервис: ${subscription.name}\n- Текущий тариф: ${formatCurrency(subscription.price, subscription.billingPeriod)}\n- Дата следующего списания: ${formatDate(subscription.nextChargeDate)}`;

    Alert.alert('Шаблон письма в поддержку', template, [
      {
        text: 'Открыть сайт сервиса',
        onPress: () => {
          if (subscription.url) {
            Linking.openURL(subscription.url);
          } else {
            Alert.alert('Ссылка не указана', 'Для этой подписки нет сохраненной ссылки.');
          }
        },
      },
      { text: 'Закрыть', style: 'cancel' },
    ]);
  };

  const handleMarkUsage = async () => {
    const nextCount = (subscription.usageCount ?? 0) + 1;
    const lastUsedAt = new Date().toISOString();
    await update(subscription.id, { usageCount: nextCount, lastUsedAt });
  };

  const handleDelete = async () => {
    Alert.alert('Удалить подписку', `Удалить "${subscription.name}"?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await remove(subscription.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScreenBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{subscription.name}</Text>
        <Text style={styles.category}>{categoryLabel}</Text>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Стоимость</Text>
            <Text style={styles.valueStrong}>
              {formatCurrency(subscription.price, subscription.billingPeriod)}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Следующее списание</Text>
            <Text style={styles.value}>{formatDate(subscription.nextChargeDate)}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Статус</Text>
            <Text
              style={[
                styles.value,
                subscription.isActive ? styles.badgeActive : styles.badgeInactive,
              ]}
            >
              {subscription.isActive ? 'Активна' : 'Отключена'}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Создана</Text>
            <Text style={styles.value}>{formatDate(subscription.createdAt)}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Обновлена</Text>
            <Text style={styles.value}>{formatDate(subscription.updatedAt)}</Text>
          </View>
        </View>

        {subscription.url ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Сервис</Text>
            <TouchableOpacity onPress={() => Linking.openURL(subscription.url!)} style={styles.linkButton}>
              <Text style={styles.linkText}>{subscription.url}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {subscription.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Заметки</Text>
            <Text style={styles.notesText}>{subscription.notes}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Использование</Text>
          <Text style={styles.value}>
            Использована <Text style={styles.valueStrong}>{subscription.usageCount ?? 0} раз</Text>
          </Text>
          <Text style={[styles.value, { marginTop: 4 }]}>
            Последний раз: {formatDateTimeShort(subscription.lastUsedAt)}
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleMarkUsage}>
          <Text style={styles.primaryButtonText}>Отметить использование</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
          <Text style={styles.secondaryButtonText}>Отменить подписку</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Удалить подписку</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  category: {
    marginTop: 4,
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  card: {
    marginTop: 18,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  valueStrong: {
    fontSize: 15,
    color: Theme.colors.accent,
    fontWeight: '700',
  },
  badgeActive: {
    color: Theme.colors.accentStrong,
    fontWeight: '600',
  },
  badgeInactive: {
    color: Theme.colors.danger,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  linkButton: {
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 14,
    color: Theme.colors.accent,
    textDecorationLine: 'underline',
  },
  primaryButton: {
    marginTop: 24,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    ...Theme.shadow.glow,
  },
  primaryButtonText: {
    color: Theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: '#b91c1c',
    paddingVertical: 11,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: Theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  missingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  missingText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
});
