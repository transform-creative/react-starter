import type { ErrorLabelType } from "~/data/CommonTypes";
import { useState } from "react";
import { LabelInput } from "~/presentation/elements/LabelInput/LabelInput";

export const AU_STATES = [
  "SA",
  "ACT",
  "VIC",
  "NSW",
  "QLD",
  "TAS",
  "WA",
  "NT",
] as const;

export type PostalAddress = {
  number: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
};

export interface AddressFieldsProps {
  address: PostalAddress;
  errors?: Record<string, ErrorLabelType>;
  onChange: (key: keyof PostalAddress, value: string) => void;
  outline?: boolean;
}

/******************************
 * AddressFields component
 * Reusable AU address fields (number, street, suburb, state, postcode)
 */
export function AddressFields({
  address,
  errors = {},
  onChange,
  outline,
}: AddressFieldsProps) {
  const [stateSearch, setStateSearch] = useState("");

  return (
    <div className="col gap-10">
      {/* Row 1: Number & Street */}
      <div className="row gap-10">
        <div className="w-20" style={{ minWidth: "100px" }}>
          <LabelInput
            outline={outline}
            id="number"
            name="No."
            type="text"
            placeholder="10A"
            value={address.number || ""}
            onChange={(e) => onChange("number", e.target.value)}
            error={errors["number"]?.text}
            autoComplete="address-line1"
          />
        </div>
        <div className="w-100">
          <LabelInput
            outline={outline}
            id="street"
            name="Street Name"
            type="text"
            value={address.street || ""}
            onChange={(e) => onChange("street", e.target.value)}
            error={errors["street"]?.text}
            autoComplete="address-line1"
          />
        </div>
      </div>

      {/* Row 2: Suburb, State, Postcode */}
      <div className="row gap-10">
        <div className="w-50">
          <LabelInput
            outline={outline}
            id="suburb"
            name="Suburb"
            type="text"
            value={address.suburb || ""}
            onChange={(e) => onChange("suburb", e.target.value)}
            error={errors["suburb"]?.text}
            autoComplete="address-level2"
          />
        </div>

        <div className="w-25">
          <div className="col gap-5">
            <LabelInput
              outline={outline}
              id="state"
              name="State"
              type="text"
              options={AU_STATES.map((state) => ({
                value: state,
                label: state,
              }))}
              value={address.state}
              onInputChange={(e) => setStateSearch(e.target.value)}
              onChange={(e) => onChange("state", e.target.value)}
              error={errors["state"]?.text}
              autoComplete="address-level1"
            />
          </div>
        </div>

        <div className="w-25">
          <LabelInput
            outline={outline}
            id="postcode"
            name="Postcode"
            type="text"
            value={address.postcode || ""}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              onChange("postcode", val);
            }}
            error={errors["postcode"]?.text}
            autoComplete="postal-code"
          />
        </div>
      </div>
    </div>
  );
}
