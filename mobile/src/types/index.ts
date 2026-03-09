export type SubscriptionCategory =
  | 'streaming'
  | 'software'
  | 'delivery'
  | 'music'
  | 'cloud';

export type BillingPeriod = 'day' | 'week' | 'month' | 'year';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: 'RUB';
  billingPeriod: BillingPeriod;
  nextChargeDate: string; // ISO string
  category: SubscriptionCategory;
  isActive: boolean;
  status?: 'active' | 'paused' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  url?: string;
  usageCount?: number;
  lastUsedAt?: string;
}

export interface MonthlyAnalytics {
  month: string; // e.g. "2026-04"
  total: number;
  byCategory: Record<SubscriptionCategory, number>;
}

export interface AnalyticsSummary {
  monthly: MonthlyAnalytics[];
  totalByCategory: Record<SubscriptionCategory, number>;
  totalPerMonthAverage: number;
}

export interface MonthlyForecastItem {
  month: string; // e.g. "2026-04"
  expectedTotal: number;
}

export interface Forecast {
  months: MonthlyForecastItem[];
  totalWeekSpending?: number;
  monthlyForecast?: number;
  yearlyForecast?: number;
  upcomingSubscriptions?: Subscription[];
  recommendations?: {
    topCategory?: SubscriptionCategory | null;
    mostExpensiveSubscription?: Subscription | null;
  };
}

export interface Recommendation {
  id: string;
  name: string;
  price: number;
  currency: 'RUB';
  category: SubscriptionCategory;
  description?: string;
  vendor?: string;
}

