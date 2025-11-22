import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// サーバー側用のSupabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!userId || !subscription) {
      return NextResponse.json({ error: 'Missing userId or subscription' }, { status: 400 });
    }

    // サブスクリプションをSupabaseに保存
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Failed to save subscription:', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
