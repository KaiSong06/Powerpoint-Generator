"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="bg-envirotech-charcoal text-white px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="text-xl font-bold tracking-wide">
            <span className="text-envirotech-red">ENVIRO</span>TECH
          </Link>
          <div className="flex gap-4 sm:gap-6 text-sm">
            <Link
              href="/"
              className={`hover:text-envirotech-red transition-colors ${
                pathname === "/" ? "text-envirotech-red" : ""
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className={`hover:text-envirotech-red transition-colors ${
                pathname === "/create" ? "text-envirotech-red" : ""
              }`}
            >
              Create
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          {!isLoading && user && (
            <>
              <span className="text-gray-300 hidden sm:inline truncate max-w-[200px]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="bg-envirotech-red px-3 py-1 rounded text-white text-sm hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
