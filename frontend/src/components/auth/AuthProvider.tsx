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

// Pages that don't require authentication or a profile
const PROFILE_EXEMPT_PATHS = ["/login", "/signup", "/complete-profile"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

  const fetchProfile = async (accessToken?: string) => {
    try {
      const p = await getProfile(accessToken);
      setProfile(p);
      setProfileChecked(true);
      return p;
    } catch {
      // Network/server error — don't mark as checked so we don't
      // wrongly redirect to /complete-profile
      return profile;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        // Fire-and-forget: profile loads in the background
        fetchProfile(session.access_token);
      } else {
        setProfileChecked(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        fetchProfile(session.access_token);
      } else {
        setProfile(null);
        setProfileChecked(true);
      }
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

  // Redirect to complete-profile if logged in but profile doesn't exist
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!profileChecked) return;
    if (PROFILE_EXEMPT_PATHS.includes(pathname)) return;

    if (!profile) {
      router.push("/complete-profile");
    }
  }, [isLoading, user, profile, profileChecked, pathname, router]);

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
