import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Subscription } from '../types';
import { CATEGORY_LABELS } from '../constants/categories';

const daysUntil = (isoDate: string) => {
  const target = new Date(isoDate);
  const now = new Date();
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatDate = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (value: number) =>
  `${value.toLocaleString('ru-RU')} ₽`;

export const NotificationsScreen: React.FC = () => {
  const { subscriptions } = useSubscriptionStore();

  const upcoming = useMemo(
    () =>
      subscriptions
        .map((s) => ({ sub: s, days: daysUntil(s.nextChargeDate) }))
        .filter(
          (item) =>
            item.days !== null && item.days >= 1 && item.days <= 3 && item.sub.isActive,
        )
        .sort((a, b) => (a.days ?? 0) - (b.days ?? 0)),
    [subscriptions],
  );

  const renderItem = ({ item }: { item: { sub: Subscription; days: number | null } }) => {
    const { sub, days } = item;
    return (
      <View style={styles.card}>
        <Text style={styles.title}>
          Через {days} д. спишется {formatCurrency(sub.price)} за {sub.name}
        </Text>
        <Text style={styles.meta}>
          Дата списания: {formatDate(sub.nextChargeDate)} • Категория:{' '}
          {CATEGORY_LABELS[sub.category] ?? sub.category}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Предстоящие списания</Text>
      <Text style={styles.headerSubtitle}>
        Локальные напоминания по подпискам на ближайшие дни.
      </Text>

      <FlatList
        data={upcoming}
        keyExtractor={(item) => item.sub.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          !upcoming.length && { flex: 1, justifyContent: 'center' },
        ]}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
            <Text style={styles.emptyTitle}>Нет предстоящих списаний</Text>
            <Text style={styles.emptyText}>
              Мы покажем здесь напоминания, когда до списания по подписке останется 1–3 дня.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
    padding: 14,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

