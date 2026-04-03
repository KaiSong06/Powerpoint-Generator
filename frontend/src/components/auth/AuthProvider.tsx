"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types";
import { getProfile } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Pages that don't require a profile
const PROFILE_EXEMPT_PATHS = ["/login", "/signup", "/complete-profile"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

  const fetchProfile = async (accessToken?: string) => {
    try {
      const p = await getProfile(accessToken);
      setProfile(p);
      return p;
    } catch {
      // Non-404 error (network, 401, CORS, etc.)
      // Don't clear an existing profile — the API call failed, not the profile
      return profile;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.access_token);
      }

      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.access_token);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Redirect to login if not authenticated and not on a public page
  useEffect(() => {
    if (isLoading) return;
    if (user) return;
    if (PROFILE_EXEMPT_PATHS.includes(pathname)) return;
    router.push("/login");
  }, [isLoading, user, pathname, router]);

  // Redirect to complete-profile if logged in but no profile
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (PROFILE_EXEMPT_PATHS.includes(pathname)) return;

    if (!profile) {
      router.push("/complete-profile");
    }
  }, [isLoading, user, profile, pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/login");
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
