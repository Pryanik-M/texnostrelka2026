import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Subscription } from '../types';
import { CATEGORY_LABELS } from '../constants/categories';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';
import { CatSticker } from '../components/CatSticker';

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
          <View
            style={[
              styles.dot,
              isDanger && { backgroundColor: Theme.colors.danger },
            ]}
          />
          <Text
            style={[
              styles.nextChargeLabel,
              isDanger && { color: Theme.colors.danger },
            ]}
          >
            Следующее списание:{' '}
            <Text style={{ fontWeight: '600' }}>
              {formatDate(item.nextChargeDate)}
            </Text>
            {days !== null && days >= 0 && (
              <Text
                style={{
                  color: isDanger ? '#ffd1d1' : Theme.colors.textMuted,
                }}
              >
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
    Alert.alert('Добавить подписку', 'Выберите источник', [
      {
        text: 'Новая',
        onPress: () =>
          navigation
            .getParent()
            ?.navigate('SubscriptionForm' as never, { subscriptionId: undefined } as never),
      },
      {
        text: 'Из кандидатов',
        onPress: () => navigation.getParent()?.navigate('Candidates' as never),
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item }: { item: Subscription }) => (
    <SubscriptionItem
      item={item}
      onPress={() =>
        navigation
          .getParent()
          ?.navigate('SubscriptionDetail' as never, { subscriptionId: item.id } as never)
      }
    />
  );

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Мои подписки</Text>
            <Text style={styles.subtitle}>
              Контролируйте регулярные расходы без лишней суеты
            </Text>
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
              tintColor={Theme.colors.accent}
              colors={[Theme.colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CatSticker
                size={96}
                color={Theme.colors.textPrimary}
                accent={Theme.colors.accent}
              />
              <Text style={styles.emptyTitle}>Пока нет подписок</Text>
              <Text style={styles.emptySubtitle}>
                Нажмите на кнопку «+», чтобы добавить первую подписку.
              </Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color={Theme.colors.background} />
        </TouchableOpacity>
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  totalValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.accent,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
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
    color: Theme.colors.textPrimary,
  },
  cardCategory: {
    marginTop: 4,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.accentWarm,
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
    backgroundColor: Theme.colors.accent,
    marginRight: 8,
  },
  nextChargeLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: Theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
