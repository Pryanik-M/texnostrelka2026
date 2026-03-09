import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addSubscription,
  deleteSubscription,
  getAnalytics,
  getForecast,
  getRecommendations,
  getSubscriptions,
  importFromEmail,
  updateSubscription,
} from '../api/mockApi';
import {
  AnalyticsSummary,
  Forecast,
  Recommendation,
  Subscription,
  SubscriptionCategory,
} from '../types';

interface SubscriptionState {
  subscriptions: Subscription[];
  analytics: AnalyticsSummary | null;
  forecast: Forecast | null;
  isLoading: boolean;
  error: string | null;

  fetchSubscriptions: () => Promise<void>;
  add: (sub: Partial<Subscription>) => Promise<Subscription | null>;
  update: (id: string, data: Partial<Subscription>) => Promise<Subscription | null>;
  remove: (id: string) => Promise<boolean>;
  importFromEmailText: (text: string) => Promise<Subscription | null>;

  loadAnalytics: () => Promise<void>;
  loadForecast: () => Promise<void>;
  getCategoryRecommendations: (category: SubscriptionCategory) => Promise<Recommendation[]>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      analytics: null,
      forecast: null,
      isLoading: false,
      error: null,

      async fetchSubscriptions() {
        set({ isLoading: true, error: null });
        try {
          const data = await getSubscriptions();
          set({ subscriptions: data, isLoading: false });
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : 'Не удалось загрузить подписки',
          });
        }
      },

      async add(sub) {
        set({ isLoading: true, error: null });
        try {
          const created = await addSubscription(sub);
          const next = [...get().subscriptions, created];
          set({ subscriptions: next, isLoading: false });
          return created;
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : 'Не удалось создать подписку',
          });
          return null;
        }
      },

      async update(id, data) {
        set({ isLoading: true, error: null });
        try {
          const updated = await updateSubscription(id, data);
          if (!updated) {
            set({ isLoading: false, error: 'Подписка не найдена' });
            return null;
          }
          const list = get().subscriptions.map((s) => (s.id === id ? updated : s));
          set({ subscriptions: list, isLoading: false });
          return updated;
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : 'Не удалось обновить подписку',
          });
          return null;
        }
      },

      async remove(id) {
        set({ isLoading: true, error: null });
        try {
          const ok = await deleteSubscription(id);
          if (ok) {
            const list = get().subscriptions.filter((s) => s.id !== id);
            set({ subscriptions: list, isLoading: false });
          } else {
            set({ isLoading: false, error: 'Не удалось удалить подписку' });
          }
          return ok;
        } catch (e) {
          set({
            isLoading: false,
            error: e instanceof Error ? e.message : 'Ошибка при удалении подписки',
          });
          return false;
        }
      },

      async importFromEmailText(text) {
        set({ isLoading: true, error: null });
        try {
          const created = await importFromEmail(text);
          if (created) {
            const next = [...get().subscriptions, created];
            set({ subscriptions: next, isLoading: false });
          } else {
            set({
              isLoading: false,
              error: 'Не удалось распознать подписку в тексте письма',
            });
          }
          return created;
        } catch (e) {
          set({
            isLoading: false,
            error:
              e instanceof Error ? e.message : 'Ошибка при импорте подписки из письма',
          });
          return null;
        }
      },

      async loadAnalytics() {
        try {
          const analytics = await getAnalytics();
          set({ analytics });
        } catch (e) {
          set({
            error: e instanceof Error ? e.message : 'Не удалось загрузить аналитику',
          });
        }
      },

      async loadForecast() {
        try {
          const forecast = await getForecast();
          set({ forecast });
        } catch (e) {
          set({
            error: e instanceof Error ? e.message : 'Не удалось загрузить прогноз расходов',
          });
        }
      },

      async getCategoryRecommendations(category) {
        try {
          const recs = await getRecommendations(category);
          return recs;
        } catch (e) {
          set({
            error: e instanceof Error ? e.message : 'Не удалось загрузить рекомендации',
          });
          return [];
        }
      },

      clearError() {
        set({ error: null });
      },
    }),
    {
      name: 'subscription-monitor-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ subscriptions: state.subscriptions }),
    },
  ),
);
