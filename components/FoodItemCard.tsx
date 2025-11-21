import { FoodItem } from '@/types/food';
import { StatusBadge } from './StatusBadge';
import { Trash2 } from 'lucide-react';

interface FoodItemCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
}

export const FoodItemCard = ({ item, onDelete }: FoodItemCardProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <StatusBadge expirationDate={item.expirationDate} />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          期限: {item.expirationDate} | {item.category}
        </p>
        {item.note && <p className="text-xs text-gray-400 mt-1">{item.note}</p>}
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="ml-4 rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        aria-label="削除"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
};
