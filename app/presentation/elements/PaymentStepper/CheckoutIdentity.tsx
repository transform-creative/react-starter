import { ErrorLabelType, SharedContextProps } from "~/data/CommonTypes";
import { Icon } from "../Icon";
import { Ref, useState } from "react";

import { Identity, identitySchema } from "./StepperBL";
import { LabelInput } from "../LabelInput/LabelInput";

export interface CheckoutIdentityProps {
  identity: Identity;
  amount: number;
  isOrder?: boolean;
  nodeRef?: Ref<HTMLDivElement | null>;
  metadata?: any;
  setMetadata?: (meta: any) => void;
  onBack: () => void;
  onNext: (identity: Identity) => void;
  context: SharedContextProps;
}

/******************************
 * CheckoutIdentity component
 * @todo Create description
 */
export function CheckoutIdentity({
  identity,
  nodeRef,
  isOrder = false,
  metadata,
    context,
  setMetadata,
  onBack,
  onNext,
}: CheckoutIdentityProps) {
  const [localIdentity, setLocalIdentity] = useState<Identity>(
    identity || {
      first: "",
      last: "",
      email: "",
      phone: "",
      org: undefined,
    },
  );
  const [error, setError] = useState<ErrorLabelType>({
    active: false,
  });

  function onIdentityChange(
    key: keyof Identity,
    value: string | undefined,
  ) {
    setLocalIdentity({ ...localIdentity, [key]: value });
  }

  /***************************************
   * Validate the function and return
   * @returns
   */
  function handleSubmit() {
    // safeParse ensures we don't throw expensive errors
    const result = identitySchema.safeParse(localIdentity);

    if (!result.success) {
      const firstIssue = result.error.issues[0];

      setError({
        active: true,
        // Selector matches your form keys: "first", "last", "email", etc.
        selector: firstIssue.path.join("."),
        text: firstIssue.message,
      });
      return null;
    }

    onNext(localIdentity);
  }

  return (
    <div ref={nodeRef}>
      <form
        id="payment-identity-form"
        onSubmit={(f) => {
          f.preventDefault();
          handleSubmit();
        }}
      >
        <div className="col mt-10">
          <h4>Your details</h4>
          <div className="row gap-5">
            <LabelInput
              id="first"
              name="First name"
              type="fname"
              /**@ts-ignore */
              style={{ minWidth: undefined }}
              outline
              placeholder="John"
              value={localIdentity.first}
              onChange={(e) =>
                onIdentityChange("first", e.target.value)
              }
              error={error.selector === "first" ? error.text : ""}
            />
            <LabelInput
              id="last"
              name="Last name"
              type="lname"
              outline
              placeholder="Smith"
              value={localIdentity.last}
              onChange={(e) =>
                onIdentityChange("last", e.target.value)
              }
              error={error.selector === "last" ? error.text : ""}
            />
          </div>
          <LabelInput
            id="email"
            name="Email"
            type="email"
            outline
            autoComplete="email"
            placeholder="hello@email.com"
            value={localIdentity.email}
            onChange={(e) =>
              onIdentityChange("email", e.target.value)
            }
            error={error.selector === "email" ? error.text : ""}
          />
          {/* <LabelInput
            id="phone"
            name="Phone"
            type="tel"
            placeholder="123456789"
            autoComplete="phone"
            className=""
            value={localIdentity.phone}
            onChange={(e) =>
              onIdentityChange("phone", e.target.value)
            }
            error={error.selector === "phone" ? error.text : ""}
          /> */}
          {/* <LabelInput
            id="organisation"
            name="Organisation / church"
            placeholder="Some place"
            className=""
            value={localIdentity.org}
            onChange={(e) => onIdentityChange("org", e.target.value)}
            error={error.selector === "org" ? error.text : ""}
          /> */}
          {/* Slot for project-specific order-line fields (event, product, etc.).
              Render a custom component here that reads/writes `metadata` via
              `setMetadata` if your checkout needs more than identity. */}
        </div>
        <div className="row w-100 gap-5 pt-10 mt-20">
          {!isOrder && (
            <button
              className="row w-100 middle center gap-5 outline-secondary"
              onClick={onBack}
              type="button"
            >
              <Icon name="arrow-back" />
              Back
            </button>
          )}
          <button
            type="submit"
            className="row w-100 middle center gap-5 accent"
          >
            <Icon name="arrow-forward" />
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
