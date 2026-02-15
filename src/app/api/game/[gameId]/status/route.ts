import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabaseAdmin';

export async function GET(req: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(auth.replace('Bearer ', '')) as any;
    if (userError || !userData?.user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    const userId = userData.user.id;

    const { gameId } = params;
    if (!gameId) return NextResponse.json({ success: false, error: 'gameId required' }, { status: 400 });

    const { data, error } = await supabaseAdmin.from('user_unlocks').select('unlocked_at').eq('user_id', userId).eq('game_id', gameId).maybeSingle() as any;
    if (error) {
      // PGRST116 may be used by rest; handle generally
      if (error.code !== 'PGRST116') {
        console.error('Error checking unlock status:', error);
        return NextResponse.json({ success: false, error: 'Failed to check unlock status' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, unlocked: !!data, unlockedAt: (data as any)?.unlocked_at || null });
  } catch (err) {
    console.error('Unexpected error in game status route:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
