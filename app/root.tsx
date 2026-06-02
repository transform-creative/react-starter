import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import {
  AalLevel,
  AlertType,
  PopAlertFn,
  SharedContextProps,
} from "./data/CommonTypes";
import {
  getAal,
  getAal as _getAal,
  supabaseSignOut,
} from "./database/Auth";
import { Alert } from "./presentation/elements/Alert";
import { useEffect, useState } from "react";
import { supabase } from "./database/SupabaseClient";
import { Session } from "@supabase/supabase-js";
import { NavBar } from "./presentation/elements/NavBar";
import {
  CONTACT,
  isMobileBrowser,
} from "./data/Objects";
import { PaymentStepper } from "./presentation/elements/PaymentStepper/PaymentStepper";
import type { PaymentStepperProps } from "./presentation/elements/PaymentStepper/StepperBL";
import { getBrandConfig } from "./data/BrandConfig";

export const links: Route.LinksFunction = () => [
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com",
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  // Replace with the fonts this project uses. Keep the preconnect lines above.
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap",
  },
  // Quill stylesheet — only loaded if a TCFreeType editor is rendered. Drop if unused.
  {
    rel: "stylesheet",
    href: "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css",
  },
];

export function HydrateFallback() {
  return (
    <div
      style={{ width: "100%", height: "100vh" }}
      className="col middle center"
    >
      Loading...
    </div>
  );
}

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const SHRINK_WIDTH = 1200;

export default function App() {
  const navigate = useNavigate();

  const [alert, setAlert] = useState<AlertType>({
    active: false,
  });
  const [session, setSession] =
    useState<Session | null>(null);
  const [inShrink, setInShrink] = useState(
    typeof window !== "undefined" &&
      window.innerWidth < SHRINK_WIDTH,
  );
  const [isMobile, setIsMobile] = useState(false);
  const [paymentStepper, setPaymentStepperState] =
    useState<Partial<PaymentStepperProps>>({
      active: false,
    });
  const [aalCurrent, setAalCurrent] =
    useState<AalLevel | null>(null);
  const [aalNext, setAalNext] =
    useState<AalLevel | null>(null);

  const brandConfig = getBrandConfig();

  /** Read the current AAL — call after sign in / TOTP verify to refresh context. */
  async function refreshAal() {
    try {
      const aal = await getAal();
      setAalCurrent(
        (aal.currentLevel ??
          null) as AalLevel | null,
      );
      setAalNext(
        (aal.nextLevel ??
          null) as AalLevel | null,
      );
    } catch {
      setAalCurrent(null);
      setAalNext(null);
    }
  }

  useEffect(() => {
    const handleResize = () =>
      setInShrink(
        window.innerWidth < SHRINK_WIDTH,
      );
    window.addEventListener(
      "resize",
      handleResize,
    );
    setIsMobile(isMobileBrowser());

    const { data: sub } =
      supabase.auth.onAuthStateChange(
        (event, sess) => {
          setSession(sess);
          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED"
          ) {
            refreshAal();
            // TODO: project-specific post-sign-in fetches go here
            //   e.g. fetchProfile(sess.user.id), fetchOrganisations(), ...
          }
          if (event === "SIGNED_OUT") {
            setAalCurrent(null);
            setAalNext(null);
          }
        },
      );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
      sub.subscription.unsubscribe();
    };
  }, []);

  const popAlert: PopAlertFn = (
    header,
    body,
    isError = false,
  ) => {
    setAlert({
      active: true,
      header,
      body,
      state: isError ? "fail" : "success",
    });
  };

  function setPaymentStepper(
    props: Partial<PaymentStepperProps>,
  ) {
    setPaymentStepperState((prev) => ({
      ...prev,
      ...props,
    }));
  }

  const context: SharedContextProps = {
    popAlert,
    session,
    inShrink,
    isMobile,
    navigate,
    brandConfig,
    paymentStepper,
    setPaymentStepper,
    aalCurrent,
    aalNext,
    refreshAal,
  };

  return (
    <>
      <NavBar
        session={session}
        routes={[]}
        brand={brandConfig.site_name}
      />
      <Outlet context={context} />
      <Alert
        header={alert.header}
        body={alert.body}
        active={alert.active}
        onClose={() =>
          setAlert({ active: false })
        }
        state={alert.state}
      />
      {paymentStepper.active && (
        <PaymentStepper
          {...(paymentStepper as PaymentStepperProps)}
          context={context}
          active={paymentStepper.active}
          onClose={() =>
            setPaymentStepper({ active: false })
          }
        />
      )}
    </>
  );
}

/***************************************
 * The app falls back here if an unrecoverable error occurs.
 */
export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  let message = "Something went wrong!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message =
      error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (
    import.meta.env.DEV &&
    error &&
    error instanceof Error
  ) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="w-100 col middle center vh-80 gap10">
      <h1
        className="center"
        style={{ fontSize: "3em" }}
      >
        {message}
      </h1>
      <h3 className="center">{details}</h3>
      <p className="center">
        Contact {CONTACT.devEmail} if the issue
        persists.
      </p>
      {stack &&
        process.env.NODE_ENV ===
          "development" && (
          <pre className="center">
            <code>{stack}</code>
          </pre>
        )}
    </main>
  );
}
