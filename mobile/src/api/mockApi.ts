import { AnalyticsSummary, Forecast, Recommendation, Subscription, SubscriptionCategory } from '../types';

const randomDelay = () =>
  new Promise<void>((resolve) => {
    const timeout = 500 + Math.floor(Math.random() * 300); // 500–800 мс
    setTimeout(resolve, timeout);
  });

let subscriptions: Subscription[] = [
  {
    id: 'sub_netflix',
    name: 'Netflix',
    price: 799,
    currency: 'RUB',
    billingPeriod: 'month',
    nextChargeDate: '2026-04-15',
    category: 'streaming',
    isActive: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'sub_yandex_plus',
    name: 'Яндекс Плюс',
    price: 299,
    currency: 'RUB',
    billingPeriod: 'month',
    nextChargeDate: '2026-04-10',
    category: 'streaming',
    isActive: true,
    createdAt: '2026-03-01T10:05:00.000Z',
    updatedAt: '2026-03-01T10:05:00.000Z',
  },
  {
    id: 'sub_chatgpt_plus',
    name: 'ChatGPT Plus',
    price: 999,
    currency: 'RUB',
    billingPeriod: 'month',
    nextChargeDate: '2026-04-20',
    category: 'software',
    isActive: true,
    createdAt: '2026-03-01T10:10:00.000Z',
    updatedAt: '2026-03-01T10:10:00.000Z',
  },
  {
    id: 'sub_sberprime',
    name: 'СберПрайм',
    price: 199,
    currency: 'RUB',
    billingPeriod: 'month',
    nextChargeDate: '2026-04-05',
    category: 'delivery',
    isActive: true,
    createdAt: '2026-03-01T10:15:00.000Z',
    updatedAt: '2026-03-01T10:15:00.000Z',
  },
  {
    id: 'sub_vk_music',
    name: 'VK Music',
    price: 149,
    currency: 'RUB',
    billingPeriod: 'month',
    nextChargeDate: '2026-04-12',
    category: 'music',
    isActive: true,
    createdAt: '2026-03-01T10:20:00.000Z',
    updatedAt: '2026-03-01T10:20:00.000Z',
  },
  {
    id: 'sub_yandex_cloud',
    name: 'Яндекс Облако',
    price: 490,
    currency: 'RUB',
    billingPeriod: 'month',
    nextChargeDate: '2026-05-01',
    category: 'cloud',
    isActive: true,
    createdAt: '2026-03-01T10:25:00.000Z',
    updatedAt: '2026-03-01T10:25:00.000Z',
  },
];

