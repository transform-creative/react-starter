import { useState, useRef, useMemo, useEffect } from "react";
import {useGSAP} from '@gsap/react'
import gsap from "gsap";
import { CheckoutAmount } from "./CheckoutAmount";
import { CheckoutIdentity } from "./CheckoutIdentity";
import { CheckoutCard } from "./CheckoutCard";
import SlideOutModal from "../SlideOutModal";

import {
  IdentityFormValues,
  PaymentObject,
  PaymentStepperProps,
} from "./StepperBL";
import { Icon } from "../Icon";

export function PaymentStepper({
  active,
  context,
  options,
  org,
  coverageDefaultsToOn = false,
  directDebitLink,
  defaultAmount = 50,
  customName,
  successUrl,
  logo,
  coverageFee,
  onClose,
}: PaymentStepperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(50);
  const [identity, setIdentity] = useState<IdentityFormValues>({
    first: "",
    last: "",
    email: "",
    phone: "",
  });
  const [payment, setPayment] = useState<PaymentObject>({
    cents: amount * 100,
    title: customName || `Donation to ${org}`,
    freq: undefined,
    currency: "aud",
    returnUrl: successUrl,
  });

  /************************************************
   * GSAP Animation Logic (Scoped to containerRef)
   */
  useGSAP(() => {
    if (active) {
      gsap.from(".step-content", {
        opacity: 0,
        x: 20,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [step, active]);

  useEffect(() => {
    setPayment({ ...payment, returnUrl: successUrl });
  }, []);

  /*****************************************
   *Centralized Handler (Prevents logic drift)
   */
  function handleIdentityChange(
    attr: keyof IdentityFormValues,
    value: any,
  ) {
    setIdentity((prev) => ({
      ...prev,
      [attr]: value,
    }));
  }

  /******************************************************
   * Runs when user checks or unchceckes the 'help cover admin fees' box
   */
  function onCoverageChange(amt: number): number {
    return coverageFee ? coverageFee(amt) : 0;
  }

  /******************************
   * Runs after user submits identity form
   */
  function onIdentityNext(form: IdentityFormValues) {
    setIdentity(form);
    setStep(2);
  }

  /***********************************************
   * View Switcher (Cleaner than inline ternary hell)
   */
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <CheckoutAmount
            amount={amount}
            options={options}
            setAmount={setAmount}
            defaultAmount={defaultAmount}
            onNext={() => setStep(1)}
            freq={payment.freq || null}
            onFreqChange={(f) =>
              setPayment({ ...payment, freq: f || undefined })
            }
            calculateCoverage={onCoverageChange}
            coverageDefaultsToOn={coverageDefaultsToOn}
            directDebitLink={directDebitLink}
          />
        );
      case 1:
        return (
          <CheckoutIdentity
            identity={identity}
            onIdentityChange={handleIdentityChange}
            onBack={() => setStep(0)}
            onNext={onIdentityNext}
            context={context}
            amount={amount}
          />
        );
      case 2:
        return (
          <CheckoutCard
            context={context}
            amount={amount}
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
      width={350}
      onClose={onClose}
      style={{ zIndex: 50 }}
    >
      <div
        ref={containerRef}
        style={{
          overflowY: "auto",
          overflowX: "clip",
          maxHeight: "95%",
        }}
        className="w100 col between h100"
      >
        <div>
          {step < 2 && (
            <header className="pb2 pt2 gap5 col">
              <div className="row gap5 middle">
                <Icon name="card-outline" size={15} />
                <h4 className="">Donate to {org}</h4>
              </div>
              <p className="">
                AUD{" "}
                <strong style={{ color: "var(--primary)" }}>
                  ${amount.toFixed(2)}
                </strong>
                {payment.freq && ` every ${payment.freq}`}
              </p>
            </header>
          )}
          <div className="step-content">{renderStep()}</div>
        </div>
        <div className="row middle center">
          <img src={logo} style={{ width: 150 }} />
        </div>
      </div>
    </SlideOutModal>
  );
}
