"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProtectedPageProps {
  children: ReactNode;
}

export function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
