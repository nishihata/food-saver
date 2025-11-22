import { supabase } from './supabase';
import { FoodItem } from '@/types/food';

/**
 * 匿名ユーザーとしてサインイン
 */
export const ensureAuth = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    return session.user.id;
  }

  // 匿名ユーザーとしてサインイン
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('匿名認証に失敗しました', error);
    throw error;
  }

  return data.user!.id;
};

/**
 * 食品アイテムを取得
 */
export const getFoodItems = async (): Promise<FoodItem[]> => {
  try {
    await ensureAuth();

    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .order('expiration_date', { ascending: true });

    if (error) throw error;

    // Supabaseのデータ形式をFoodItem形式に変換
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      expirationDate: item.expiration_date,
      category: item.category,
      note: item.note,
      createdAt: new Date(item.created_at).getTime(),
    }));
  } catch (error) {
    console.error('食品アイテムの取得に失敗しました', error);
    return [];
  }
};

/**
 * 食品アイテムを保存（互換性のために残す）
 */
export const saveFoodItems = async (items: FoodItem[]): Promise<void> => {
  console.warn('saveFoodItems is deprecated. Use addFoodItem instead.');
};

/**
 * 食品アイテムを追加
 */
export const addFoodItem = async (item: Omit<FoodItem, 'id' | 'createdAt'>): Promise<FoodItem | null> => {
  try {
    const userId = await ensureAuth();

    const { data, error } = await supabase
      .from('food_items')
      .insert([{
        user_id: userId,
        name: item.name,
        expiration_date: item.expirationDate,
        category: item.category,
        note: item.note || null,
      }])
      .select()
      .single();

    if (error) throw error;

    // Supabaseのデータ形式をFoodItem形式に変換
    return {
      id: data.id,
      name: data.name,
      expirationDate: data.expiration_date,
      category: data.category,
      note: data.note,
      createdAt: new Date(data.created_at).getTime(),
    };
  } catch (error) {
    console.error('食品アイテムの追加に失敗しました', error);
    return null;
  }
};

/**
 * 食品アイテムを削除
 */
export const removeFoodItem = async (id: string): Promise<boolean> => {
  try {
    await ensureAuth();

    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('食品アイテムの削除に失敗しました', error);
    return false;
  }
};

/**
 * LocalStorageからSupabaseへデータを移行
 */
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    if (typeof window === 'undefined') return;

    const localData = localStorage.getItem('food-saver-items');
    if (!localData) return;

    const items: FoodItem[] = JSON.parse(localData);
    if (items.length === 0) return;

    const userId = await ensureAuth();

    // 既存のデータをチェック
    const { data: existingItems } = await supabase
      .from('food_items')
      .select('id')
      .limit(1);

    // すでにデータがある場合は移行しない
    if (existingItems && existingItems.length > 0) {
      console.log('Supabaseにすでにデータが存在するため、移行をスキップします');
      return;
    }

    // LocalStorageのデータをSupabaseに移行
    const itemsToInsert = items.map(item => ({
      user_id: userId,
      name: item.name,
      expiration_date: item.expirationDate,
      category: item.category,
      note: item.note || null,
    }));

    const { error } = await supabase
      .from('food_items')
      .insert(itemsToInsert);

    if (error) throw error;

    console.log(`${items.length}件のアイテムをSupabaseに移行しました`);

    // 移行成功後、LocalStorageをクリア
    localStorage.removeItem('food-saver-items');
  } catch (error) {
    console.error('データ移行に失敗しました', error);
  }
};
