"use client";

import { ProtectedPage } from "@/app/protected-page";
import QuizHistory from "@/pages/QuizHistory";

export default function QuizHistoryPage() {
  return (
    <ProtectedPage>
      <QuizHistory />
    </ProtectedPage>
  );
}
