"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  HeartPulse,
  History,
  Bookmark,
  Bell,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/search-console", label: "Search Console", icon: Search },
  { href: "/dashboard/site-health", label: "Site Health", icon: HeartPulse },
  { href: "/history", label: "History", icon: History },
  { href: "/saved-searches", label: "Saved Searches", icon: Bookmark },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-[calc(100vh-80px)] border-r-2 border-pink/30 bg-[#000022]/80 p-4">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors no-underline ${
                isActive
                  ? "bg-pink/20 text-pink border border-pink/30"
                  : "text-[#F5F5F5]/60 hover:text-[#F5F5F5] hover:bg-[#F5F5F5]/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
