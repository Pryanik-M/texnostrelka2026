import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Subscription } from '../types';
import { getCategoryLabel } from '../constants/categories';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';
import { CatSticker } from '../components/CatSticker';

const periodLabel: Record<Subscription['billingPeriod'], string> = {
  day: 'день',
  week: 'нед',
  month: 'мес',
  year: 'год',
};

const formatCurrency = (
  value: number,
  currency: string,
  period: Subscription['billingPeriod'],
  interval = 1,
) => {
  const suffix = interval > 1 ? `${interval} ${periodLabel[period]}` : periodLabel[period];
  return `${value.toLocaleString('ru-RU')} ${currency}/${suffix}`;
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

const SubscriptionItem: React.FC<{
  item: Subscription;
  categoryLabel: string;
  onPress: () => void;
}> = ({
  item,
  categoryLabel,
  onPress,
}) => {
  const days = daysUntil(item.nextChargeDate);
  const isDanger = days !== null && days <= 3;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardCategory} numberOfLines={1}>
            {categoryLabel}
          </Text>
        </View>
        <Text style={styles.cardPrice}>
          {formatCurrency(item.price, item.currency, item.billingPeriod, item.billingInterval)}
        </Text>
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
                  color: isDanger ? Theme.colors.danger : Theme.colors.textMuted,
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
  const { subscriptions, fetchSubscriptions, isLoading, forecast, loadForecast, categories } = useSubscriptionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [order, setOrder] = useState<'-created_at' | 'created_at' | '-price' | 'price' | 'next_payment_date' | 'name'>('-created_at');
  const navigation = useNavigation();

  useEffect(() => {
    if (!subscriptions.length) {
      fetchSubscriptions();
    }
    if (!forecast) {
      loadForecast();
    }
  }, [fetchSubscriptions, subscriptions.length, forecast, loadForecast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  }, [fetchSubscriptions]);

  const totalPerMonth = useMemo(() => forecast?.monthlyForecast ?? 0, [forecast]);

  useEffect(() => {
    const query = searchQuery.trim();
    const timeout = setTimeout(() => {
      fetchSubscriptions({
        search: query || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        order,
      });
    }, 350);
    return () => clearTimeout(timeout);
  }, [fetchSubscriptions, searchQuery, statusFilter, order]);

  const filteredSubscriptions = useMemo(() => subscriptions, [subscriptions]);

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
      categoryLabel={item.categoryName ?? getCategoryLabel(categories, item.categoryId)}
      onPress={() =>
        navigation
          .getParent()
          ?.navigate('SubscriptionDetail' as never, { subscriptionId: Number(item.id) } as never)
      }
    />
  );

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Мои подписки</Text>
            <Text style={styles.subtitle}>
              Контролируйте регулярные расходы без лишней суеты
            </Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Всего в месяц</Text>
            <Text style={styles.totalValue} numberOfLines={1}>
              {formatCurrency(totalPerMonth, 'RUB', 'month')}
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Theme.colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Поиск подписок"
            placeholderTextColor={Theme.colors.textMuted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'Все' },
            { id: 'active', label: 'Активные' },
            { id: 'paused', label: 'Пауза' },
            { id: 'cancelled', label: 'Отключенные' },
          ].map((item) => {
            const selected = statusFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.filterChip, selected && styles.filterChipActive]}
                onPress={() => setStatusFilter(item.id as typeof statusFilter)}
              >
                <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Сортировка:</Text>
          {[
            { id: '-created_at', label: 'Новые' },
            { id: 'created_at', label: 'Старые' },
            { id: '-price', label: 'Дороже' },
            { id: 'price', label: 'Дешевле' },
            { id: 'next_payment_date', label: 'По дате' },
            { id: 'name', label: 'По названию' },
          ].map((item) => {
            const selected = order === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.orderChip, selected && styles.orderChipActive]}
                onPress={() => setOrder(item.id as typeof order)}
              >
                <Text style={[styles.orderText, selected && styles.orderTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filteredSubscriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            !filteredSubscriptions.length && { flex: 1, justifyContent: 'center' },
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
              <Text style={styles.emptyTitle}>Ничего не найдено</Text>
              <Text style={styles.emptySubtitle}>
                Попробуйте изменить запрос или добавьте первую подписку.
              </Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color={Theme.colors.textOnAccent} />
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
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    fontFamily: 'Benzin-Medium',
  },
  subtitle: {
    marginTop: 4,
    color: Theme.colors.textSecondary,
    fontSize: 13,
  },
  totalContainer: {
    alignItems: 'flex-end',
    backgroundColor: Theme.colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    maxWidth: '45%',
    flexShrink: 1,
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
  searchBox: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceAlt,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.accent,
    borderColor: Theme.colors.accent,
  },
  filterText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  filterTextActive: {
    color: Theme.colors.textOnAccent,
    fontWeight: '600',
  },
  orderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginRight: 4,
  },
  orderChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceAlt,
  },
  orderChipActive: {
    backgroundColor: Theme.colors.accentStrong,
    borderColor: Theme.colors.accentStrong,
  },
  orderText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  orderTextActive: {
    color: Theme.colors.textOnAccent,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    flexShrink: 1,
  },
  cardCategory: {
    marginTop: 4,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    flexShrink: 1,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.accent,
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
    shadowColor: Theme.colors.accentStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
});
