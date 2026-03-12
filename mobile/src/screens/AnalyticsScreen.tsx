import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PieChart, BarChart } from 'react-native-gifted-charts';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { CATEGORIES } from '../constants/categories';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

const monthKeyFromDate = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
};

export const AnalyticsScreen: React.FC = () => {
  const { analytics, loadAnalytics } = useSubscriptionStore();
  const navigation = useNavigation();

  useEffect(() => {
    if (!analytics) {
      loadAnalytics();
    }
  }, [analytics, loadAnalytics]);

  const { currentMonthTotal, currentYearTotal, pieData, barData } = useMemo(() => {
    if (!analytics) {
      return {
        currentMonthTotal: 0,
        currentYearTotal: 0,
        pieData: [] as { value: number; color: string; text: string }[],
        barData: [] as { value: number; label: string; frontColor: string }[],
      };
    }

    const now = new Date();
    const currentMonthKey = monthKeyFromDate(now);
    const currentYear = now.getFullYear();

    const currentMonth = analytics.monthly.find((m) => m.month === currentMonthKey);
    const currentMonthTotal = currentMonth?.total ?? 0;

    const currentYearTotal = analytics.monthly
      .filter((m) => m.month.startsWith(String(currentYear)))
      .reduce((sum, m) => sum + m.total, 0);

    const colorByCategory: Record<string, string> = {};
    CATEGORIES.forEach((cat) => {
      colorByCategory[cat.id] = cat.color;
    });

    const pieData = Object.entries(analytics.totalByCategory)
      .filter(([, value]) => value > 0)
      .map(([category, value]) => ({
        value,
        color: colorByCategory[category] ?? Theme.colors.textMuted,
        text: '',
      }));

    const sortedMonths = [...analytics.monthly].sort((a, b) =>
      a.month.localeCompare(b.month),
    );
    const lastSix = sortedMonths.slice(-6);

    const barData = lastSix.map((m) => {
      const [, mm] = m.month.split('-');
      const label = `${mm}.${String(currentYear).slice(-2)}`;
      return {
        value: m.total,
        label,
        frontColor: Theme.colors.accent,
      };
    });

    return { currentMonthTotal, currentYearTotal, pieData, barData };
  }, [analytics]);

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Аналитика подписок</Text>
        <Text style={styles.subtitle}>
          Следите за регулярными расходами по категориям и месяцам.
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Текущий месяц</Text>
            <Text style={styles.summaryValue}>
              {currentMonthTotal.toLocaleString('ru-RU')} ₽
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Текущий год</Text>
            <Text style={styles.summaryValue}>
              {currentYearTotal.toLocaleString('ru-RU')} ₽
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Расходы по категориям</Text>
          {pieData.length ? (
            <>
              <View style={styles.chartRow}>
                <PieChart
                  data={pieData}
                  donut
                  radius={84}
                  innerRadius={52}
                  innerCircleColor={Theme.colors.surfaceAlt}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: Theme.colors.textMuted, fontSize: 12 }}>
                        Всего
                      </Text>
                      <Text
                        style={{
                          color: Theme.colors.textPrimary,
                          fontSize: 16,
                          fontWeight: '700',
                        }}
                      >
                        {currentMonthTotal.toLocaleString('ru-RU')} ₽
                      </Text>
                    </View>
                  )}
                />
              </View>
              <View style={styles.legendContainer}>
                {CATEGORIES.map((cat) => {
                  const value = analytics?.totalByCategory[cat.id] ?? 0;
                  if (!value) return null;
                  return (
                    <View key={cat.id} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
                      <Text style={styles.legendLabel}>{cat.label}</Text>
                      <Text style={styles.legendValue}>
                        {value.toLocaleString('ru-RU')} ₽
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>
              Недостаточно данных для построения графика.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Расходы по месяцам</Text>
          {barData.length ? (
            <View style={{ marginTop: 16 }}>
              <BarChart
                data={barData}
                barWidth={24}
                spacing={18}
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: Theme.colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: Theme.colors.textMuted, fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...barData.map((b) => b.value), 1000)}
                hideRules
                frontColor={Theme.colors.accent}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>Пока нет данных по месяцам.</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.forecastButton}
          onPress={() => navigation.getParent()?.navigate('Forecast' as never)}
        >
          <Text style={styles.forecastButtonText}>
            Открыть прогноз на 12 месяцев
          </Text>
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.accent,
  },
  card: {
    marginTop: 18,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  chartRow: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.textPrimary,
  },
  legendValue: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    color: Theme.colors.textMuted,
  },
  forecastButton: {
    marginTop: 18,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.accent,
    paddingVertical: 11,
    alignItems: 'center',
  },
  forecastButtonText: {
    color: Theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
