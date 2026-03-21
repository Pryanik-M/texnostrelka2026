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
  getServerNow,
  updateSubscription,
} from '../api/client';
import {
  AnalyticsSummary,
  Forecast,
  Recommendation,
  Subscription,
} from '../types';

interface SubscriptionState {
  subscriptions: Subscription[];
  analytics: AnalyticsSummary | null;
  forecast: Forecast | null;
  categories: ApiCategory[];
  isLoading: boolean;
  error: string | null;

  fetchSubscriptions: (params?: {
    search?: string;
    status?: string;
    order?: string;
    category?: number;
  }) => Promise<void>;
  add: (sub: Partial<Subscription>) => Promise<Subscription | null>;
  update: (id: string, data: Partial<Subscription>) => Promise<Subscription | null>;
  remove: (id: string) => Promise<boolean>;
  importFromEmailText: (text: string) => Promise<Subscription | null>;

  loadAnalytics: () => Promise<void>;
  loadForecast: () => Promise<void>;
  getCategoryRecommendations: (categoryId: number) => Promise<Recommendation[]>;
  ensureCategories: () => Promise<void>;
  clearError: () => void;
}

const parseLocalDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addMonths = (date: Date, months: number) => {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const day = date.getDate();
  const firstOfTarget = new Date(year, month, 1);
  const lastDay = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0).getDate();
  return new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), Math.min(day, lastDay));
};

const addPeriod = (date: Date, period: Subscription['billingPeriod'], interval = 1) => {
  const safeInterval = Math.max(Number(interval || 1), 1);
  if (period === 'day') return new Date(date.getFullYear(), date.getMonth(), date.getDate() + safeInterval);
  if (period === 'week') return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7 * safeInterval);
  if (period === 'year') return addMonths(date, 12 * safeInterval);
  return addMonths(date, safeInterval);
};

const getNextPaymentDate = (
  rawNextPayment: string,
  period: Subscription['billingPeriod'],
  interval: number | undefined,
  now: Date,
) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextDate = parseLocalDate(rawNextPayment);
  while (nextDate < today) {
    nextDate = addPeriod(nextDate, period, interval);
  }
  return formatLocalDate(nextDate);
};

const mapSubscriptionFromApi = (
  sub: ApiSubscription,
  categories: ApiCategory[],
): Subscription => {
  const categoryMatch = categories.find((c) => c.id === sub.category);
  const categoryName = categoryMatch?.name ?? '';
  const status = (sub.status ?? 'active') as Subscription['status'];
  const rawNextPayment = sub.next_payment_date ?? sub.start_date ?? new Date().toISOString().slice(0, 10);
  const billingPeriod = (sub.billing_period ?? 'month') as Subscription['billingPeriod'];
  const billingInterval = Number(sub.billing_interval ?? 1) || 1;
  const nextPayment = getNextPaymentDate(rawNextPayment, billingPeriod, billingInterval, getServerNow());

  return {
    id: String(sub.id),
    backendId: sub.id,
    name: sub.name,
    price: Number(sub.price),
    currency: sub.currency ?? 'RUB',
    billingPeriod,
    billingInterval,
    startDate: sub.start_date ?? undefined,
    nextChargeDate: nextPayment,
    categoryId: sub.category ?? null,
    categoryName: categoryMatch?.name ?? null,
    isActive: status === 'active',
    status,
    createdAt: sub.created_at ?? sub.start_date ?? new Date().toISOString(),
    updatedAt: sub.updated_at ?? sub.start_date ?? new Date().toISOString(),
    description: sub.description ?? undefined,
    notes: sub.notes ?? undefined,
    url: sub.service_url ?? undefined,
  };
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

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const nextChargeDate = nextMonth.toISOString().slice(0, 10);

  return {
    id: `local_${Math.random().toString(36).slice(2, 9)}`,
    name,
    price: amount,
    currency: 'RUB',
    billingPeriod: 'month',
    billingInterval: 1,
    nextChargeDate,
    categoryId: null,
    categoryName: null,
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

      async fetchSubscriptions(params) {
        set({ isLoading: true, error: null });
        try {
          await get().ensureCategories();
          const data = await getSubscriptions(params);
          const now = getServerNow();
          const mapped = data.map((sub) => mapSubscriptionFromApi(sub, get().categories));
          const toUpdate = data
            .map((sub, index) => {
              const period = (sub.billing_period ?? 'month') as Subscription['billingPeriod'];
              const interval = Number(sub.billing_interval ?? 1) || 1;
              const rawNext = sub.next_payment_date ?? sub.start_date;
              const status = (sub.status ?? 'active') as Subscription['status'];
              if (!rawNext || status !== 'active') return null;
              const next = getNextPaymentDate(rawNext, period, interval, now);
              if (next !== rawNext) {
                return { backendId: sub.id, next_payment_date: next, index };
              }
              return null;
            })
            .filter((item): item is { backendId: number; next_payment_date: string; index: number } => !!item);

          if (toUpdate.length > 0) {
            Promise.allSettled(
              toUpdate.map((item) =>
                updateSubscription(item.backendId, { next_payment_date: item.next_payment_date }),
              ),
            ).catch(() => undefined);
          }
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
          const categoryId = sub.categoryId ?? null;
          const today = new Date().toISOString().slice(0, 10);
          const response = await createSubscription({
            name: sub.name ?? 'Новая подписка',
            category: categoryId,
            description: sub.description ?? '',
            price: sub.price ?? 0,
            currency: sub.currency ?? 'RUB',
            billing_period: sub.billingPeriod ?? 'month',
            billing_interval: sub.billingInterval ?? 1,
            start_date: sub.startDate ?? today,
            next_payment_date: sub.nextChargeDate ?? today,
            status: sub.status ?? (sub.isActive === false ? 'paused' : 'active'),
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
          const categoryId = data.categoryId;
          const updated = await updateSubscription(backendId, {
            name: data.name,
            category: categoryId,
            description: data.description,
            price: data.price,
            currency: data.currency,
            billing_period: data.billingPeriod,
            billing_interval: data.billingInterval,
            start_date: data.startDate,
            next_payment_date: data.nextChargeDate,
            status: data.status ?? (data.isActive === false ? 'paused' : data.isActive === true ? 'active' : undefined),
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
          const totals: Record<string, number> = {};

          data.spending_by_category.forEach((item) => {
            if (typeof item.category_id === 'number') {
              totals[String(item.category_id)] = Number(item.total ?? 0);
              return;
            }
            const serverName = item.category_name ?? item.category__name ?? null;
            const matched = get().categories.find((cat) => cat.name === serverName);
            const key = String(matched?.id ?? 'none');
            totals[key] = Number(item.total ?? 0);
          });

          const monthly = data.spending_by_month.map((item) => ({
            month:
              typeof item.month === 'number'
                ? `${new Date().getFullYear()}-${String(item.month).padStart(2, '0')}`
                : item.month,
            total: Number(item.total ?? 0),
            byCategory: {},
          }));

          set({
            analytics: {
              monthly,
              totalByCategory: totals,
              totalPerMonthAverage:
                monthly.length > 0
                  ? Math.round((monthly.reduce((sum, m) => sum + m.total, 0) / monthly.length) * 100) / 100
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
          if (get().subscriptions.length === 0) {
            await get().fetchSubscriptions();
          }
          const data = await getForecast();
          const months = data.monthly_chart_labels.map((label, index) => ({
            month: label,
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

      async getCategoryRecommendations(_categoryId: number) {
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
