import type { SharedContextProps } from "~/data/CommonTypes";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Icon } from "../Icon";
import { logError } from "~/database/Auth";
import * as spinners from "react-spinners";
import { CONTACT } from "~/data/Objects";
import { invokeStripeCheckout } from "~/database/Functions";
import { Identity, PaymentObject } from "./StepperBL";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface CheckoutCardProps {
  context: SharedContextProps;
  paymentProps: PaymentObject;
  identity: Identity;
  onBack: () => void;
}

/******************************
 * CheckoutMenu component
 * @todo Create description
 */
export function CheckoutCard({
  context,
  identity,
  paymentProps,
  onBack,
}: CheckoutCardProps) {
  const [clientSecret, setClientSecret] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleStripeConnect();
  }, []);

  /*******************************************
   * Handle frontent logic of connecting to the stripe API
   */
  async function handleStripeConnect() {
    setLoading(true);

    try {
      const data = await createStripeCheckoutSession(
        paymentProps,
        identity,
      );

      // 2. Save the secret key
      setClientSecret(data.clientSecret);

      // 3. Persist cart + email to survive the Stripe redirect
      sessionStorage.setItem(
        'payment_pending_info',
        JSON.stringify({ cart: paymentProps.cart, email: identity.email, metadata: paymentProps.metadata }),
      );
    } catch (err: any) {
      logError(err);
      context.popAlert(
        "Could not initialize payment system.",
        undefined,
        true,
      );
    }
    setLoading(false);
  }

  /***************************************************
   * Invoke the edge function to create a new checkout session
   */
  async function createStripeCheckoutSession(
    payment: PaymentObject,
    identity: Identity,
  ): Promise<{ clientSecret: string }> {
    return invokeStripeCheckout({ payment, identity } as Record<string, unknown>);
  }

  return (
    <div className="">
      {loading ? (
        <div className="w-100 middle center col dvh-50">
          <p>Processing your information...</p>
          <spinners.BeatLoader color="var(--accent)" />
        </div>
      ) : (clientSecret && stripePromise) ? (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret: clientSecret,
          }}
        >
          <form
            action="submit"
            onSubmit={(f) => {
              f.preventDefault();
            }}
          >
            <EmbeddedCheckout />
          </form>
        </EmbeddedCheckoutProvider>
      ) : (
        <div className="row center middle dvh-80 p-10">
          <h4 className="center">
            An error occurred setting up your payment. 
            Screenshot this
            and contact {CONTACT.devEmail} for support!
          </h4>
        </div>
      )}
      <button
        className="row w-100 middle center gap-5 outline-secondary mt-10"
        disabled={loading}
        onClick={onBack}
      >
        <Icon name="arrow-back" />
        Back
      </button>
    </div>
  );
}
