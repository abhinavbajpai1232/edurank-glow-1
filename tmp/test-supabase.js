import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('Running quick profiles query...');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id').limit(1);
    if (pErr) {
      console.error('Profiles query error:', pErr.message || pErr);
    } else {
      console.log('Profiles query OK:', profiles?.length ?? 0, 'rows');
    }

    console.log('Checking user_credits table...');
    const { data: uc, error: ucErr } = await supabase.from('user_credits').select('user_id, credits_remaining').limit(1);
    if (ucErr) {
      console.error('user_credits query error:', ucErr.message || ucErr);
    } else {
      console.log('user_credits OK:', uc?.length ?? 0, 'rows');
    }

    console.log('Attempting to call consume_credits RPC (dry run for a fake uuid)...');
    try {
      const testUid = '00000000-0000-0000-0000-000000000000';
      const { data: rpcData, error: rpcErr } = await supabase.rpc('consume_credits', { uid: testUid, amount: 0 });
      if (rpcErr) {
        console.error('RPC consume_credits error:', rpcErr.message || rpcErr);
      } else {
        console.log('RPC consume_credits OK:', rpcData);
      }
    } catch (e) {
      console.error('RPC call threw:', e.message || e);
    }

    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err.message || err);
    process.exit(1);
  }
})();
