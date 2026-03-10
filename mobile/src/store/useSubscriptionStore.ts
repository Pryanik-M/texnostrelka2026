import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ApiCategory,
  ApiSubscription,
  createSubscription,
  deleteSubscription,
  getAnalytics,
  getCategories,
  getForecast,
  getSubscriptions,
  updateSubscription,
} from '../api/client';
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
  categories: ApiCategory[];
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
  ensureCategories: () => Promise<void>;
  clearError: () => void;
}

const detectCategoryByName = (name: string): SubscriptionCategory => {
  const lower = name.toLowerCase();
  if (lower.includes('music') || lower.includes('муз')) return 'music';
  if (lower.includes('video') || lower.includes('фильм') || lower.includes('кино') || lower.includes('media')) {
    return 'streaming';
  }
  if (lower.includes('cloud') || lower.includes('облак') || lower.includes('hosting') || lower.includes('host')) {
    return 'cloud';
  }
  if (lower.includes('delivery') || lower.includes('достав') || lower.includes('еда') || lower.includes('prime')) {
    return 'delivery';
  }
  return 'software';
};

const mapSubscriptionFromApi = (
  sub: ApiSubscription,
  categories: ApiCategory[],
): Subscription => {
  const categoryMatch = categories.find((c) => c.id === sub.category);
  const categoryName = categoryMatch?.name ?? '';
  const localCategory = categoryName ? detectCategoryByName(categoryName) : 'software';
  const status = (sub.status ?? 'active') as Subscription['status'];
  const nextPayment = sub.next_payment_date ?? sub.start_date ?? new Date().toISOString().slice(0, 10);

  return {
    id: String(sub.id),
    backendId: sub.id,
    name: sub.name,
    price: Number(sub.price),
    currency: (sub.currency ?? 'RUB') as Subscription['currency'],
    billingPeriod: (sub.billing_period ?? 'month') as Subscription['billingPeriod'],
    nextChargeDate: nextPayment,
    category: localCategory,
    categoryId: sub.category ?? null,
    categoryName: categoryMatch?.name ?? null,
    isActive: status === 'active',
    status,
    createdAt: sub.start_date ?? new Date().toISOString(),
    updatedAt: sub.start_date ?? new Date().toISOString(),
    notes: sub.notes ?? undefined,
    url: sub.service_url ?? undefined,
  };
};

const normalizeMonthKey = (label: string, index: number) => {
  const directMatch = label.match(/^(\d{4})[-./](\d{1,2})$/);
  if (directMatch) {
    const year = directMatch[1];
    const month = directMatch[2].padStart(2, '0');
    return `${year}-${month}`;
  }

  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ];
  const lower = label.toLowerCase();
  const monthIndex = monthNames.findIndex((m) => lower.includes(m));
  const now = new Date();
  const year = now.getFullYear();
  const month = monthIndex >= 0 ? (monthIndex % 12) + 1 : now.getMonth() + 1 + index;
  const safeMonth = ((month - 1) % 12) + 1;
  return `${year}-${String(safeMonth).padStart(2, '0')}`;
};

