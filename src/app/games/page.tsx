"use client";

import { ProtectedPage } from "@/app/protected-page";
import Games from "@/pages/Games";

export default function GamesPage() {
  return (
    <ProtectedPage>
      <Games />
    </ProtectedPage>
  );
}
