'use client';

import { useEffect, useState } from 'react';
import { FoodItem } from '@/types/food';
import { getFoodItems, saveFoodItems } from '@/lib/storage';
import { FoodItemCard } from '@/components/FoodItemCard';
import { AddFoodForm } from '@/components/AddFoodForm';

export default function Home() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setItems(getFoodItems());
    setIsLoaded(true);
  }, []);

  const handleAdd = (newItem: FoodItem) => {
    const updatedItems = [...items, newItem];
    // Sort by date
    updatedItems.sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
    setItems(updatedItems);
    saveFoodItems(updatedItems);
  };

  const handleDelete = (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);
    saveFoodItems(updatedItems);
  };

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">読み込み中...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 text-center">Food Saver 🥦</h1>

        <div className="mb-8">
          <AddFoodForm onAdd={handleAdd} />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            保存済み食品 ({items.length})
          </h2>
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">
                まだ食品が登録されていません。
                <br />
                上のフォームから追加してください。
              </p>
            </div>
          ) : (
            items.map((item) => (
              <FoodItemCard key={item.id} item={item} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
