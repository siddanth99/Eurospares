"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  children: React.ReactNode;
  userEmail?: string | null;
}

export default function DashboardShell({ children, userEmail }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Enquiries", href: "/enquiries" },
  ];

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  }

  const pageTitle = pathname === "/dashboard" ? "Dashboard" : "Enquiries";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-64 shrink-0 bg-white shadow-sm border-r border-slate-200 flex-col">
        <div className="px-6 py-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            EuroSpares
          </h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 w-full flex flex-col min-w-0 relative">
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-slate-900">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-slate-500 hidden sm:inline">{userEmail}</span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors md:block hidden"
            >
              Log out
            </button>
          </div>
        </header>

        {mobileOpen && (
          <div className="absolute top-16 left-4 right-4 bg-white shadow-lg rounded-xl border border-slate-200 z-50 p-4 space-y-3 md:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="w-full text-left rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Log out
            </button>
          </div>
        )}

        <main className="flex-1 w-full px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
