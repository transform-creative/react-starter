import { PopUpModal } from "~/presentation/elements/PopUpModal";
import type { CartItem } from "./StepperBL";
import { formatDollars } from "~/data/Objects";

export interface PaymentSuccessModalProps {
  active: boolean;
  email: string;
  cart: CartItem[];
  inShrink: boolean;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  onClose: () => void;
}

/******************************
 * PaymentSuccessModal component
 * Shown after a successful Stripe checkout, displaying a thank-you message,
 * the recipient email, and the total amount paid. Pass `title`, `body`,
 * `ctaLabel`, and `onCta` to customize the copy and post-success action.
 */
export function PaymentSuccessModal({
  active,
  email,
  cart,
  inShrink,
  title = "Thank you for your payment!",
  body,
  ctaLabel,
  onCta,
  onClose,
}: PaymentSuccessModalProps) {
  const total =
    cart.reduce(
      (sum, item) => sum + item.product.amount * item.quantity,
      0,
    ) / 100;

  return (
    <PopUpModal
      active={active}
      onClose={onClose}
      width={inShrink ? "90vw" : 420}
      icon={{
        name: "checkmark-circle",
        color: "var(--accent)",
        size: 60,
      }}
    >
      <h3 className="center mt-10">{title}</h3>

      <p style={{ textAlign: "center" }} className="mt-10">
        A receipt has been sent to <strong>{email}</strong>
      </p>

      {body && (
        <p style={{ textAlign: "center" }} className="mt-10">
          {body}
        </p>
      )}

      <div className="row between mt-10 accent p-10 boxed">
        <p>
          <strong>Total</strong>
        </p>
        <p>
          <strong>${formatDollars(total)}</strong>
        </p>
      </div>

      {ctaLabel && (
        <button
          role="button"
          onClick={() => {
            onCta?.();
            onClose();
          }}
          className="w-100 center middle row p-10 outline-secondary mt-10"
        >
          {ctaLabel}
        </button>
      )}
    </PopUpModal>
  );
}
