export type FoodCategory = '野菜' | '肉・魚' | '乳製品' | '調味料' | '飲料' | 'その他';

export interface FoodItem {
  id: string;
  name: string;
  expirationDate: string; // YYYY-MM-DD format
  category: FoodCategory;
  note?: string;
  createdAt: number;
}
