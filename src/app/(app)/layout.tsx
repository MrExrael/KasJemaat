import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/shared/app-header";
import { FlashToast } from "@/components/shared/flash-toast";
import { Sidebar } from "@/components/shared/sidebar";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader fullName={profile.full_name} role={profile.role} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
      <Suspense>
        <FlashToast />
      </Suspense>
    </div>
  );
}
