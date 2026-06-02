/*************************************************************************
 * Types used across the app. Keep this file lean — project-specific
 * composite types belong in CustomTypes.tsx, and Supabase row types should
 * be generated via `supabase gen types`.
 */

import type { Session } from "@supabase/supabase-js";
import { NavigateFunction } from "react-router";
import type { BrandCopy } from "./BrandConfig";
import type { PaymentStepperProps } from "~/presentation/elements/PaymentStepper/StepperBL";

export type PopAlertFn = (
  header: string,
  body?: string,
  isError?: boolean,
) => void;

export type AlertType = {
  active: boolean;
  header?: string;
  body?: string;
  state?: "success" | "fail";
};

export interface InputOption {
  value: any;
  label: any;
}

export type AalLevel = "aal1" | "aal2";

export interface SharedContextProps {
  session: Session | null;
  inShrink: boolean;
  isMobile: boolean;
  popAlert: PopAlertFn;
  navigate: NavigateFunction;
  brandConfig: BrandCopy;

  paymentStepper: Partial<PaymentStepperProps>;
  setPaymentStepper: (props: Partial<PaymentStepperProps>) => void;

  aalCurrent: AalLevel | null;
  aalNext: AalLevel | null;
  refreshAal: () => Promise<void>;
}

/** An item that can be shown or hidden */
export interface ActivatableElement {
  active: boolean;
  onClose: () => void;
}

export type ErrorLabelType = {
  selector?: string;
  active: boolean;
  text?: string;
  safe?: boolean;
};

/** Base shape for any Supabase table row. */
export interface SupabaseTable {
  id: number;
  created_at: Date;
}

export interface ContextModalElement {
  active: boolean;
  x?: number;
  y?: number;
}
