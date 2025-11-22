import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';

// VAPID設定
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || '',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Jobsの認証チェック
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 今日と明日の日付を取得
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const threeDaysStr = threeDays.toISOString().split('T')[0];

    // 期限が近い食品を取得（今日、明日、3日以内）
    const { data: expiringItems, error: itemsError } = await supabase
      .from('food_items')
      .select('user_id, name, expiration_date')
      .lte('expiration_date', threeDaysStr)
      .gte('expiration_date', todayStr)
      .order('expiration_date', { ascending: true });

    if (itemsError) throw itemsError;

    if (!expiringItems || expiringItems.length === 0) {
      return NextResponse.json({ message: 'No expiring items' });
    }

    // ユーザーごとにグループ化
    const userItems = expiringItems.reduce((acc, item) => {
      if (!acc[item.user_id]) {
        acc[item.user_id] = [];
      }
      acc[item.user_id].push(item);
      return acc;
    }, {} as Record<string, typeof expiringItems>);

    // 各ユーザーに通知を送信
    const notifications = [];
    for (const [userId, items] of Object.entries(userItems)) {
      // ユーザーのサブスクリプションを取得
      const { data: subscription, error: subError } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .single();

      if (subError || !subscription) {
        console.log(`No subscription for user ${userId}`);
        continue;
      }

      // 通知メッセージを作成（今日が期限のもののみ）
      const todayItems = items.filter(i => i.expiration_date === todayStr);

      if (todayItems.length === 0) {
        console.log(`No items expiring today for user ${userId}`);
        continue;
      }

      const message = `【今日が期限】\n${todayItems.map(i => `- ${i.name}`).join('\n')}`;

      // プッシュ通知を送信
      try {
        await webpush.sendNotification(
          subscription.subscription,
          JSON.stringify({
            title: '🥦 [Food Saver] 消費期限のお知らせ',
            body: message,
            url: '/',
          })
        );
        notifications.push({ userId, itemCount: todayItems.length, success: true });
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        notifications.push({ userId, itemCount: todayItems.length, success: false, error: String(error) });
      }
    }

    return NextResponse.json({
      message: 'Notifications sent',
      totalItems: expiringItems.length,
      notifications,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
