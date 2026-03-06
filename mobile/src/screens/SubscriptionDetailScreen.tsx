import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { CATEGORY_LABELS } from '../constants/categories';

type DetailRouteProp = RouteProp<RootStackParamList, 'SubscriptionDetail'>;

const formatCurrency = (value: number, period: 'month' | 'year') => {
  const base = value.toLocaleString('ru-RU');
  return `${base} ₽/${period === 'month' ? 'мес' : 'год'}`;
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
  const { subscriptions, update } = useSubscriptionStore();

  const subscription = useMemo(
    () => subscriptions.find((s) => s.id === route.params?.subscriptionId),
    [subscriptions, route.params],
  );

  if (!subscription) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingTitle}>Подписка не найдена</Text>
        <Text style={styles.missingText}>
          Возможно, она была удалена или ещё не загружена.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Вернуться назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryLabel = CATEGORY_LABELS[subscription.category] ?? subscription.category;

  const handleCancel = () => {
    const template = `Тема: Отмена подписки ${subscription.name}

Здравствуйте!

Прошу отменить мою подписку на сервис «${subscription.name}» и прекратить дальнейшие списания со счёта.

Данные подписки:
- Сервис: ${subscription.name}
- Текущий тариф: ${formatCurrency(subscription.price, subscription.billingPeriod)}
- Дата следующего списания: ${formatDate(subscription.nextChargeDate)}

Если необходимы дополнительные данные для идентификации аккаунта, сообщите, пожалуйста.

С уважением,
[Ваше имя]`;

    Alert.alert(
      'Шаблон письма в поддержку',
      template,
      [
        {
          text: 'Открыть сайт сервиса',
          onPress: () => {
            if (subscription.url) {
              Linking.openURL(subscription.url);
            } else {
              Alert.alert(
                'Ссылка не указана',
                'Для этой подписки нет сохранённой ссылки. Добавьте её в карточке редактирования.',
              );
            }
          },
        },
        { text: 'Закрыть', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  const handleMarkUsage = async () => {
    const nextCount = (subscription.usageCount ?? 0) + 1;
    const lastUsedAt = new Date().toISOString();
    await update(subscription.id, { usageCount: nextCount, lastUsedAt });
  };

  return (
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
          <Text style={[styles.value, subscription.isActive ? styles.badgeActive : styles.badgeInactive]}>
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

      {subscription.url && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Сервис</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(subscription.url!)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>{subscription.url}</Text>
          </TouchableOpacity>
        </View>
      )}

      {subscription.notes ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Заметки</Text>
          <Text style={styles.notesText}>{subscription.notes}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Использование</Text>
        <Text style={styles.value}>
          Использована{' '}
          <Text style={styles.valueStrong}>
            {subscription.usageCount ?? 0} раз
          </Text>
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
    </ScrollView>
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
    fontSize: 24,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  category: {
    marginTop: 4,
    color: '#9ca3af',
    fontSize: 13,
  },
  card: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
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
    color: '#9ca3af',
  },
  value: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  valueStrong: {
    fontSize: 15,
    color: '#38bdf8',
    fontWeight: '700',
  },
  badgeActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  badgeInactive: {
    color: '#f97373',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  linkButton: {
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 14,
    color: '#38bdf8',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    marginTop: 24,
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
  secondaryButton: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f97373',
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#f97373',
    fontSize: 14,
    fontWeight: '600',
  },
  missingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  missingText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
});

