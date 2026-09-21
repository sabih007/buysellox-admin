import { Sidebar } from "@/components/layout/Sidebar";
import { requireAdminPage } from "@/lib/auth";
import { getSidebarCounts } from "@/lib/queries/stats";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const counts = await getSidebarCounts().catch(() => ({ pendingListings: 0, openReports: 0, pendingPayments: 0 }));

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar email={session.email} counts={counts} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
