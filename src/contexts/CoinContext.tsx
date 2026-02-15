import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/utils/errorHandler';
import { toast } from 'sonner';

type CoinContextType = {
  coins: number;
  unlockedGames: string[];
  addCoins: (amount: number) => Promise<void>;
  deductCoins: (amount: number) => Promise<boolean>;
  unlockGame: (gameId: string, price: number) => Promise<boolean>;
  isUnlocked: (gameId: string) => boolean;
  loading: boolean;
};

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export const useCoins = () => {
  const ctx = useContext(CoinContext);
  if (!ctx) throw new Error('useCoins must be used within CoinProvider');
  return ctx;
};

const LOCAL_KEY = 'bb_coins_v1';
const LOCAL_UNLOCK_KEY = 'bb_unlocked_games_v1';

export const CoinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [coins, setCoins] = useState<number>(0);
  const [unlockedGames, setUnlockedGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // Try to load from backend if user is present
      if (user) {
        try {
          // Fetch coins from secure server endpoint
          const session = await supabase.auth.getSession();
          const token = (session as any)?.data?.session?.access_token;
          if (token) {
            const resp = await fetch('/api/user/coins', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await resp.json();
            if (json?.success) {
              setCoins(json.coins ?? 0);
            }
          }
          // Load unlocked games from profiles as fallback
          try {
            const { data: pdata, error: perror } = await supabase.from('profiles').select('unlocked_games').eq('user_id', user.id).maybeSingle();
            if (!perror && pdata) setUnlockedGames(pdata.unlocked_games ?? []);
          } catch (e) {}
          // mirror to localStorage for offline fallback
          try { localStorage.setItem(LOCAL_KEY, String(coins ?? 0)); } catch {}
          try { localStorage.setItem(LOCAL_UNLOCK_KEY, JSON.stringify(unlockedGames ?? [])); } catch {}
          setLoading(false);
          return;
        } catch (err) {
          logError(err, 'load_coin_profile');
        }
      }

      // Fallback to localStorage
      try {
        const c = Number(localStorage.getItem(LOCAL_KEY) ?? '0');
        const u = JSON.parse(localStorage.getItem(LOCAL_UNLOCK_KEY) || '[]');
        setCoins(Number.isFinite(c) ? c : 0);
        setUnlockedGames(Array.isArray(u) ? u : []);
      } catch (err) {
        setCoins(0);
        setUnlockedGames([]);
      }
      setLoading(false);
    };

    init();
  }, [user]);

  const persist = async (newCoins: number, newUnlocked: string[]) => {
    // update localStorage
    try { localStorage.setItem(LOCAL_KEY, String(newCoins)); } catch {}
    try { localStorage.setItem(LOCAL_UNLOCK_KEY, JSON.stringify(newUnlocked)); } catch {}

    // Do not persist authoritative coin state from client. Server must be used for any updates.
  };

  const addCoins = async (amount: number) => {
    if (amount <= 0) return;
    const newCoins = Math.max(0, coins + amount);
    setCoins(newCoins);
    await persist(newCoins, unlockedGames);
    // subtle toast animation
    toast.success(`+${amount} coins`);
  };

  const deductCoins = async (amount: number) => {
    if (amount <= 0) return true;
    // Use server-side deduct via unlock endpoint when used for unlocking games.
    // For generic deduction, this client-side helper will optimistically update UI but should be replaced by server call.
    if (coins < amount) return false;
    const newCoins = Math.max(0, coins - amount);
    setCoins(newCoins);
    try { await persist(newCoins, unlockedGames); } catch {}
    return true;
  };

  const unlockGame = async (gameId: string, price: number) => {
    if (unlockedGames.includes(gameId)) return true;
    if (coins < price) return false;
    // Call server unlock endpoint which validates and deducts atomically
    try {
      const session = await supabase.auth.getSession();
      const token = (session as any)?.data?.session?.access_token;
      const resp = await fetch('/api/unlock-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ gameId, gameName: gameId, price }),
      });
      const json = await resp.json();
      if (!json?.success) {
        toast.error(json?.error || 'Failed to unlock');
        return false;
      }
      // Update local state from server response
      setCoins(json.remainingCoins ?? Math.max(0, coins - price));
      const newUnlocked = [...unlockedGames, gameId];
      setUnlockedGames(newUnlocked);
      try { localStorage.setItem(LOCAL_UNLOCK_KEY, JSON.stringify(newUnlocked)); } catch {}
      toast.success('Game unlocked!');
      return true;
    } catch (err) {
      logError(err, 'unlock_game');
      return false;
    }
  };

  const isUnlocked = (gameId: string) => unlockedGames.includes(gameId);

  return (
    <CoinContext.Provider value={{ coins, unlockedGames, addCoins, deductCoins, unlockGame, isUnlocked, loading }}>
      {children}
    </CoinContext.Provider>
  );
};

export default CoinContext;
