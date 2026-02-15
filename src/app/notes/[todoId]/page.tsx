"use client";

import { ProtectedPage } from "@/app/protected-page";
import Notes from "@/pages/Notes";

export default function NotesPage() {
  return (
    <ProtectedPage>
      <Notes />
    </ProtectedPage>
  );
}
