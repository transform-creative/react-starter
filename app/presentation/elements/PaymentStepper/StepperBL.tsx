import {
  ActivatableElement,
  SharedContextProps,
} from "~/data/CommonTypes";
import { z } from "~/data/zod";

export const identitySchema = z.object({
  first: z
    .string()
    .min(2, "First name is too short"),
  last: z
    .string()
    .min(2, "Last name is too short"),
  email: z.email("Please enter a valid email"),

  //org: z.string().optional(),

  // phone: z
  //   .string()
  //   .regex(
  //     /^\+?[0-9]{10,15}$/,
  //     "Invalid phone number"
  //   ).optional().nullable(),
});

export type Identity = z.infer<
  typeof identitySchema
>;

export type PaymentObject = {
  cents: number;
  title: string;
  currency: string;
  /** For recurring donations only */
  freq?: "week" | "month" | "year";
  returnUrl: string;
  cart: CartItem[]
  metadata?: {[key: string]: any}
};

export type FreqOptions =
  | "week"
  | "month"
  | "year"
  | null;

export interface PaymentStepperProps extends ActivatableElement {
  context: SharedContextProps;
  /**Pass in a list of values to show as default selection of numbers
   * @param amount The dollar value
   * @param impact (optional) A sentence describing what the donation can do for the organisation
   */
  options?: { amount: number; impact?: string }[];
  /**
   *  Name of the payment
   */
  title?: string;
  /**
   * When true the 'help cover admin costs' button will start on
   */
  coverageDefaultsToOn?: boolean;
  /**
   * Custom link to user's direct debit details
   */
  directDebitLink?: string;
  /**Page to return to after successful payment */
  successUrl: string;
  /*************************
   * The business logo
   */
  logo?: string;

  /*****************************
   * Set an amount in dollars
   */
  cart: CartItem[];
  /**
   * Set to 'cart mode' if user is checking out
   *  a cart instead of donating. 
   */
  isOrder?: boolean;
  /**Display a message to the user in header */
  message?: {header: string, body: string};
  /**
   * Minimum amount in cents for donation
   */
  minAmount?: number;
  /**Function to caluclate an amount to add to donation
   * to help cover admin costs
   */
  bankDetails?: {name: string; bsb: string; account: string};
  metadata?: {};
  calculateCoverage?: (amt: number) => number;
}

export type CartItem = {
    product: {
    id?: number;
    amount: number;
    name: string;
    [key: string]: any;},
    quantity: number
  }

/**************************************
 * Calculate the total of a series of products
 * @param products
 */
export function calculateCartAmount(
  cart: PaymentStepperProps["cart"]
) {
  if(!cart) return NaN;
  let total = 0;

  cart.forEach((p) => {
    total += (p.product.amount || 0)*p.quantity;
  });
  return total;
}

/**********************************************
 * Convert an amount in cents to a dollar amount for displaying
 * @param cents
 */
export function centsToString(cents: number): string {
  if (!cents) return "$NaN";

  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}