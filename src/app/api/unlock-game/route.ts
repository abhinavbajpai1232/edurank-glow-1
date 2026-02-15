import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin, { adminOperations } from '../../../lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(auth.replace('Bearer ', '')) as any;
    if (userError || !userData?.user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    const userId = userData.user.id;

    const body = await req.json();
    const { gameId, gameName, price } = body || {};
    if (!gameId || !gameName || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    // Verify server-side price from DB
    const { data: gameConfig, error: cfgErr } = await supabaseAdmin.from('game_unlocks').select('price').eq('game_id', gameId).single() as any;
    if (cfgErr || !gameConfig) return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    if (gameConfig.price !== price) return NextResponse.json({ success: false, error: 'Price mismatch' }, { status: 400 });

    // Verify and deduct coins
    const has = await adminOperations.verifyUserCoins(userId, price);
    if (!has) return NextResponse.json({ success: false, error: 'Insufficient coins' }, { status: 402 });

    const deductResult = await adminOperations.deductCoins(userId, price);
    if (!deductResult.success) return NextResponse.json({ success: false, error: deductResult.error || 'Deduction failed' }, { status: 500 });

    // Record unlock
    const { error: unlockError } = await supabaseAdmin.from('user_unlocks').insert({ user_id: userId, game_id: gameId, unlocked_at: new Date().toISOString() }) as any;
    if (unlockError) {
      console.error('Error recording unlock:', unlockError);
      return NextResponse.json({ success: false, error: 'Unlock failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Game \"${gameName}\" unlocked successfully`, remainingCoins: deductResult.remainingCoins });
  } catch (err) {
    console.error('Unexpected error in unlock-game route:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
