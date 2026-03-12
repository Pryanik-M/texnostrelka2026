import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { getCandidates, ignoreCandidate } from '../api/client';
import { ScreenBackground } from '../components/ScreenBackground';
import { Theme } from '../theme';
import { CatSticker } from '../components/CatSticker';

type Candidate = {
  id: number;
  subject: string;
  sender: string;
  detected_service?: string | null;
  snippet?: string | null;
  confidence: number;
};

export const CandidatesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCandidates();
      setItems(data);
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось загрузить кандидатов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleAccept = (candidate: Candidate) => {
    navigation.navigate('SubscriptionForm' as never, {
      candidateId: candidate.id,
      candidateName: candidate.detected_service ?? candidate.subject,
    } as never);
  };

  const handleIgnore = async (candidateId: number) => {
    try {
      await ignoreCandidate(candidateId);
      await loadCandidates();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось игнорировать кандидата');
    }
  };

  const renderItem = ({ item }: { item: Candidate }) => (
    <View style={styles.card}>
      <Text style={styles.service}>{item.detected_service ?? 'Сервис не распознан'}</Text>
      <Text style={styles.subject}>{item.subject}</Text>
      {item.snippet ? <Text style={styles.snippet}>{item.snippet}</Text> : null}
      <Text style={styles.meta}>
        От: {item.sender} • Уверенность: {Math.round(item.confidence)}%
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item)}>
          <Text style={styles.acceptButtonText}>Проверить и добавить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ignoreButton} onPress={() => handleIgnore(item.id)}>
          <Text style={styles.ignoreButtonText}>Игнорировать</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Кандидаты подписок</Text>
        <Text style={styles.subtitle}>Письма, похожие на уведомления о подписках.</Text>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Theme.colors.accent} />
            <Text style={styles.loadingText}>Обновляем список...</Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            !items.length && { flex: 1, justifyContent: 'center' },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CatSticker size={86} color={Theme.colors.textPrimary} accent={Theme.colors.accent} />
              <Text style={styles.emptyTitle}>Пока нет кандидатов</Text>
              <Text style={styles.emptyText}>
                Запустите синхронизацию почты и вернитесь сюда.
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: Theme.colors.textSecondary,
    fontSize: 12,
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
  service: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  subject: {
    marginTop: 4,
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  snippet: {
    marginTop: 8,
    fontSize: 13,
    color: Theme.colors.textPrimary,
  },
  meta: {
    marginTop: 8,
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  actionRow: {
    marginTop: 12,
  },
  acceptButton: {
    borderRadius: Theme.radii.sm,
    backgroundColor: Theme.colors.accentStrong,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: Theme.colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  ignoreButton: {
    marginTop: 8,
    borderRadius: Theme.radii.sm,
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    paddingVertical: 9,
    alignItems: 'center',
  },
  ignoreButtonText: {
    color: Theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
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
