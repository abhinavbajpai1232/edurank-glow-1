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
          const { data, error } = await supabase
            .from('profiles')
            .select('coins, unlocked_games')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data) {
            setCoins(data.coins ?? 0);
            setUnlockedGames(data.unlocked_games ?? []);
            // also mirror to localStorage for offline fallback
            try { localStorage.setItem(LOCAL_KEY, String(data.coins ?? 0)); } catch {}
            try { localStorage.setItem(LOCAL_UNLOCK_KEY, JSON.stringify(data.unlocked_games ?? [])); } catch {}
            setLoading(false);
            return;
          }
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

    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ coins: newCoins, unlocked_games: newUnlocked })
          .eq('user_id', user.id);

        if (error) {
          logError(error, 'update_coins');
        }
      } catch (err) {
        logError(err, 'update_coins');
      }
    }
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
    if (coins < amount) return false;
    const newCoins = Math.max(0, coins - amount);
    setCoins(newCoins);
    await persist(newCoins, unlockedGames);
    return true;
  };

  const unlockGame = async (gameId: string, price: number) => {
    if (unlockedGames.includes(gameId)) return true;
    if (coins < price) return false;
    const success = await deductCoins(price);
    if (!success) return false;
    const newUnlocked = [...unlockedGames, gameId];
    setUnlockedGames(newUnlocked);
    await persist(coins - price, newUnlocked);
    toast.success('Game unlocked!');
    return true;
  };

  const isUnlocked = (gameId: string) => unlockedGames.includes(gameId);

  return (
    <CoinContext.Provider value={{ coins, unlockedGames, addCoins, deductCoins, unlockGame, isUnlocked, loading }}>
      {children}
    </CoinContext.Provider>
  );
};

export default CoinContext;
