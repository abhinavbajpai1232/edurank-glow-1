import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCoins } from '@/contexts/CoinContext';
import { ShieldCheck, Lock, Play } from 'lucide-react';

const GAMES = [
  {
    id: 'epic-era-battles',
    title: 'Epic Era Battles',
    description: 'A strategy battle game. Short skirmishes, big decisions.',
    price: 100,
  },
  {
    id: 'rushlane-x',
    title: 'Rushlane X',
    description: 'A fast-paced arcade runner with powerups and score-chasing.',
    price: 300,
  },
];

const Games: React.FC = () => {
  const navigate = useNavigate();
  const { coins, isUnlocked, unlockGame } = useCoins();

  const handleUnlock = async (gameId: string, price: number) => {
    if (isUnlocked(gameId)) {
      navigate(`/games/${gameId}`);
      return;
    }

    if (coins < price) {
      const need = price - coins;
      alert(`You need ${need} more coins to unlock this game.`);
      return;
    }

    const confirmed = confirm(`Spend ${price} coins to unlock this game?`);
    if (!confirmed) return;
    const ok = await unlockGame(gameId, price);
    if (ok) navigate(`/games/${gameId}`);
  };

  return (
    <div className="min-h-screen container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🎮 Games</h1>
      <p className="text-sm text-muted-foreground mb-6">Play mini-games using coins earned from quizzes.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES.map((g) => (
          <div key={g.id} className="glass-card p-4 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{g.title}</h2>
                <p className="text-sm text-muted-foreground">{g.description}</p>
                <div className="mt-3 text-sm">Price: <b>{g.price}</b> coins</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isUnlocked(g.id) ? (
                  <div className="flex items-center gap-2 text-success">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm">Unlocked</span>
                  </div>
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Button onClick={() => handleUnlock(g.id, g.price)}>
                    {isUnlocked(g.id) ? <Play className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />} 
                    {isUnlocked(g.id) ? 'Play' : 'Unlock'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;
