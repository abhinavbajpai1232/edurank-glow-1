"use client";

import { ProtectedPage } from "@/app/protected-page";
import AINotes from "@/pages/AINotes";

export default function AINotesPage() {
  return (
    <ProtectedPage>
      <AINotes />
    </ProtectedPage>
  );
}
