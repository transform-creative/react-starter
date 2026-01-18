import type { SharedContextProps } from "~/data/CommonTypes";
import { Icon } from "../Icon";
import { Ref } from "react";
import LabelInput from "../LabelInput";

import { useZodForm } from "../Hooks/useZodForm";
import { IdentityFormValues, identitySchema } from "./StepperBL";

export interface CheckoutIdentityProps {
  identity: IdentityFormValues;
  context: SharedContextProps;
  amount: number;
  org?: string;
  nodeRef?: Ref<HTMLDivElement | null>;
  onIdentityChange: (
    attr: keyof IdentityFormValues,
    value: string
  ) => void;
  onBack: () => void;
  onNext: (identity: IdentityFormValues) => void;
}

/******************************
 * CheckoutIdentity component
 * @todo Create description
 */
export function CheckoutIdentity({
  identity,
  nodeRef,
  onIdentityChange,
  onBack,
  onNext,
}: CheckoutIdentityProps) {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useZodForm(identitySchema, identity);

  return (
    <div ref={nodeRef}>
      <form
        id="payment-identity-form"
        onSubmit={handleSubmit(onNext)}
      >
        <div className="col gap10">
          <div className="row gap5">
            <LabelInput
              id="first"
              name="First name"
              type="fname"
              /**@ts-ignore */
              style={{ minWidth: undefined }}
              placeholder="John"
              className=""
              value={values.first}
              onChange={(e) => handleChange(e)}
              error={errors.first}
            />
            <LabelInput
              id="last"
              name="Last name"
              type="lname"
              placeholder="Smith"
              className=""
              value={values.last}
              onChange={(e) => handleChange(e)}
              error={errors.last}
            />
          </div>
          <LabelInput
            id="email"
            name="Email"
            type="email"
            placeholder="hello@email.com"
            className=""
            value={values.email}
            onChange={(e) => handleChange(e)}
            error={errors.email}
          />
          <LabelInput
            id="phone"
            name="Phone"
            type="tel"
            placeholder="123456789"
            className=""
            value={values.phone}
            onChange={(e) => handleChange(e)}
            error={errors.phone}
          />
          <LabelInput
            id="organisation"
            name="Organisation / church"
            placeholder="Some place"
            className=""
            value={values.org}
            onChange={(e) => handleChange(e)}
            error={errors.org}
          />
        </div>
        <div className="row w100 gap5 pt2">
          <button
            className="row w100 middle center gap5 outline"
            onClick={onBack}
            type="button"
          >
            <Icon name="arrow-back" />
            Back
          </button>
          <button
            type="submit"
            className="row w100 middle center gap5 accentButton"
          >
            <Icon name="arrow-forward" />
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
