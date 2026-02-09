"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, LayoutDashboard, History, Bookmark } from "lucide-react";

export function MarketingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <nav className="bg-navy-light backdrop-blur-[10px] border-b-2 border-pink sticky top-0 z-[100]">
      <div className="max-w-[1400px] mx-auto px-10 py-5 flex justify-between items-center">
        <Link
          href="/"
          className="font-heading text-[2rem] text-[#F5F5F5] tracking-[2px] no-underline transition-all hover:text-pink"
        >
          SEO BANDWAGON
        </Link>

        <ul className="hidden md:flex gap-10 list-none">
          <li>
            <Link
              href="#services"
              className="font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] transition-all hover:text-[#F5F5F5]"
            >
              SERVICES
            </Link>
          </li>
          <li>
            <Link
              href="#pricing"
              className="font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] transition-all hover:text-[#F5F5F5]"
            >
              PRICING
            </Link>
          </li>
          <li>
            <Link
              href="#faq"
              className="font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] transition-all hover:text-[#F5F5F5]"
            >
              FAQ
            </Link>
          </li>
          <li>
            <Link
              href="/blog"
              className="font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] transition-all hover:text-[#F5F5F5]"
            >
              BLOG
            </Link>
          </li>
        </ul>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="#scan"
            className="font-heading text-xl bg-pink text-[#F5F5F5] py-3 px-[30px] border-none tracking-[2px] no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(245,55,150,0.5)]"
          >
            FREE AUDIT
          </Link>

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

        <button
          className="md:hidden bg-transparent border-none cursor-pointer p-2.5"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-[25px] h-[3px] bg-[#F5F5F5] my-[5px] transition-all"></span>
          <span className="block w-[25px] h-[3px] bg-[#F5F5F5] my-[5px] transition-all"></span>
          <span className="block w-[25px] h-[3px] bg-[#F5F5F5] my-[5px] transition-all"></span>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-navy border-t border-pink/30">
          <ul className="list-none py-4">
            <li>
              <Link
                href="#services"
                className="block font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] py-3 px-10 hover:text-[#F5F5F5] hover:bg-pink/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                SERVICES
              </Link>
            </li>
            <li>
              <Link
                href="#pricing"
                className="block font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] py-3 px-10 hover:text-[#F5F5F5] hover:bg-pink/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                PRICING
              </Link>
            </li>
            <li>
              <Link
                href="#faq"
                className="block font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] py-3 px-10 hover:text-[#F5F5F5] hover:bg-pink/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="block font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] py-3 px-10 hover:text-[#F5F5F5] hover:bg-pink/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                BLOG
              </Link>
            </li>
            <li className="px-10 py-3">
              <Link
                href="#scan"
                className="block font-heading text-xl bg-pink text-[#F5F5F5] py-3 px-[30px] border-none tracking-[2px] no-underline text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FREE AUDIT
              </Link>
            </li>
            <li className="px-10 py-3">
              {session?.user ? (
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    className="block font-heading text-xl text-[#F5F5F5]/70 no-underline tracking-[1px] hover:text-[#F5F5F5]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    DASHBOARD
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="block font-heading text-xl text-[#F5F5F5]/70 tracking-[1px] hover:text-[#F5F5F5] bg-transparent border-none cursor-pointer"
                  >
                    SIGN OUT
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="block font-heading text-xl text-[#F5F5F5]/70 tracking-[1px] hover:text-[#F5F5F5] no-underline"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  SIGN IN
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

function UserMenu({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
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
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-[#000022] border-2 border-pink shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2">
          <div className="px-3 py-2 border-b border-pink/30 mb-2">
            <p className="text-[#F5F5F5] font-medium text-sm truncate">{user.name || user.email}</p>
          </div>
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
