import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCoins } from '@/contexts/CoinContext';
import { Loader2 } from 'lucide-react';

const GamePlayer: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { isUnlocked } = useCoins();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    if (!isUnlocked(gameId)) {
      // prevent manual route bypass
      alert('This game is locked. Unlock it on the Games page.');
      navigate('/games');
      return;
    }
    // small delay for launch animation
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [gameId, isUnlocked, navigate]);

  const src = `/games/${gameId}/index.html`;

  return (
    <div className="min-h-screen container mx-auto p-4">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Launch Game</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="w-full h-[70vh] bg-black rounded-lg overflow-hidden">
          <iframe src={src} title={gameId} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

export default GamePlayer;
