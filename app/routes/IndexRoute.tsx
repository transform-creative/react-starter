import { useOutletContext, Link } from "react-router";
import type { SharedContextProps } from "~/data/CommonTypes";

export function meta() {
  return [{ title: "Welcome" }];
}

/******************************
 * IndexRoute
 * Stub landing page — replace with the project's actual home view.
 */
export default function IndexRoute() {
  const context = useOutletContext<SharedContextProps>();

  return (
    <main className="w-100 col middle center vh-80 gap-10 p-20">
      <h1 className="center">{context.brandConfig.home_heading}</h1>
      <h3 className="center">{context.brandConfig.home_subheading}</h3>

      {context.session ? (
        <p className="center">
          Signed in as <strong>{context.session.user.email}</strong>
        </p>
      ) : (
        <Link to="/authentication" className="accent boxed p-10">
          Sign in
        </Link>
      )}
    </main>
  );
}
