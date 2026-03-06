import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Subscription } from '../types';
import { CATEGORY_LABELS } from '../constants/categories';

const formatCurrency = (value: number) => {
  return `${value.toLocaleString('ru-RU')} ₽/мес`;
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

const daysUntil = (isoDate: string) => {
  const target = new Date(isoDate);
  const now = new Date();
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const SubscriptionItem: React.FC<{ item: Subscription; onPress: () => void }> = ({
  item,
  onPress,
}) => {
  const days = daysUntil(item.nextChargeDate);
  const isDanger = days !== null && days <= 3;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCategory}>
            {CATEGORY_LABELS[item.category] ?? item.category}
          </Text>
        </View>
        <Text style={styles.cardPrice}>{formatCurrency(item.price)}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.badgeRow}>
          <View style={[styles.dot, isDanger && { backgroundColor: '#f97373' }]} />
          <Text style={[styles.nextChargeLabel, isDanger && { color: '#f97373' }]}>
            Следующее списание:{' '}
            <Text style={{ fontWeight: '600' }}>{formatDate(item.nextChargeDate)}</Text>
            {days !== null && days >= 0 && (
              <Text style={{ color: isDanger ? '#fecaca' : '#9ca3af' }}>
                {`  (через ${days} д.)`}
              </Text>
            )}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const HomeScreen: React.FC = () => {
  const { subscriptions, fetchSubscriptions, isLoading } = useSubscriptionStore();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (!subscriptions.length) {
      fetchSubscriptions();
    }
  }, [fetchSubscriptions, subscriptions.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  }, [fetchSubscriptions]);

  const totalPerMonth = useMemo(
    () =>
      subscriptions.reduce((sum, s) => {
        if (!s.isActive) return sum;
        return sum + s.price;
      }, 0),
    [subscriptions],
  );

  const handleAddPress = () => {
    navigation
      .getParent()
      ?.navigate('SubscriptionForm' as never, { subscriptionId: undefined } as never);
  };

  const renderItem = ({ item }: { item: Subscription }) => (
    <SubscriptionItem
      item={item}
      onPress={() =>
        navigation
          .getParent()
          ?.navigate(
            'SubscriptionDetail' as never,
            { subscriptionId: item.id } as never,
          )
      }
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Мои подписки</Text>
          <Text style={styles.subtitle}>Контролируйте регулярные расходы</Text>
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Всего в месяц</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalPerMonth)}</Text>
        </View>
      </View>

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          !subscriptions.length && { flex: 1, justifyContent: 'center' },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor="#38bdf8"
            colors={['#38bdf8']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={40} color="#4b5563" />
            <Text style={styles.emptyTitle}>Пока нет подписок</Text>
            <Text style={styles.emptySubtitle}>
              Нажмите на кнопку «+», чтобы добавить первую подписку.
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#020617" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  subtitle: {
    marginTop: 4,
    color: '#9ca3af',
    fontSize: 13,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  totalValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#38bdf8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#020617',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#111827',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  cardCategory: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f97316',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  nextChargeLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});

