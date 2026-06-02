import {
  useState,
  useRef,
  useEffect,
} from "react";
import { useGSAP } from "@gsap/react"; // Optimized for React
import gsap from "gsap";
import { CheckoutAmount } from "./CheckoutAmount";
import { CheckoutIdentity } from "./CheckoutIdentity";
import { CheckoutCard } from "./CheckoutCard";
import { SlideOutModal } from "../SlideOutModal";

import {
  calculateCartAmount,
  CartItem,
  Identity,
  PaymentObject,
  PaymentStepperProps,
} from "./StepperBL";
import { Icon } from "../Icon";
import { IoniconName } from "~/data/Ionicons";
import { logError } from "~/database/Auth";
import {
  formatCents,
  formatDollars,
} from "~/data/Objects";

/*************************
 * Custom component built for processing donations
 * @requires 
 * '@stripe/react-stripe-js' & 
 * '@stripe/stripe-js'
 * @example 
 <PaymentStepper
      active={paymentModal.active}
      logo="/logo.png"
      onClose={() =>
        setPaymentModal({
          ...paymentModal,
          active: false,
        })
      }
      context={context}
      title={
        paymentModal.inCartMode
          ? "Checkout cart"
          : "Donation to Community Account"
      }
      cart={cart}
      inCartMode={paymentModal.inCartMode}
      options={[
        { amount: 68, impact: "Provides 3 weeks of on-the-job training for one survivor in professionals such as hairdressing, baking and tailoring." },
        { amount: 115, impact: "Enables a survivor to receive intensive, individual counselling for one month." },
        { amount: 220, impact: "Can cover trial fees for one case so a trafficking survivor can see justice served." },
        { amount: 600, impact: "Provides a month of home visits from case workers for 70+ at-risk students." },
        { amount: 950, impact: "Can see a trafficked survivor back into formal education for 1 year." },
        { amount: 2000, impact: "See one life restored from Slavery!" },
      ]}
      coverageFee={(amt) => {
        return amt / 20;
      }}
      defaultAmount={50}
      successUrl={`${
        process.env.NODE_ENV === "production"
          ? `https://www.${window.location.host}`
          : `http://${window.location.host}`
      }`}
    />
 */
