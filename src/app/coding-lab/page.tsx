"use client";

import { ProtectedPage } from "@/app/protected-page";
import CodingLab from "@/pages/CodingLab";

export default function CodingLabPage() {
  return (
    <ProtectedPage>
      <CodingLab />
    </ProtectedPage>
  );
}
