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
    console.log('🔔 Cron job started');

    // Vercel Cron Jobsの認証チェック
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Unauthorized: Invalid CRON_SECRET');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Authentication passed');

    // 今日と明日の日付を取得
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const threeDaysStr = threeDays.toISOString().split('T')[0];

    console.log('📅 Date range:', { todayStr, tomorrowStr, threeDaysStr });

    // 期限が近い食品を取得（今日、明日、3日以内）
    const { data: expiringItems, error: itemsError } = await supabase
      .from('food_items')
      .select('user_id, name, expiration_date')
      .lte('expiration_date', threeDaysStr)
      .gte('expiration_date', todayStr)
      .order('expiration_date', { ascending: true });

    if (itemsError) {
      console.log('❌ Error fetching items:', itemsError);
      throw itemsError;
    }

    console.log(`📦 Found ${expiringItems?.length || 0} expiring items:`, expiringItems);

    if (!expiringItems || expiringItems.length === 0) {
      console.log('ℹ️ No expiring items found');
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

    console.log(`👥 Grouped into ${Object.keys(userItems).length} users`);

    // 各ユーザーに通知を送信
    const notifications = [];
    for (const [userId, items] of Object.entries(userItems)) {
      console.log(`\n👤 Processing user: ${userId}`);

      // ユーザーのサブスクリプションを取得
      const { data: subscription, error: subError } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .single();

      if (subError || !subscription) {
        console.log(`❌ No subscription for user ${userId}:`, subError);
        continue;
      }

      console.log(`✅ Found subscription for user ${userId}`);

      // 通知メッセージを作成（今日が期限のもののみ）
      const todayItems = items.filter(i => i.expiration_date === todayStr);

      if (todayItems.length === 0) {
        console.log(`ℹ️ No items expiring today for user ${userId}`);
        continue;
      }

      console.log(`📋 ${todayItems.length} items expiring today:`, todayItems.map(i => i.name));

      const message = `【今日が期限】\n${todayItems.map(i => `- ${i.name}`).join('\n')}`;

      // プッシュ通知を送信
      try {
        console.log(`📤 Sending notification to user ${userId}...`);
        await webpush.sendNotification(
          subscription.subscription,
          JSON.stringify({
            title: '🥦 [Food Saver] 消費期限のお知らせ',
            body: message,
            url: '/',
          })
        );
        console.log(`✅ Notification sent successfully to user ${userId}`);
        notifications.push({ userId, itemCount: todayItems.length, success: true });
      } catch (error) {
        console.error(`❌ Failed to send notification to user ${userId}:`, error);
        notifications.push({ userId, itemCount: todayItems.length, success: false, error: String(error) });
      }
    }

    const response = {
      message: 'Notifications sent',
      totalItems: expiringItems.length,
      notifications,
    };

    console.log('🎉 Cron job completed:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Cron job error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