export function PaymentStepper({
  active,
  context,
  options,
  title = "New donation",
  coverageDefaultsToOn = false,
  directDebitLink,
  successUrl,
  logo,
  cart,
  isOrder,
  minAmount = 500,
  bankDetails,
  metadata,
  message,
  calculateCoverage,
  onClose,
}: PaymentStepperProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(0);
  const [identity, setIdentity] =
    useState<Identity>({
      first: "",
      last: "",
      email: context.session?.user.email ?? "",
    });
  const [payment, setPayment] =
    useState<PaymentObject>({
      cents: amount * 100,
      title: title,
      freq: undefined,
      currency: "aud",
      returnUrl: successUrl,
      cart: cart,
      metadata: { ...metadata },
    });
  const [coverageSelected, setCoverageSelected] =
    useState(coverageDefaultsToOn);
  const [coverageFee, setCoverageFee] =
    useState(0);

  /************************************************
   * GSAP Animation Logic (Scoped to containerRef)
   */
  useGSAP(() => {
    if (active && !isOrder) {
      gsap.from(".step-content", {
        opacity: 0,
        x: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [step, active]);

  /********************************************
   * PAYMENT UPDATE USE EFFECT
   * This runs whenever the payment object updates
   * to recalulate the totals
   */
  useEffect(() => {
    if (!payment.cart) return;

    const total =
      calculateCartAmount(payment.cart) / 100;
    setAmount(total);

    let rawTotal = 0;

    payment.cart.forEach((item) => {
      if (item.product.name === "Admin support") {
        rawTotal += 0;
        payment.metadata = {
          ...payment.metadata,
          support_fee: item.product.amount,
        };
      } else {
        rawTotal +=
          item.product.amount * item.quantity;
        payment.metadata = {
          ...payment.metadata,
          support_fee: undefined,
        };
      }
    });
    calculateCoverage &&
      setCoverageFee(
        Math.round(calculateCoverage(rawTotal)) /
          100,
      );
  }, [payment]);

  /************************************
   * PROFILE PREFILL USE EFFECT
   * Sync identity fields when profile or session loads
   */
  useEffect(() => {
    if (step >= 2) return;
    setIdentity((prev) => ({
      ...prev,
      email: context.session?.user.email ?? prev.email,
    }));
  }, [context.session]);

  /************************************
   * SCROLL LOCK USE EFFECT
   * Prevent background scroll while the modal is open
   */
  useEffect(() => {
    document.body.style.overflow = active
      ? "hidden"
      : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  /************************************
   * ACTIVE USE EFFECT
   * This one calculates the totals before the UI loads
   */
  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }

    const total = calculateCartAmount(cart) / 100;
    setAmount(total);
    setPayment({
      ...payment,
      cart: cart,
      returnUrl: successUrl,
      metadata: {
        origin_site: context.brandConfig.origin_site,
        ...metadata,
      },
    });
    calculateCoverage &&
      setCoverageFee(
        Math.round(calculateCoverage(total)) /
          100,
      );
    if (isOrder) setStep(1);
  }, [active]);

  /*********************************
   * COVERAGE SELECTED USE EFFECT
   * This one updates the admin fees covered amount
   * when user checks the box
   */
  useEffect(() => {
    coverageSelected === true
      ? calculateCoverage &&
        onCartChange({
          product: {
            name: "Admin support",
            amount: coverageFee * 100,
          },
          quantity: 1,
        })
      : onCartChange({
          product: {
            name: "Admin support",
            amount: 0,
          },
          quantity: 0,
        });
  }, [coverageSelected]);

  /*********************************
   * Update the cart with a new or exising item
   * @param newItem The item to update or add
   */
  function onCartChange(
    newItem: CartItem,
    replace = false,
  ) {
    if (replace === true) {
      setPayment({ ...payment, cart: [newItem] });
      return;
    }
    // If item quantity is 0 remove it from the array
    const cart =
      newItem.quantity === 0
        ? payment.cart.filter(
            (item) =>
              item.product.name !=
              newItem.product.name,
          )
        : [...payment.cart];

    // Add or  update the item
    const index = cart.findIndex(
      (item) =>
        item.product.name ===
        newItem.product.name,
    );
    if (newItem.quantity > 0) {
      if (index === -1) cart.push(newItem);
      else cart[index] = newItem;
    }

    setPayment({ ...payment, cart: cart });
  }

  /******************************
   * Runs after user submits identity form
   */
  async function onIdentityNext(identity: Identity) {
    setIdentity(identity);
    setStep(2);
  }

  /***********************************************
   * Step indicator config — one icon per stage
   */
  const stepIcons: IoniconName[] = [
    "cash",
    "person",
    "card",
  ];

  /***********************************************
   * View Switcher (Cleaner than inline ternary hell)
   */
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <CheckoutAmount
            amount={amount}
            onAmountChange={(amt) =>
              onCartChange(
                {
                  product: {
                    id: 0,
                    amount: amt,
                    name: title,
                  },
                  quantity: 1,
                },
                true,
              )
            }
            message={message}
            cart={payment.cart}
            minAmount={minAmount}
            options={options}
            coverageSelected={coverageSelected}
            onNext={() => setStep(1)}
            freq={payment.freq || null}
            onFreqChange={(f) =>
              setPayment({
                ...payment,
                freq: f || undefined,
              })
            }
            coverageFee={coverageFee}
            onCoverageChange={() =>
              setCoverageSelected(
                !coverageSelected,
              )
            }
            directDebitLink={directDebitLink}
            bankDetails={bankDetails}
          />
        );
      case 1:
        return (
          <CheckoutIdentity
            identity={identity}
            metadata={payment.metadata}
            setMetadata={(meta) =>
              setPayment({
                ...payment,
                metadata: {
                  ...payment.metadata,
                  ...meta,
                },
              })
            }
            isOrder={isOrder}
            onBack={() => setStep(0)}
            onNext={onIdentityNext}
            amount={amount}
            context={context}
          />
        );
      case 2:
        return (
          <CheckoutCard
            context={context}
            identity={identity}
            paymentProps={payment}
            onBack={() => setStep(1)}
          />
        );
      default:
        return null;
    }
  }

  return (
    <SlideOutModal
      active={active}
      width={context.inShrink ? "90vw" : 400}
      onClose={onClose}
      style={{ zIndex: 50 }}
      context={context}
    >
      <div
        ref={containerRef}
        style={{
          overflowY: "auto",
          overflowX: "clip",
          maxHeight: "95%",
        }}
        className="w-100 col between h-100"
      >
        <div>
          <div className="row gap-10 mt-10 center">
            {stepIcons.map((iconName, i) => (
              <div
                key={iconName}
                className="middle center"
                style={{
                  padding: "8px",
                  borderRadius: "50%",
                  background:
                    step === i
                      ? "var(--accent)"
                      : "var(--accent-md)",
                  transition:
                    "background 0.3s ease, transform 0.3s ease",
                  transform:
                    step === i
                      ? "scale(1.3)"
                      : "scale(1)",
                }}
              >
                <Icon
                  name={iconName}
                  size={12}
                  color={
                    step === i
                      ? "var(--accent-sm)"
                      : "var(--txt)"
                  }
                />
              </div>
            ))}
          </div>
          {step < 2 && (
            <header className="pb-10 pt-10 col m-10">
              <div className="row gap-5 middle center">
                <h3
                  className=""
                  style={{
                    fontSize: "var(--text-h4)",
                  }}
                >
                  {message?.header || title}
                </h3>
              </div>
              <div
                className="row middle center gap-5 mb-10"
                style={{ alignItems: "end" }}
              >
                <h4>AUD</h4>
                <h2
                  className="mt-20 "
                  style={{ textAlign: "center" }}
                >
                  <strong
                    style={{
                      color: "var(--accent-bold)",
                      fontWeight: 600,
                    }}
                  >
                    ${formatDollars(amount)}
                  </strong>
                  {payment.freq &&
                    ` per ${payment.freq}`}
                </h2>
              </div>
            </header>
          )}
          <div className="step-content m-10">
            {renderStep()}
          </div>
        </div>
        <div className="row middle center">
          <img
            src={logo}
            style={{ width: 150 }}
          />
        </div>
      </div>
    </SlideOutModal>
  );
}
