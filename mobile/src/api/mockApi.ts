import { AnalyticsSummary, Forecast, Recommendation, Subscription } from '../types';

const delay = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 100);
  });

let subscriptions: Subscription[] = [];

export const getSubscriptions = async (): Promise<Subscription[]> => {
  await delay();
  return [...subscriptions];
};

export const addSubscription = async (sub: Partial<Subscription>): Promise<Subscription> => {
  await delay();
  const now = new Date().toISOString();
  const created: Subscription = {
    id: sub.id ?? `mock_${Math.random().toString(36).slice(2, 9)}`,
    name: sub.name ?? 'Подписка',
    price: sub.price ?? 0,
    currency: sub.currency ?? 'RUB',
    billingPeriod: sub.billingPeriod ?? 'month',
    billingInterval: sub.billingInterval ?? 1,
    nextChargeDate: sub.nextChargeDate ?? now.slice(0, 10),
    categoryId: sub.categoryId ?? null,
    categoryName: sub.categoryName ?? null,
    isActive: sub.isActive ?? true,
    status: sub.status ?? 'active',
    createdAt: now,
    updatedAt: now,
    description: sub.description,
    notes: sub.notes,
    url: sub.url,
  };
  subscriptions = [...subscriptions, created];
  return created;
};

export const updateSubscription = async (
  id: string,
  data: Partial<Subscription>,
): Promise<Subscription | null> => {
  await delay();
  const index = subscriptions.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const updated = { ...subscriptions[index], ...data, updatedAt: new Date().toISOString() };
  subscriptions = [...subscriptions.slice(0, index), updated, ...subscriptions.slice(index + 1)];
  return updated;
};

export const deleteSubscription = async (id: string): Promise<boolean> => {
  await delay();
  const before = subscriptions.length;
  subscriptions = subscriptions.filter((item) => item.id !== id);
  return subscriptions.length < before;
};

export const importFromEmail = async (_text: string): Promise<Subscription | null> => {
  await delay();
  return null;
};

export const getAnalytics = async (): Promise<AnalyticsSummary> => {
  await delay();
  return {
    monthly: [],
    totalByCategory: {},
    totalPerMonthAverage: 0,
  };
};

export const getForecast = async (): Promise<Forecast> => {
  await delay();
  return { months: [] };
};

export const getRecommendations = async (_categoryId: number): Promise<Recommendation[]> => {
  await delay();
  return [];
};
