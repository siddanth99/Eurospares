import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell userEmail={user.email ?? null}>
      {children}
    </DashboardShell>
  );
}
