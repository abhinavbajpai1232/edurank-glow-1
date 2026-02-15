"use client";

import { ProtectedPage } from "@/app/protected-page";
import VideoPlayer from "@/pages/VideoPlayer";
import { useParams } from "next/navigation";

export default function VideoPage() {
  const params = useParams();
  const todoId = params.todoId as string;

  return (
    <ProtectedPage>
      <VideoPlayer />
    </ProtectedPage>
  );
}
