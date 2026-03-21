import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';

export const ForecastScreen: React.FC = () => {
  const { forecast, loadForecast } = useSubscriptionStore();

  useEffect(() => {
    if (!forecast) {
      loadForecast();
    }
  }, [forecast, loadForecast]);

  const lineData = useMemo(() => {
    if (!forecast) return [];
    return forecast.months.map((m) => ({
      value: m.expectedTotal,
      label: m.month,
      dataPointText: '',
      hideDataPoint: false,
      frontColor: Theme.colors.accent,
    }));
  }, [forecast]);

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Прогноз расходов</Text>
        <Text style={styles.subtitle}>Данные прогноза подгружаются напрямую с сервера.</Text>

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
  lineChartWrapper: { marginTop: 16, height: 220 },
  emptyText: { marginTop: 12, fontSize: 13, color: Theme.colors.textMuted },
});
