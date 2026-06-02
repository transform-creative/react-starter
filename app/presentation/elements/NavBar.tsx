import {
  NavLink,
  useNavigate,
} from "react-router";
import type { Session } from "@supabase/supabase-js";
import { Icon } from "./Icon";
import type { IoniconName } from "~/data/Ionicons";
import { supabaseSignOut } from "~/database/Auth";

export interface NavRoute {
  path: string;
  label: string;
  icon?: IoniconName;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

export interface NavBarProps {
  session: Session | null;
  /** Routes to render in the bar. Filtered by session presence per `requiresAuth`. */
  routes?: NavRoute[];
  /** Element rendered on the left — usually a logo or wordmark. */
  brand?: React.ReactNode;
  isAdmin?: boolean;
}

/******************************
 * NavBar component
 * Minimal top nav scaffold. Inject the project's routes via the `routes` prop.
 * For more sophisticated patterns (hover dropdowns, scroll-aware nav, profile
 * menu), see the ping-pong-a-thon NavBar/ folder as a reference implementation.
 */
export function NavBar({
  session,
  routes = [],
  brand,
  isAdmin = false,
}: NavBarProps) {
  const navigate = useNavigate();

  const visibleRoutes = routes.filter((r) => {
    if (r.requiresAuth && !session) return false;
    if (r.requiresAdmin && !isAdmin) return false;
    return true;
  });

  async function handleSignOut() {
    await supabaseSignOut();
    navigate("/authentication");
  }

  return (
    <nav className="navBar row between middle p-10">
      <div className="row between w-100">
        <div className="row middle gap-10">
          {brand}
        </div>
        <div className="row middle gap-10">
          {visibleRoutes.map((r) => (
            <NavLink
              key={r.path}
              to={r.path}
              className="row middle gap-5 clickable p-10"
            >
              {r.icon && <Icon name={r.icon} />}
              <p>{r.label}</p>
            </NavLink>
          ))}
          {session ? (
            <button
              onClick={handleSignOut}
              className="accent row middle gap-5"
            >
              <Icon name="log-out-outline" />
              Sign out
            </button>
          ) : (
            <button
              onClick={() =>
                navigate("/authentication")
              }
              className="accent row middle gap-5"
            >
              <Icon name="log-in-outline" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
