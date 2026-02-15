import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(auth.replace('Bearer ', '')) as any;
    if (userError || !userData?.user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    const userId = userData.user.id;

    const { data, error } = await supabaseAdmin.from('profiles').select('coins').eq('id', userId).single() as any;
    if (error) {
      console.error('Error fetching coins:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch coins' }, { status: 500 });
    }

    return NextResponse.json({ success: true, coins: (data as any)?.coins ?? 0 });
  } catch (err) {
    console.error('Unexpected error in user coins route:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