const recommendationsByCategory: Record<SubscriptionCategory, Recommendation[]> = {
  streaming: [
    {
      id: 'rec_okko',
      name: 'Okko',
      price: 399,
      currency: 'RUB',
      category: 'streaming',
      description: 'Онлайн-кинотеатр с фокусом на российский и зарубежный контент.',
      vendor: 'Okko',
    },
    {
      id: 'rec_ivi',
      name: 'Иви',
      price: 399,
      currency: 'RUB',
      category: 'streaming',
      description: 'Большая библиотека фильмов и сериалов, в том числе по подписке.',
      vendor: 'IVI',
    },
    {
      id: 'rec_kinopoisk_plus',
      name: 'Кинопоиск Плюс',
      price: 349,
      currency: 'RUB',
      category: 'streaming',
      description: 'Фильмы, сериалы и интеграция с Яндекс Плюс.',
      vendor: 'Яндекс',
    },
  ],
  software: [
    {
      id: 'rec_copilot',
      name: 'GitHub Copilot',
      price: 790,
      currency: 'RUB',
      category: 'software',
      description: 'ИИ-помощник для разработчиков в популярных IDE.',
      vendor: 'GitHub',
    },
    {
      id: 'rec_microsoft_365',
      name: 'Microsoft 365',
      price: 599,
      currency: 'RUB',
      category: 'software',
      description: 'Офисный пакет и облачное хранилище.',
      vendor: 'Microsoft',
    },
    {
      id: 'rec_jetbrains',
      name: 'JetBrains All Products Pack',
      price: 1290,
      currency: 'RUB',
      category: 'software',
      description: 'Комплект IDE для профессиональной разработки.',
      vendor: 'JetBrains',
    },
  ],
  delivery: [
    {
      id: 'rec_yandex_eats',
      name: 'Яндекс Еда Плюс',
      price: 199,
      currency: 'RUB',
      category: 'delivery',
      description: 'Скидки и бесплатная доставка при заказе еды.',
      vendor: 'Яндекс',
    },
    {
      id: 'rec_samokat',
      name: 'Самокат Прайм',
      price: 249,
      currency: 'RUB',
      category: 'delivery',
      description: 'Подписка на быструю доставку продуктов.',
      vendor: 'Самокат',
    },
    {
      id: 'rec_ozon_premium',
      name: 'Ozon Премиум',
      price: 199,
      currency: 'RUB',
      category: 'delivery',
      description: 'Скидки и бесплатная доставка на маркетплейсе.',
      vendor: 'Ozon',
    },
  ],
  music: [
    {
      id: 'rec_yandex_music',
      name: 'Яндекс Музыка',
      price: 199,
      currency: 'RUB',
      category: 'music',
      description: 'Музыкальный стриминг с плейлистами по настроению.',
      vendor: 'Яндекс',
    },
    {
      id: 'rec_apple_music',
      name: 'Apple Music',
      price: 349,
      currency: 'RUB',
      category: 'music',
      description: 'Музыка и персональные рекомендации от Apple.',
      vendor: 'Apple',
    },
    {
      id: 'rec_spotify_alt',
      name: 'Spotify (альтернативный доступ)',
      price: 399,
      currency: 'RUB',
      category: 'music',
      description: 'Международный музыкальный сервис (доступ зависит от региона).',
      vendor: 'Spotify',
    },
  ],
  cloud: [
    {
      id: 'rec_s3',
      name: 'Amazon S3',
      price: 600,
      currency: 'RUB',
      category: 'cloud',
      description: 'Облачное хранилище для проектов и бэкапов.',
      vendor: 'AWS',
    },
    {
      id: 'rec_gcp',
      name: 'Google Cloud Storage',
      price: 650,
      currency: 'RUB',
      category: 'cloud',
      description: 'Глобальное облачное хранилище от Google.',
      vendor: 'Google',
    },
    {
      id: 'rec_vk_cloud',
      name: 'VK Cloud',
      price: 450,
      currency: 'RUB',
      category: 'cloud',
      description: 'Российский облачный провайдер для бизнеса и разработчиков.',
      vendor: 'VK',
    },
  ],
};

const generateId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

const getMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

export const getSubscriptions = async (): Promise<Subscription[]> => {
  await randomDelay();
  return [...subscriptions].sort((a, b) =>
    a.nextChargeDate.localeCompare(b.nextChargeDate),
  );
};

export const addSubscription = async (sub: Partial<Subscription>): Promise<Subscription> => {
  await randomDelay();
  const nowIso = new Date().toISOString();

  const nextChargeDate =
    sub.nextChargeDate ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const newSub: Subscription = {
    id: sub.id ?? generateId('sub'),
    name: sub.name ?? 'Новая подписка',
    price: sub.price ?? 0,
    currency: 'RUB',
    billingPeriod: 'month',
    nextChargeDate,
    category: (sub.category as SubscriptionCategory) ?? 'software',
    isActive: sub.isActive ?? true,
    createdAt: nowIso,
    updatedAt: nowIso,
    notes: sub.notes,
  };

  subscriptions = [...subscriptions, newSub];
  return newSub;
};

