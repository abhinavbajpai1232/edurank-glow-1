/**
 * Move of server admin helper into src/lib for Next.js route handlers
 * Keep using SERVICE ROLE KEY; this file must only be imported server-side
 */
import { createClient } from '@supabase/supabase-js';

const validateAdminEnv = (): { url: string; key: string } => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('Missing SUPABASE_URL environment variable');
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  return { url, key };
};

const env = validateAdminEnv();

export const supabaseAdmin = createClient(env.url, env.key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const adminOperations = {
  async verifyUserCoins(userId: string, coinsRequired: number) {
    const { data, error } = await supabaseAdmin.from('profiles').select('coins').eq('id', userId).single() as any;
    if (error) {
      console.error('Error fetching user coins:', error);
      return false;
    }
    return ((data as any)?.coins ?? 0) >= coinsRequired;
  },

  async deductCoins(userId: string, amount: number) {
    try {
      if (amount <= 0) throw new Error('Coin amount must be positive');
      const has = await this.verifyUserCoins(userId, amount);
      if (!has) return { success: false, error: 'Insufficient coins' };

      const { data, error } = await (supabaseAdmin.rpc('deduct_user_coins', { p_user_id: userId, p_amount: amount }) as any);
      if (error) return { success: false, error: 'Failed to deduct coins' };

      await this.logTransaction(userId, 'coin_deduction', { amount, reason: 'game_unlock' });
      return { success: true, remainingCoins: data };
    } catch (err) {
      console.error('Error in deductCoins:', err);
      return { success: false, error: 'Transaction failed' };
    }
  },

  async logTransaction(userId: string, transactionType: string, metadata: Record<string, any>) {
    try {
      await supabaseAdmin.from('coin_transactions').insert({ user_id: userId, action: transactionType, details: metadata, timestamp: new Date().toISOString() }) as any;
    } catch (err) {
      console.error('Error logging transaction:', err);
    }
  },
};

export default supabaseAdmin;
