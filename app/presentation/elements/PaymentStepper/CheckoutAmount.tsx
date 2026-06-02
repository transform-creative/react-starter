import {
  Ref,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { Icon } from "../Icon";
import {
  CartItem,
  centsToString,
  FreqOptions,
} from "./StepperBL";
import { ErrorLabelType } from "~/data/CommonTypes";
import { formatNumber } from "~/data/Objects";
import { ErrorLabel } from "../ErrorLabel";
import { LabelInput } from "../LabelInput/LabelInput";
import { FeatureButton } from "../FeatureButton";
import { BankDetailsCard } from "./BankDetailsCard";
import { Checkbox } from "~/presentation/elements/Checkbox";

export interface CheckoutAmountProps {
  amount: number;
  freq: FreqOptions;
  freqOptions?: FreqOptions[];
  nodeRef?: Ref<HTMLDivElement | null>;
  options?: { amount: number; impact?: string }[];
  directDebitLink?: string;
  minAmount: number;
  coverageFee: number;
  coverageSelected: boolean;
  onCoverageChange: () => void;
  cart: CartItem[];
  message:
    | { header: string; body: string }
    | undefined;
  bankDetails?: {
    name: string;
    bsb: string;
    account: string;
  };
  onAmountChange: (newAmt: number) => void;
  onNext: () => void;
  onFreqChange: (freq: FreqOptions) => void;
}

/******************************
 * CheckoutAmount component
 * @todo Create description
 */
export function CheckoutAmount({
  amount,
  message,
  options,
  nodeRef,
  freq,
  freqOptions = [null, "week", "month", "year"],
  minAmount,
  cart,
  bankDetails,
  coverageFee,
  coverageSelected,
  onCoverageChange,
  onAmountChange,
  onFreqChange,
  onNext,
}: CheckoutAmountProps) {
  const buttonsRef = useRef<
    (HTMLButtonElement | null)[]
  >([]);

  const [hasTyped, setHasTyped] = useState(false);
  const [pillStyle, setPillStyle] = useState({
    width: 0,
    x: 0,
  });
  const [activeIndex, setActiveIndex] =
    useState<FreqOptions>(freq);
  const [error, setError] =
    useState<ErrorLabelType>({
      active: false,
    });
  const [showBankDetails, setShowBankDetails] =
    useState(false);

  // We measure the DOM elements to handle different text lengths perfectly
  useEffect(() => {
    const currentButton = buttonsRef.current.find(
      (b) => b?.id === (activeIndex || "once"),
    );
    if (currentButton) {
      setPillStyle({
        width: currentButton.offsetWidth,
        x: currentButton.offsetLeft,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (cart[0].product?.amount < minAmount)
        setError({
          active: true,
          text: `You can not give less than ${centsToString(minAmount)}`,
        });
      else setError({ active: false });
    }, 500);

    return () => {
      // 3. Clear the timeout using the captured ID
      clearTimeout(t);
    };
  }, [cart]);

  /***********************************
   * Toggles the bank details slide panel
   */
  function toggleBankDetails() {
    setShowBankDetails((prev) => !prev);
  }

  /***********************************
   * Runs when user types into input box
   * @param val
   */
  function onType(val: number) {
    setHasTyped(true);
    onAmountChange(val);
  }

  return (
    <div
      id="checkout-amount-div"
      className="col gap-10 between  mt-5"
      ref={nodeRef}
    >
      <form
        onSubmit={(f) => {
          f.preventDefault();
          onNext();
        }}
      >
        <div className="col gap-10 between">
          <div className="col gap-10 ">
            {freqOptions.length > 0 && (
              <div
                role="radiogroup"
                aria-label="Payment frequency"
                className="row w-100 gap-5 r-lg mb-10 outline-secondary"
                style={{ position: "relative" }}
              >
                <div
                  className="pill"
                  aria-hidden="true"
                  style={{
                    width: `${pillStyle.width}px`,
                    transform: `translateX(${pillStyle.x}px)`,
                  }}
                />
                {freqOptions.map((opt, i) => (
                  <button
                    key={opt}
                    id={opt || "once"}
                    /**@ts-ignore */
                    ref={(el) =>
                      (buttonsRef.current[i] = el)
                    }
                    type="button"
                    className={`w-100 ${activeIndex === opt && "txt"}`}
                    role="radio"
                    style={{
                      background: "none",
                    }}
                    onClick={(e) => {
                      setActiveIndex(opt);
                      onFreqChange(opt);
                    }}
                  >
                    {`${opt ? `${opt}ly` : "once"}`}
                  </button>
                ))}
              </div>
            )}
            <div className="row gap-5">
              {options?.map((opt) => (
                <button
                  key={opt.amount}
                  type="button"
                  style={{
                    flex: 1,
                  }}
                  className={`w-100 ${cart[0]?.product?.amount === opt.amount * 100 && "accent"} outline-secondary`}
                  onClick={() =>
                    onAmountChange(
                      opt.amount * 100,
                    )
                  }
                >
                  ${formatNumber(opt.amount)}
                </button>
              ))}
            </div>
          </div>

          <div
            className="row middle gap-5 w-100 r-default outline-secondary"
            style={{
              background: "var(--bkg-gradient)",
              padding: 1,
            }}
          >
            <LabelInput
              inlineLabel
              name="$"
              className="r-default pl-10 "
              placeholder="Custom amount"
              autoFocus={
                cart[0]?.product?.amount === 1000
              }
              value={
                hasTyped
                  ? Math.round(
                      cart[0].product?.amount,
                    ) / 100 || ""
                  : ""
              }
              onChange={(e) =>
                onType(
                  parseFloat(e.target.value) *
                    100 || 0,
                )
              }
              type="number"
            />
          </div>

          {options &&
            (() => {
              const selected = options.find(
                (opt) =>
                  opt.amount * 100 ===
                  cart[0]?.product?.amount,
              );
              return (
                <div className="col  gap-5 mt-20 mb-10 ">
                  <h2 className="accent">
                    {selected?.impact
                      ? selected.impact
                      : `Your $${formatNumber(amount)} donation has the potential to do great things!`}
                  </h2>
                </div>
              );
            })()}
          {coverageFee &&
            (() => {
              const baseAmount =
                cart.reduce(
                  (sum, item) =>
                    item.product.name ===
                    "Admin support"
                      ? sum
                      : sum +
                        item.product.amount *
                          item.quantity,
                  0,
                ) / 100;
              const coverageLabel = `Add ${baseAmount > 0 ? Math.round((coverageFee / baseAmount) * 100) : "0.0"}% to help us cover admin fees`;
              return (
                <Checkbox
                  className="mt-10 mb-10"
                  checked={coverageSelected}
                  onChange={() =>
                    onCoverageChange()
                  }
                  label={coverageLabel}
                />
              );
            })()}
          <div className="">
            <ErrorLabel
              active={error?.active}
              text={error.text}
              color="var(--danger)"
            />
            <button
              className="accent row middle gap-5 center w-100 outline-secondary"
              disabled={error.active === true}
            >
              <Icon name="arrow-forward" />
              Next
            </button>
          </div>
        </div>
      </form>
      <div>
        {message?.body && (
          <div className="row center w-100">
            <p
              className="mt-20 center"
              style={{
                lineBreak: "normal",
                color: "var(--accent-high)",
              }}
            >
              {message.body}
            </p>
          </div>
        )}
        {bankDetails && (
          <div className="">
            <button
              type="button"
              className="row middle gap-5 w-100 between outline-secondary p-10"
              onClick={toggleBankDetails}
            >
              Give by electronic transfer
              <Icon
                name={
                  showBankDetails
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={16}
              />
            </button>
            <AnimatePresence initial={false}>
              {showBankDetails && (
                <motion.div
                  key="bank-details"
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                  }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.25,
                    ease: "easeInOut",
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="outline-secondary boxed p-10 mt-5">
                    <BankDetailsCard
                      bankDetails={bankDetails}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
