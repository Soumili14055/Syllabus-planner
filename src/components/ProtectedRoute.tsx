"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signup"); // redirect to signup if not logged in
    }
  }, [loading, user, router]);

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return <>{children}</>;
}
