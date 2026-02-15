"use client";

import { ProtectedPage } from "@/app/protected-page";
import Profile from "@/pages/Profile";

export default function ProfilePage() {
  return (
    <ProtectedPage>
      <Profile />
    </ProtectedPage>
  );
}
