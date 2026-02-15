"use client";

import { ProtectedPage } from "@/app/protected-page";
import AIQuiz from "@/pages/AIQuiz";

export default function AIQuizPage() {
  return (
    <ProtectedPage>
      <AIQuiz />
    </ProtectedPage>
  );
}
