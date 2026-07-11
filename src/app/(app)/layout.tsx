import { redirect } from "next/navigation";

import { Sidebar } from "@/components/shared/sidebar";
import { getUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar userEmail={user.email} />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
