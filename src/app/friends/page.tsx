"use client";

import { ProtectedPage } from "@/app/protected-page";
import Friends from "@/pages/Friends";

export default function FriendsPage() {
  return (
    <ProtectedPage>
      <Friends />
    </ProtectedPage>
  );
}