const importFromEmailTextLocal = async (text: string): Promise<Subscription | null> => {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (
    !/списан/i.test(normalized) &&
    !/подписк/i.test(normalized) &&
    !/руб\./i.test(normalized)
  ) {
    return null;
  }

  const amountMatch = normalized.match(/(\d[\d\s]*)\s*руб\./i);
  const amount = amountMatch ? Number(amountMatch[1].replace(/\s/g, '')) : 0;

  let name = 'Подписка';
  const subscriptionWordIndex = normalized.toLowerCase().indexOf('подписк');
  if (subscriptionWordIndex >= 0) {
    const after = normalized.slice(subscriptionWordIndex);
    const nameMatch = after.match(/подписк(?:а|у)?(?: на)?\s+([A-Za-zА-Яа-я0-9+.\-\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      name = nameMatch[1].trim();
    }
  } else {
    const words = normalized.split(' ');
    const serviceCandidates = words.filter((w) => /[A-Za-zА-Яа-я]/.test(w));
    if (serviceCandidates.length > 0) {
      name = serviceCandidates[serviceCandidates.length - 1];
    }
  }

  const category = detectCategoryByName(name);
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const nextChargeDate = nextMonth.toISOString().slice(0, 10);

  return {
    id: `local_${Math.random().toString(36).slice(2, 9)}`,
    name,
    price: amount,
    currency: 'RUB',
    billingPeriod: 'month',
    nextChargeDate,
    category,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      analytics: null,
      forecast: null,
      categories: [],
      isLoading: false,
      error: null,

      async ensureCategories() {
        if (get().categories.length > 0) return;
        try {
          const categories = await getCategories();
          set({ categories });
        } catch (e) {
          set({
            error: e instanceof Error ? e.message : 'Не удалось загрузить категории',
          });
        }
      },

      async fetchSubscriptions() {
        set({ isLoading: true, error: null });
        try {
          await get().ensureCategories();
          const data = await getSubscriptions();
          const mapped = data.map((sub) => mapSubscriptionFromApi(sub, get().categories));
          set({ subscriptions: mapped, isLoading: false });
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
          await get().ensureCategories();
          const categoryId =
            get().categories.find((c) => detectCategoryByName(c.name) === sub.category)?.id ??
            null;
          const today = new Date().toISOString().slice(0, 10);
          const response = await createSubscription({
            name: sub.name ?? 'Новая подписка',
            category: categoryId,
            description: '',
            price: sub.price ?? 0,
            currency: 'RUB',
            billing_period: sub.billingPeriod ?? 'month',
            start_date: today,
            next_payment_date: sub.nextChargeDate ?? today,
            status: sub.isActive === false ? 'paused' : 'active',
            service_url: sub.url ?? '',
            notes: sub.notes ?? '',
          });
          const created = response.subscription
            ? mapSubscriptionFromApi(response.subscription, get().categories)
            : null;
          if (created) {
            const next = [...get().subscriptions, created];
            set({ subscriptions: next, isLoading: false });
          } else {
            set({ isLoading: false });
          }
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
          await get().ensureCategories();
          const current = get().subscriptions.find((s) => s.id === id);
          const backendId = current?.backendId ?? Number(id);
          const categoryId =
            data.category
              ? get().categories.find((c) => detectCategoryByName(c.name) === data.category)?.id ??
                null
              : undefined;
          const updated = await updateSubscription(backendId, {
            name: data.name,
            category: categoryId,
            price: data.price,
            currency: data.currency,
            billing_period: data.billingPeriod,
            next_payment_date: data.nextChargeDate,
            status: data.isActive === false ? 'paused' : data.isActive === true ? 'active' : undefined,
            service_url: data.url,
            notes: data.notes,
          });
          const mapped = mapSubscriptionFromApi(updated, get().categories);
          const list = get().subscriptions.map((s) => (s.id === id ? mapped : s));
          set({ subscriptions: list, isLoading: false });
          return mapped;
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
          const current = get().subscriptions.find((s) => s.id === id);
          const backendId = current?.backendId ?? Number(id);
          await deleteSubscription(backendId);
          const list = get().subscriptions.filter((s) => s.id !== id);
          set({ subscriptions: list, isLoading: false });
          return true;
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
          const created = await importFromEmailTextLocal(text);
          if (!created) {
            set({
              isLoading: false,
              error: 'Не удалось распознать подписку в тексте письма',
            });
            return null;
          }
          const next = [...get().subscriptions, created];
          set({ subscriptions: next, isLoading: false });
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
          await get().ensureCategories();
          const data = await getAnalytics();
          const totals: Record<SubscriptionCategory, number> = {
            streaming: 0,
            software: 0,
            delivery: 0,
            music: 0,
            cloud: 0,
          };

          data.spending_by_category.forEach((item) => {
            const local = detectCategoryByName(item.category__name ?? '');
            totals[local] += Number(item.total ?? 0);
          });

          const year = new Date().getFullYear();
          const monthly = data.spending_by_month.map((item) => ({
            month: `${year}-${String(item.month).padStart(2, '0')}`,
            total: Number(item.total ?? 0),
            byCategory: { ...totals },
          }));

          set({
            analytics: {
              monthly,
              totalByCategory: totals,
              totalPerMonthAverage:
                monthly.length > 0
                  ? Math.round((monthly.reduce((sum, m) => sum + m.total, 0) / monthly.length) * 100) /
                    100
                  : 0,
            },
          });
        } catch (e) {
          set({
            error: e instanceof Error ? e.message : 'Не удалось загрузить аналитику',
          });
        }
      },

      async loadForecast() {
        try {
          await get().ensureCategories();
          const data = await getForecast();
          const months = data.monthly_chart_labels.map((label, index) => ({
            month: normalizeMonthKey(label, index),
            expectedTotal: Number(data.monthly_chart_values[index] ?? 0),
          }));
          set({
            forecast: {
              months,
              totalWeekSpending: data.total_week_spending,
              monthlyForecast: data.monthly_forecast,
              yearlyForecast: data.yearly_forecast,
              upcomingSubscriptions: data.upcoming_subscriptions.map((sub) =>
                mapSubscriptionFromApi(sub, get().categories),
              ),
            },
          });
        } catch (e) {
          set({
            error: e instanceof Error ? e.message : 'Не удалось загрузить прогноз расходов',
          });
        }
      },

      async getCategoryRecommendations() {
        return [];
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
