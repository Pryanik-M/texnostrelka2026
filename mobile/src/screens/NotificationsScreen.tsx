import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Subscription } from '../types';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';
import { CatSticker } from '../components/CatSticker';

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

const formatCurrency = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;

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
          {sub.categoryName ?? 'Без категории'}
        </Text>
      </View>
    );
  };

  return (
    <ScreenBackground>
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
            <View style={styles.emptyContainer}>
              <CatSticker size={88} color={Theme.colors.textPrimary} accent={Theme.colors.accent} />
              <Text style={styles.emptyTitle}>Нет предстоящих списаний</Text>
              <Text style={styles.emptyText}>
                Мы покажем здесь напоминания, когда до списания останется 1–3 дня.
              </Text>
            </View>
          }
        />
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: 'Benzin-Medium',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
});
