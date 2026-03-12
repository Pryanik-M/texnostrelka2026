import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { CATEGORIES } from '../constants/categories';
import { SubscriptionCategory } from '../types';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

export const ForecastScreen: React.FC = () => {
  const { forecast, loadForecast, getCategoryRecommendations } = useSubscriptionStore();
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recommendations, setRecommendations] = useState<
    Record<SubscriptionCategory, { name: string; price: number; vendor?: string }[]>
  >({
    streaming: [],
    software: [],
    delivery: [],
    music: [],
    cloud: [],
  });

  useEffect(() => {
    if (!forecast) {
      loadForecast();
    }
  }, [forecast, loadForecast]);

  useEffect(() => {
    const loadRecs = async () => {
      setLoadingRecs(true);
      const result: typeof recommendations = {
        streaming: [],
        software: [],
        delivery: [],
        music: [],
        cloud: [],
      };

      for (const cat of ['streaming', 'software', 'delivery', 'music', 'cloud'] as SubscriptionCategory[]) {
        const recs = await getCategoryRecommendations(cat);
        result[cat] = recs.map((r) => ({
          name: r.name,
          price: r.price,
          vendor: r.vendor,
        }));
      }

      setRecommendations(result);
      setLoadingRecs(false);
    };

    loadRecs();
  }, [getCategoryRecommendations]);

  const lineData = useMemo(() => {
    if (!forecast) return [];
    return forecast.months.map((m) => {
      const [, mm] = m.month.split('-');
      return {
        value: m.expectedTotal,
        label: mm,
        dataPointText: '',
        hideDataPoint: false,
        frontColor: Theme.colors.accent,
      };
    });
  }, [forecast]);

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Прогноз расходов</Text>
        <Text style={styles.subtitle}>
          Оценка регулярных платежей на ближайшие 12 месяцев и предложения по экономии.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Линейный прогноз на 12 месяцев</Text>
          {forecast && lineData.length ? (
            <View style={styles.lineChartWrapper}>
              <LineChart
                data={lineData}
                color={Theme.colors.accent}
                thickness={2}
                hideDataPoints={false}
                dataPointsColor={Theme.colors.accent}
                dataPointsRadius={3}
                curved
                showVerticalLines
                verticalLinesColor="rgba(148, 163, 184, 0.25)"
                xAxisColor="transparent"
                yAxisColor="transparent"
                yAxisTextStyle={{ color: Theme.colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: Theme.colors.textMuted, fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...lineData.map((d) => d.value), 1000)}
                initialSpacing={20}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>Недостаточно данных для построения прогноза.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Рекомендации по экономии</Text>
          <Text style={styles.sectionSubtitle}>
            Более выгодные альтернативы для популярных категорий подписок.
          </Text>

          {loadingRecs && (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Theme.colors.accent} />
            </View>
          )}

          {!loadingRecs &&
            CATEGORIES.map((cat) => {
              const recs = recommendations[cat.id as SubscriptionCategory] ?? [];
              if (!recs.length) return null;
              return (
                <View key={cat.id} style={styles.recommendationBlock}>
                  <View style={styles.recommendationHeader}>
                    <View
                      style={[
                        styles.recommendationDot,
                        { backgroundColor: cat.color },
                      ]}
                    />
                    <Text style={styles.recommendationTitle}>{cat.label}</Text>
                  </View>
                  {recs.slice(0, 3).map((r) => (
                    <Text key={r.name} style={styles.recommendationItem}>
                      • {r.name}{' '}
                      <Text style={styles.recommendationPrice}>
                        от {r.price.toLocaleString('ru-RU')} ₽/мес
                      </Text>
                      {r.vendor ? (
                        <Text style={styles.recommendationVendor}> ({r.vendor})</Text>
                      ) : null}
                    </Text>
                  ))}
                </View>
              );
            })}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Theme.colors.textPrimary },
  subtitle: { marginTop: 4, color: Theme.colors.textSecondary, fontSize: 13, marginBottom: 16 },
  card: {
    marginTop: 18,
    borderRadius: Theme.radii.lg,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Theme.colors.textPrimary },
  sectionSubtitle: { marginTop: 6, fontSize: 13, color: Theme.colors.textSecondary },
  lineChartWrapper: { marginTop: 16, height: 220 },
  emptyText: { marginTop: 12, fontSize: 13, color: Theme.colors.textMuted },
  recommendationBlock: { marginTop: 16 },
  recommendationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  recommendationDot: { width: 10, height: 10, borderRadius: 999, marginRight: 8 },
  recommendationTitle: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  recommendationItem: { marginLeft: 4, marginTop: 2, fontSize: 13, color: Theme.colors.textPrimary },
  recommendationPrice: { color: Theme.colors.accent },
  recommendationVendor: { color: Theme.colors.textSecondary },
});
