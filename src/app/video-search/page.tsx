"use client";

import { ProtectedPage } from "@/app/protected-page";
import VideoSearch from "@/pages/VideoSearch";

export default function VideoSearchPage() {
  return (
    <ProtectedPage>
      <VideoSearch />
    </ProtectedPage>
  );
}
