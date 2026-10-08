import {
  useOutletContext,
  useSearchParams,
  Link,
} from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";
import { AdminNavbar } from "~/presentation/admin/AdminNavbar";
import { StatCard } from "~/presentation/admin/StatCard";
import {
  canViewAdmin,
  parseAdminPage,
  summarisePayments,
} from "~/presentation/admin/AdminBL";
import { formatCents } from "~/data/Objects";

export function meta() {
  return [
    { title: "Admin" },
    { name: "robots", content: "noindex" },
  ];
}

/******************************
 * AdminRoute
 * Admin console shell with a Dashboard and a Finance tab. Gated on session +
 * MFA (UX only — enforce real access in RLS). Replace the stat placeholders
 * with queries from /app/database/. Add pages via ADMIN_PAGES in AdminBL.
 */
export default function AdminRoute() {
  const context =
    useOutletContext<SharedContextProps>();
  const [searchParams, setSearchParams] =
    useSearchParams();
  const page = parseAdminPage(
    searchParams.get("page"),
  );

  if (
    !canViewAdmin(
      context.session,
      context.aalCurrent,
      context.aalNext,
    )
  ) {
    return (
      <main className="w-100 col middle center vh-80 gap-10">
        <h2 className="center">
          Admin sign-in required
        </h2>
        <Link
          to="/authentication"
          className="accent boxed p-10"
        >
          Sign in
        </Link>
      </main>
    );
  }

  // Placeholder data — swap for a fetch in /app/database/
  const finance = summarisePayments([]);

  return (
    <div
      className={`${context.inShrink ? "col" : "row"} relative w-100 admin-shell`}
    >
      <AdminNavbar
        activePage={page}
        onSelect={(p) =>
          setSearchParams({ page: p })
        }
      />
      <main className="col gap-20 p-20 admin-content">
        {page === "dashboard" && (
          <>
            <h1 className="start">Dashboard</h1>
            <div className="grid-250 gap-10">
              <StatCard
                label="Signed in as"
                value={
                  context.session?.user.email ??
                  ""
                }
              />
            </div>
          </>
        )}
        {page === "finance" && (
          <>
            <h1 className="start">Finance</h1>
            <div className="grid-250 gap-10">
              <StatCard
                label="Gross"
                value={`$${formatCents(finance.grossCents)}`}
                hint={`${finance.count} payments`}
              />
              <StatCard
                label="Refunded"
                value={`$${formatCents(finance.refundedCents)}`}
              />
              <StatCard
                label="Net"
                value={`$${formatCents(finance.netCents)}`}
              />
              <StatCard
                label="Average"
                value={`$${formatCents(finance.averageCents)}`}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
