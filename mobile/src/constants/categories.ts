import { SubscriptionCategory } from '../types';

export interface CategoryConfig {
  id: SubscriptionCategory;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'streaming',
    label: 'Видео и медиа',
    icon: 'film',
    color: '#FF6B6B',
  },
  {
    id: 'music',
    label: 'Музыка',
    icon: 'music',
    color: '#4ECDC4',
  },
  {
    id: 'software',
    label: 'Софт и ИИ',
    icon: 'cpu',
    color: '#5567FF',
  },
  {
    id: 'delivery',
    label: 'Доставка и сервисы',
    icon: 'truck',
    color: '#FFA41B',
  },
  {
    id: 'cloud',
    label: 'Облако и хостинг',
    icon: 'cloud',
    color: '#8E44AD',
  },
];

export const CATEGORY_LABELS: Record<SubscriptionCategory, string> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category.label;
    return acc;
  },
  {} as Record<SubscriptionCategory, string>,
);

