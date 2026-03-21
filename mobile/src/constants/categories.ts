import { ApiCategory } from '../api/client';

export interface CategoryConfig {
  id: number;
  label: string;
  icon: string;
  color: string;
}

const CATEGORY_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#5567FF',
  '#FFA41B',
  '#8E44AD',
  '#34D399',
  '#F59E0B',
  '#38BDF8',
  '#F472B6',
  '#A3E635',
];

const CATEGORY_ICONS = [
  'film',
  'music',
  'cpu',
  'truck',
  'cloud',
  'apps',
  'pricetag',
  'gift',
  'sparkles',
  'grid',
];

export const mapCategoriesToConfig = (categories: ApiCategory[]): CategoryConfig[] =>
  categories.map((category, index) => ({
    id: category.id,
    label: category.name,
    icon: CATEGORY_ICONS[index % CATEGORY_ICONS.length],
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

export const getCategoryLabel = (categories: ApiCategory[], categoryId?: number | null) => {
  if (!categoryId) return 'Без категории';
  return categories.find((cat) => cat.id === categoryId)?.name ?? 'Без категории';
};
