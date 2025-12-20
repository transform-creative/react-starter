import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext, useSearchParams } from "react-router";
import { useState } from "react";
import { logError, supabaseSignIn } from "~/database/Auth";
import IonIcon from "@reacticons/ionicons";
import { BeatLoader } from "react-spinners";
import { AuthApiError } from "@supabase/supabase-js";
import LabelInput from "../elements/LabelInput";
import OtpPopUp from "./OtpPopUp";


export interface AuthenticationProps {}

/******************************
 * Authentication component
 * Handles OTP authentication flow for the application
 */
export function Authentication({}: AuthenticationProps) {
  const context: SharedContextProps = useOutletContext();
  const [email, setEmail] = useState<string>();
  const [processStarted, setProcessStarted] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  /*****************************************
   * Handle process of signing user in
   * @returns
   */
  async function signIn() {
    if (!email) return;

    setProcessStarted(true);

    try {
      await supabaseSignIn(email);
      context.popAlert(
        "Account found!",
        "Check your inbox for a login code"
      );
      setSearchParams({ otp: email });
    } catch (error) {
      const authError = error as AuthApiError;
      await logError(authError, ["Login", "authSignIn"]);

      if (authError.code == "otp_disabled") {
        context.popAlert(
          "Could not sign you in",
          "No account with that email address exists",
          true
        );
      } else
        context.popAlert(
          "Could not sign you in",
          "An unkown error occurred",
          true
        );
    }
    setProcessStarted(false);
    setEmail(undefined);
    return;
  }

  return (
    <div className="col middle center vh80 slowFade">
      <div className="col w30 middle center">
        <div className="col middle center">
          <img
            className=""
            src="TWC-logo-sq-trans.png"
            style={{ height: "auto", width: 130 }}
          />
          <h1 style={{ fontSize: 40 }} className="mt3">
            Sign in
          </h1>
        </div>
        <div className="w100">
          <form
            className="col gap5"
            action="submit"
            onSubmit={(f) => {
              f.preventDefault();
              signIn();
            }}
          >
            <div className="middle center col mt2">
              <p className="textCenter p2">
                Enter your email address and we'll send a login code to
                your inbox!
              </p>
            </div>
            <div className="mt2 mb2 m2">
              <LabelInput
                label="Email"
                className="mt1"
                type="email"
                value={email || ""}
                onChange={(val) => setEmail(val)}
                autoFocus
                autoComplete="email"
              />
            </div>
            <div className="m2">
              <button
                className={`w100 ${email && "accentButton"}`}
                type="submit"
              >
                {processStarted == true ? (
                  <BeatLoader size={10} color="var(--bg)" />
                ) : (
                  <div className="row middle center">
                    <IonIcon
                      name="mail"
                      className="mr2"
                      style={{
                        marginBottom: -2,
                        width: 15,
                        height: 15,
                      }}
                    />
                    <p>Email link</p>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
        <OtpPopUp
          active={!!searchParams.get("otp")}
          onClose={() => {searchParams.delete("otp"), setSearchParams(searchParams)}}
          email={searchParams.get("otp")}
        />
      </div>
    </div>
  );
}
