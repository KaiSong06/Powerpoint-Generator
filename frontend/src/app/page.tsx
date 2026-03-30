"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-envirotech-charcoal mb-6">
        Dashboard
      </h1>
      <p className="text-gray-600">
        Welcome, {user?.email}. Presentation list will appear here.
      </p>
    </div>
  );
}
