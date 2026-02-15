"use client";

import { ProtectedPage } from "@/app/protected-page";
import GamePlayer from "@/pages/GamePlayer";

export default function GamePlayerPage() {
  return (
    <ProtectedPage>
      <GamePlayer />
    </ProtectedPage>
  );
}
