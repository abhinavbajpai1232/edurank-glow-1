"use client";

import { ProtectedPage } from "@/app/protected-page";
import Dashboard from "@/pages/Dashboard";

export default function DashboardPage() {
  return (
    <ProtectedPage>
      <Dashboard />
    </ProtectedPage>
  );
}
