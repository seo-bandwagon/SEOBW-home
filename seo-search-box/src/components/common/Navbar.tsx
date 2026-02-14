"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, History, Bookmark, LayoutDashboard, MapPin, Navigation, Building2 } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-navy-light backdrop-blur-[10px] border-b-2 border-pink sticky top-0 z-[100]">
      <div className="max-w-[1400px] mx-auto px-10 py-5 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-[2rem] text-[#F5F5F5] tracking-[2px] no-underline transition-all hover:text-pink"
        >
          SEO BANDWAGON
        </Link>

        {/* Navigation Links */}
        <ul className="hidden md:flex gap-10 list-none items-center">
          <li>
            <Link
              href="/"
              className="font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] transition-all hover:text-[#F5F5F5]"
            >
              SEARCH
            </Link>
          </li>
          {/* Tools Dropdown */}
          <li className="relative group">
            <span className="font-heading text-xl text-[#F5F5F5]/70 tracking-[1px] transition-all hover:text-[#F5F5F5] cursor-pointer">
              TOOLS
            </span>
            <div className="absolute left-0 top-full mt-2 w-56 rounded-lg bg-[#000022] border-2 border-pink shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2">
                <Link
                  href="/tools/local-rank"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#F5F5F5]/70 hover:bg-pink/20 hover:text-[#F5F5F5] transition-colors no-underline"
                >
                  <MapPin className="h-4 w-4 text-pink" />
                  Local Rank Tracker
                </Link>
                <Link
                  href="/tools/lat-lng"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#F5F5F5]/70 hover:bg-pink/20 hover:text-[#F5F5F5] transition-colors no-underline"
                >
                  <Navigation className="h-4 w-4 text-blue-400" />
                  Lat/Long Lookup
                </Link>
                <Link
                  href="/tools/place-id"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#F5F5F5]/70 hover:bg-pink/20 hover:text-[#F5F5F5] transition-colors no-underline"
                >
                  <Building2 className="h-4 w-4 text-green-400" />
                  Place ID Finder
                </Link>
              </div>
            </div>
          </li>
          {session && (
            <>
              <li>
                <Link
                  href="/dashboard"
                  className="font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] transition-all hover:text-[#F5F5F5]"
                >
                  DASHBOARD
                </Link>
              </li>
              <li>
                <Link
                  href="/history"
                  className="font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] transition-all hover:text-[#F5F5F5]"
                >
                  HISTORY
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-[#F5F5F5]/20" />
          ) : session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <Link
              href="/auth/signin"
              className="font-heading text-xl text-[#F5F5F5]/70 tracking-[1px] transition-all hover:text-[#F5F5F5] no-underline"
            >
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function UserMenu({ user }: { user?: { name?: string | null; email?: string | null; image?: string | null } | null }) {
  if (!user) return null;

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#F5F5F5]/10 transition-colors">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="h-10 w-10 rounded-full border-2 border-pink"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink/20 border-2 border-pink">
            <User className="h-5 w-5 text-pink" />
          </div>
        )}
        <span className="font-body text-sm text-[#F5F5F5]/70 hidden md:block">
          {user.name || user.email}
        </span>
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-[#000022] border-2 border-pink shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#F5F5F5]/70 hover:bg-pink/20 hover:text-[#F5F5F5] transition-colors no-underline"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#F5F5F5]/70 hover:bg-pink/20 hover:text-[#F5F5F5] transition-colors no-underline"
          >
            <History className="h-4 w-4" />
            Search History
          </Link>
          <Link
            href="/saved"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[#F5F5F5]/70 hover:bg-pink/20 hover:text-[#F5F5F5] transition-colors no-underline"
          >
            <Bookmark className="h-4 w-4" />
            Saved Searches
          </Link>
          <hr className="my-2 border-pink/30" />
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-pink hover:bg-pink/20 transition-colors bg-transparent border-none cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
