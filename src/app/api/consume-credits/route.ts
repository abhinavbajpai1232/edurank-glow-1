import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amount = typeof body?.amount === 'number' ? body.amount : 2;

    // Read authorization header forwarded from client
    const auth = req.headers.get('authorization') || '';

    // Require Authorization header (JWT) for user context
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user via Supabase admin
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(auth.replace('Bearer ', '')) as any;
    if (userError || !userData?.user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    const userId = userData.user.id;

    // Call RPC function consume_credits
    const { data, error } = await (supabaseAdmin.rpc('consume_credits', { uid: userId, amount: amount }) as any);

    if (error) {
      console.error('consume_credits RPC error:', error);
      return NextResponse.json({ success: false, error: 'Credit consumption failed' }, { status: 400 });
    }

    // Return updated credits
    const { data: creditData, error: creditError } = await supabaseAdmin
      .from('user_credits')
      .select('credits_remaining, credits_used, last_reset_at')
      .eq('user_id', userId)
      .single() as any;

    if (creditError) {
      return NextResponse.json({ success: true, message: 'Consumed', creditsRemaining: null }, { status: 200 });
    }

    return NextResponse.json({ success: true, creditsRemaining: creditData.credits_remaining, creditsUsed: creditData.credits_used, lastResetAt: creditData.last_reset_at });
  } catch (err) {
    console.error('Unexpected error in consume-credits route:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
