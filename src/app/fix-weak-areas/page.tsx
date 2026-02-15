"use client";

import { ProtectedPage } from "@/app/protected-page";
import FixWeakAreas from "@/pages/FixWeakAreas";

export default function FixWeakAreasPage() {
  return (
    <ProtectedPage>
      <FixWeakAreas />
    </ProtectedPage>
  );
}
