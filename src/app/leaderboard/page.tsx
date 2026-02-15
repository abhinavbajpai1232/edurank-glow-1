"use client";

import { ProtectedPage } from "@/app/protected-page";
import Leaderboard from "@/pages/Leaderboard";

export default function LeaderboardPage() {
  return (
    <ProtectedPage>
      <Leaderboard />
    </ProtectedPage>
  );
}
