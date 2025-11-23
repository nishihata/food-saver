import { useState } from 'react';
import { FoodCategory, FoodItem } from '@/types/food';
import { Plus } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { OCRResult } from '@/lib/ocr';

interface AddFoodFormProps {
  onAdd: (item: Omit<FoodItem, 'id' | 'createdAt'>) => void;
}

export const AddFoodForm = ({ onAdd }: AddFoodFormProps) => {
  const [name, setName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [category, setCategory] = useState<FoodCategory>('その他');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expirationDate) return;

    onAdd({
      name,
      expirationDate,
      category,
      note,
    });

    // Reset form
    setName('');
    setExpirationDate('');
    setCategory('その他');
    setNote('');
  };


  const handleOCRResult = (result: OCRResult) => {
    // 消費期限が認識できた場合は自動入力
    if (result.expirationDate) {
      setExpirationDate(result.expirationDate);
    }

    // 商品名が認識できた場合は自動入力（既存の値がない場合のみ）
    if (result.productName && !name) {
      setName(result.productName);
    }

    // カテゴリーが認識できた場合は自動入力
    if (result.category) {
      setCategory(result.category as FoodCategory);
    }

    // 認識結果をメモ欄に追加（デバッグ用）
    if (result.text) {
      setNote((prev) => {
        const newNote = `[認識結果]\n${result.text}`;
        return prev ? `${prev}\n\n${newNote}` : newNote;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">食品を追加</h2>

      {/* カメラボタン */}
      <CameraCapture onResult={handleOCRResult} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          食品名
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
          消費期限
        </label>
        <input
          type="date"
          id="expirationDate"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ maxWidth: '100%' }}
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          カテゴリー
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as FoodCategory)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="野菜">野菜</option>
          <option value="肉・魚">肉・魚</option>
          <option value="乳製品">乳製品</option>
          <option value="調味料">調味料</option>
          <option value="飲料">飲料</option>
          <option value="その他">その他</option>
        </select>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
          メモ (任意)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <Plus size={20} />
        追加する
      </button>
    </form>
  );
};
