"use client";

import Link from "next/link";
import { Home, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/client";

export function MarketingActions() {
  const supabase = useMemo(() => createClient(), []);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setAuthenticated(Boolean(data.user));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setAuthenticated(Boolean(session?.user)),
    );
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <div className="marketing-actions">
      <ThemeToggle />
      {authenticated === null ? (
        <span className="header-actions-placeholder" aria-hidden />
      ) : authenticated ? (
        <>
          <Link className="btn btn-secondary" href="/home">
            <Home className="size-4" />
            <span>Home</span>
          </Link>
          <form action={signOut}>
            <button className="btn btn-primary" type="submit">
              <LogOut className="size-4" />
              <span>Log out</span>
            </button>
          </form>
        </>
      ) : (
        <>
          <Link className="btn btn-secondary" href="/sign-in">
            Sign in
          </Link>
          <Link
            className="btn btn-primary hidden md:inline-flex"
            href="/sign-up"
          >
            Create your Nest
          </Link>
        </>
      )}
    </div>
  );
}
