"use client";

import { ProtectedPage } from "@/app/protected-page";
import Analysis from "@/pages/Analysis";

export default function AnalysisPage() {
  return (
    <ProtectedPage>
      <Analysis />
    </ProtectedPage>
  );
}
