import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Home,
  Tv,
  HeartPulse,
  GraduationCap,
  ArrowLeftRight,
  Landmark,
  Wallet,
  Folder,
  Tag
} from 'lucide-react';
import type { Category } from '../utils/types';

interface CategoryIconProps {
  category: Category | string;
  size?: number;
  className?: string;
  color?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  'Food & Dining': Utensils,
  'Shopping': ShoppingBag,
  'Transport': Car,
  'Utilities': Zap,
  'Rent': Home,
  'Subscriptions': Tv,
  'Health': HeartPulse,
  'Education': GraduationCap,
  'Transfer': ArrowLeftRight,
  'ATM': Landmark,
  'Salary': Wallet,
  'Other': Folder,
};

export default function CategoryIcon({ category, size = 16, className, color }: CategoryIconProps) {
  const IconComponent = ICON_MAP[category] || Tag;
  return <IconComponent size={size} className={className} color={color} />;
}
