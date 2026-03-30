"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPresentations } from "@/lib/api";
import PresentationList from "@/components/dashboard/PresentationList";
import Link from "next/link";
import type { Presentation } from "@/lib/types";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    getPresentations()
      .then(setPresentations)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-envirotech-charcoal">
          Dashboard
        </h1>
        <Link
          href="/create"
          className="bg-envirotech-red text-white px-5 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
        >
          Create New
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
          <p>Failed to load presentations: {error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              getPresentations()
                .then(setPresentations)
                .catch((err) => setError(err.message))
                .finally(() => setIsLoading(false));
            }}
            className="mt-2 text-red-800 font-medium underline text-xs"
          >
            Try again
          </button>
        </div>
      )}

      <PresentationList presentations={presentations} />
    </div>
  );
}
