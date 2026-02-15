"use client";

import { ProtectedPage } from "@/app/protected-page";
import Quiz from "@/pages/Quiz";

export default function QuizPage() {
  return (
    <ProtectedPage>
      <Quiz />
    </ProtectedPage>
  );
}
