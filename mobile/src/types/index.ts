export type SubscriptionCategoryId = number;

export type BillingPeriod = 'day' | 'week' | 'month' | 'year';

export interface Subscription {
  id: string;
  backendId?: number;
  name: string;
  price: number;
  currency: string;
  billingPeriod: BillingPeriod;
  billingInterval?: number;
  startDate?: string;
  nextChargeDate: string; // ISO string
  categoryId?: number | null;
  categoryName?: string | null;
  isActive: boolean;
  status?: 'active' | 'paused' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  description?: string;
  notes?: string;
  url?: string;
  usageCount?: number;
  lastUsedAt?: string;
}

export interface MonthlyAnalytics {
  month: string; // e.g. "2026-04"
  total: number;
  byCategory: Record<string, number>;
}

export interface AnalyticsSummary {
  monthly: MonthlyAnalytics[];
  totalByCategory: Record<string, number>;
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
    topCategory?: SubscriptionCategoryId | null;
    mostExpensiveSubscription?: Subscription | null;
  };
}

export interface Recommendation {
  id: string;
  name: string;
  price: number;
  currency: 'RUB';
  category: SubscriptionCategoryId;
  description?: string;
  vendor?: string;
}

