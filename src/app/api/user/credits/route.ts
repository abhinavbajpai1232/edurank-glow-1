import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(auth.replace('Bearer ', '')) as any;
    if (userError || !userData?.user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const userId = userData.user.id;

    // Call check_and_reset_credits RPC which returns current credits and handles reset
    const { data, error } = await (supabaseAdmin.rpc('check_and_reset_credits', { uid: userId }) as any);
    if (error) {
      console.error('check_and_reset_credits RPC error:', error);
      // Fallback: read directly
      const { data: creditData, error: creditError } = await supabaseAdmin
        .from('user_credits')
        .select('credits_remaining, credits_used, last_reset_at')
        .eq('user_id', userId)
        .single() as any;
      if (creditError) return NextResponse.json({ success: false, error: 'Failed to fetch credits' }, { status: 500 });
      return NextResponse.json({ success: true, creditsRemaining: creditData.credits_remaining, creditsUsed: creditData.credits_used, lastResetAt: creditData.last_reset_at });
    }

    const creditInfo = (data && data.length > 0) ? data[0] : null;
    return NextResponse.json({ success: true, creditsRemaining: creditInfo?.credits_remaining ?? 0, creditsUsed: creditInfo?.credits_used ?? 0, lastResetAt: creditInfo?.last_reset_at ?? null });
  } catch (err) {
    console.error('Unexpected error in user credits route:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
