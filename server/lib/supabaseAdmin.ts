/**
 * Backend Supabase Admin Client
 * 
 * ⚠️ SECURITY CRITICAL ⚠️
 * This client uses the SERVICE ROLE KEY - never expose it to the frontend!
 * Only use this in backend/server-side code for sensitive operations:
 * - Coin validation and deduction
 * - Admin updates
 * - Secure unlock logic
 * - Bypass RLS for trusted transactions
 */

import { createClient } from '@supabase/supabase-js';

// Validate required environment variables on import
const validateAdminEnv = (): { url: string; key: string } => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return { url, key };
};

const env = validateAdminEnv();

/**
 * Admin client with service role privileges
 * ⚠️ Use ONLY for server-side operations that need to bypass RLS
 */
export const supabaseAdmin = createClient(
  env.url,
  env.key,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Type-safe wrapper for admin operations
 * Logs all sensitive operations for audit trail
 */
export const adminOperations = {
  /**
   * Verify user owns the specified coins
   * @param userId - The user ID
   * @param coinsRequired - Number of coins needed
   * @returns true if user has enough coins, false otherwise
   */
  async verifyUserCoins(userId: string, coinsRequired: number) {
    try {
      const { data, error } = await (supabaseAdmin
        .from('profiles')
        .select('coins')
        .eq('id', userId)
        .single() as any);

      if (error) {
        console.error('Error fetching user coins:', error);
        return false;
      }

      return ((data as any)?.coins ?? 0) >= coinsRequired;
    } catch (error) {
      console.error('Error in verifyUserCoins:', error);
      return false;
    }
  },

  /**
   * Deduct coins from user account (server-side validation)
   * @param userId - The user ID
   * @param amount - Number of coins to deduct
   * @returns Success status
   */
  async deductCoins(userId: string, amount: number) {
    try {
      if (amount <= 0) {
        throw new Error('Coin amount must be positive');
      }

      // First verify user has enough coins
      const hasCoins = await this.verifyUserCoins(userId, amount);
      if (!hasCoins) {
        return {
          success: false,
          error: 'Insufficient coins',
        };
      }

      // Deduct coins using RPC or direct update
      const { data, error } = await (supabaseAdmin.rpc(
        'deduct_user_coins',
        {
          p_user_id: userId,
          p_amount: amount,
        }
      ) as any);

      if (error) {
        console.error('Error deducting coins:', error);
        return {
          success: false,
          error: 'Failed to deduct coins',
        };
      }

      // Log the transaction
      await this.logTransaction(userId, 'coin_deduction', {
        amount,
        reason: 'game_unlock',
      });

      return {
        success: true,
        remainingCoins: data,
      };
    } catch (error) {
      console.error('Error in deductCoins:', error);
      return {
        success: false,
        error: 'Transaction failed',
      };
    }
  },

  /**
   * Log audit trail for sensitive operations
   */
  async logTransaction(
    userId: string,
    transactionType: string,
    metadata: Record<string, any>
  ) {
    try {
      await (supabaseAdmin.from('coin_transactions').insert({
        user_id: userId,
        action: transactionType,
        details: metadata,
        timestamp: new Date().toISOString(),
      }) as any);
    } catch (error) {
      console.error('Error logging transaction:', error);
      // Continue even if logging fails - don't block the main operation
    }
  },
};

export default supabaseAdmin;
