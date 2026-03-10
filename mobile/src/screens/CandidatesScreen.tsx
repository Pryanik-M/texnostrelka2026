import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

import { acceptCandidate, getCandidates, ignoreCandidate } from '../api/client';

type Candidate = {
  id: number;
  subject: string;
  sender: string;
  detected_service?: string | null;
  snippet?: string | null;
  confidence: number;
};

export const CandidatesScreen: React.FC = () => {
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

  const handleAccept = async (candidateId: number) => {
    try {
      await acceptCandidate(candidateId);
      await loadCandidates();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось принять кандидата');
    }
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
      <Text style={styles.meta}>От: {item.sender} • Уверенность: {Math.round(item.confidence * 100)}%</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item.id)}>
          <Text style={styles.acceptButtonText}>Добавить подписку</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ignoreButton} onPress={() => handleIgnore(item.id)}>
          <Text style={styles.ignoreButtonText}>Игнорировать</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Кандидаты подписок</Text>
      <Text style={styles.subtitle}>Письма, похожие на уведомления о подписках.</Text>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#38bdf8" />
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
            <Text style={styles.emptyTitle}>Пока нет кандидатов</Text>
            <Text style={styles.emptyText}>Запустите синхронизацию почты и вернитесь сюда.</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  subtitle: {
    marginTop: 4,
    color: '#9ca3af',
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
    color: '#9ca3af',
    fontSize: 12,
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
  service: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  subject: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
  },
  snippet: {
    marginTop: 8,
    fontSize: 13,
    color: '#e5e7eb',
  },
  meta: {
    marginTop: 8,
    fontSize: 11,
    color: '#6b7280',
  },
  actionRow: {
    marginTop: 12,
  },
  acceptButton: {
    borderRadius: 12,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '700',
  },
  ignoreButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f97373',
    paddingVertical: 9,
    alignItems: 'center',
  },
  ignoreButtonText: {
    color: '#f97373',
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
    color: '#e5e7eb',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
