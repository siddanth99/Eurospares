"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";

interface Props {
  children: React.ReactNode;
  userEmail?: string | null;
}

export default function DashboardShell({ children, userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Enquiries", href: "/enquiries" },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const pageTitle = pathname === "/dashboard" ? "Dashboard" : "Enquiries";

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 shrink-0 bg-white shadow-sm border-r border-slate-200 flex flex-col">
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-8">
          <h2 className="text-lg font-semibold text-slate-900">{pageTitle}</h2>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-slate-500">{userEmail}</span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 px-10 py-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