export const updateSubscription = async (
  id: string,
  data: Partial<Subscription>,
): Promise<Subscription | null> => {
  await randomDelay();
  const index = subscriptions.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const updated: Subscription = {
    ...subscriptions[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  subscriptions = [
    ...subscriptions.slice(0, index),
    updated,
    ...subscriptions.slice(index + 1),
  ];
  return updated;
};

export const deleteSubscription = async (id: string): Promise<boolean> => {
  await randomDelay();
  const before = subscriptions.length;
  subscriptions = subscriptions.filter((s) => s.id !== id);
  return subscriptions.length < before;
};

const detectCategoryByName = (name: string): SubscriptionCategory => {
  const lower = name.toLowerCase();
  if (lower.includes('music') || lower.includes('музы')) return 'music';
  if (lower.includes('yandex') || lower.includes('яндекс') || lower.includes('кинопоиск')) {
    if (lower.includes('облако') || lower.includes('cloud')) return 'cloud';
    if (lower.includes('музык')) return 'music';
    return 'streaming';
  }
  if (lower.includes('vk')) {
    if (lower.includes('music') || lower.includes('музы')) return 'music';
    return 'streaming';
  }
  if (
    lower.includes('cloud') ||
    lower.includes('облако') ||
    lower.includes('aws') ||
    lower.includes('gcp')
  ) {
    return 'cloud';
  }
  if (
    lower.includes('prime') ||
    lower.includes('прайм') ||
    lower.includes('доставк') ||
    lower.includes('еда')
  ) {
    return 'delivery';
  }
  return 'software';
};

export const importFromEmail = async (text: string): Promise<Subscription | null> => {
  await randomDelay();

  const normalized = text.replace(/\s+/g, ' ').trim();

  if (
    !/списани/i.test(normalized) &&
    !/подписк/i.test(normalized) &&
    !/руб\./i.test(normalized)
  ) {
    return null;
  }

  const amountMatch = normalized.match(/(\d[\d\s]*)\s*руб\./i);
  const amount = amountMatch
    ? Number(amountMatch[1].replace(/\s/g, ''))
    : 0;

  let name = 'Подписка';
  const subscriptionWordIndex = normalized.toLowerCase().indexOf('подписк');
  if (subscriptionWordIndex >= 0) {
    const after = normalized.slice(subscriptionWordIndex);
    const nameMatch = after.match(/подписка(?: на)?\s+([A-Za-zА-Яа-я0-9+.\-\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      name = nameMatch[1].trim();
    }
  } else {
    const words = normalized.split(' ');
    const serviceCandidates = words.filter((w) =>
      /[A-Za-zА-Яа-я]/.test(w),
    );
    if (serviceCandidates.length > 0) {
      name = serviceCandidates[serviceCandidates.length - 1];
    }
  }

  const category = detectCategoryByName(name);

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const nextChargeDate = nextMonth.toISOString().slice(0, 10);

  const created = await addSubscription({
    name,
    price: amount,
    category,
    nextChargeDate,
  });

  return created;
};

export const getAnalytics = async (): Promise<AnalyticsSummary> => {
  await randomDelay();
  const byMonth: Record<
    string,
    {
      total: number;
      byCategory: Record<SubscriptionCategory, number>;
    }
  > = {};

  const totalByCategory: Record<SubscriptionCategory, number> = {
    streaming: 0,
    software: 0,
    delivery: 0,
    music: 0,
    cloud: 0,
  };

  subscriptions.forEach((sub) => {
    const date = new Date(sub.nextChargeDate);
    if (Number.isNaN(date.getTime())) return;
    const key = getMonthKey(date);

    if (!byMonth[key]) {
      byMonth[key] = {
        total: 0,
        byCategory: {
          streaming: 0,
          software: 0,
          delivery: 0,
          music: 0,
          cloud: 0,
        },
      };
    }

    byMonth[key].total += sub.price;
    byMonth[key].byCategory[sub.category] += sub.price;
    totalByCategory[sub.category] += sub.price;
  });

  const monthKeys = Object.keys(byMonth).sort();
  const monthly = monthKeys.map((month) => ({
    month,
    total: byMonth[month].total,
    byCategory: byMonth[month].byCategory,
  }));

  const totalSum = monthly.reduce((acc, m) => acc + m.total, 0);
  const totalPerMonthAverage =
    monthly.length > 0 ? Math.round((totalSum / monthly.length) * 100) / 100 : 0;

  return {
    monthly,
    totalByCategory,
    totalPerMonthAverage,
  };
};

export const getForecast = async (): Promise<Forecast> => {
  await randomDelay();
  const now = new Date();
  const months: { month: string; expectedTotal: number }[] = [];

  for (let i = 0; i < 12; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = getMonthKey(date);
    const expectedTotal = subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + s.price, 0);

    months.push({
      month: monthKey,
      expectedTotal,
    });
  }

  return { months };
};

export const getRecommendations = async (
  category: SubscriptionCategory,
): Promise<Recommendation[]> => {
  await randomDelay();
  const recs = recommendationsByCategory[category] ?? [];
  return recs.slice(0, 3);
};

