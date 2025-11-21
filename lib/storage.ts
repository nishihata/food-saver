import { FoodItem } from '@/types/food';

const STORAGE_KEY = 'food-saver-items';

export const getFoodItems = (): FoodItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('データの読み込みに失敗しました', error);
    return [];
  }
};

export const saveFoodItems = (items: FoodItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('データの保存に失敗しました', error);
    throw new Error('保存に失敗しました。容量がいっぱいかもしれません。');
  }
};

export const addFoodItem = (item: FoodItem): void => {
  const items = getFoodItems();
  saveFoodItems([...items, item]);
};

export const removeFoodItem = (id: string): void => {
  const items = getFoodItems();
  saveFoodItems(items.filter((item) => item.id !== id));
};
