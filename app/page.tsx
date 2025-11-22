'use client';

import { useEffect, useState } from 'react';
import { FoodItem } from '@/types/food';
import { getFoodItems, addFoodItem, removeFoodItem, migrateFromLocalStorage } from '@/lib/storage';
import { FoodItemCard } from '@/components/FoodItemCard';
import { AddFoodForm } from '@/components/AddFoodForm';

export default function Home() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // LocalStorageからSupabaseへデータ移行
      await migrateFromLocalStorage();

      // データを取得
      const data = await getFoodItems();
      setItems(data);
      setIsLoaded(true);
    };

    loadData();

    // 通知許可の状態をチェック
    if ('Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleAdd = async (newItem: Omit<FoodItem, 'id' | 'createdAt'>) => {
    const added = await addFoodItem(newItem);
    if (added) {
      const data = await getFoodItems();
      setItems(data);
    }
  };

  const handleEnableNotifications = async () => {
    const { setupPushNotifications } = await import('@/lib/notifications');
    const success = await setupPushNotifications();
    if (success) {
      setNotificationEnabled(true);
      alert('通知が有効になりました！');
    } else {
      alert('通知の有効化に失敗しました。');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    const success = await removeFoodItem(id);
    if (success) {
      const data = await getFoodItems();
      setItems(data);
    }
  };

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">読み込み中...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 text-center">Food Saver 🥦</h1>

        {!notificationEnabled && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-sm text-blue-900">
              消費期限が近づいたら通知でお知らせします
            </p>
            <button
              onClick={handleEnableNotifications}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              🔔 通知を有効にする
            </button>
          </div>
        )}

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
