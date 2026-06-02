import React from "react";
import { render } from "@react-email/render";
import { Heading, Section, Text } from "react-email";
import {
  h1,
  h2,
  p,
  amountHighlight,
  content,
  col,
  card,
} from "./styles.ts";
import {
  EmailButton,
  EmailFooter,
  EmailWrapper,
} from "./_EmailComponents.tsx";

export interface PaymentReceiptEmailProps {
  recipientName?: string;
  /** Product / line item description shown in the receipt. */
  productName?: string;
  /** Total charged, in cents. */
  amountCents?: number;
  /** Optional URL to the hosted Stripe receipt or detailed view. */
  receiptUrl?: string;
  origin_site?: string;
}

export default function PaymentReceiptEmail({
  recipientName,
  productName,
  amountCents,
  receiptUrl,
  origin_site,
}: PaymentReceiptEmailProps) {
  const dollars =
    typeof amountCents === "number"
      ? (amountCents / 100).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  return (
    <EmailWrapper previewText="Payment received — thank you">
      <Section style={content}>
        <Heading style={h1}>
          Thank you{recipientName ? `, ${recipientName}` : ""}!
        </Heading>

        {dollars && (
          <Text style={h2}>
            Your payment of{" "}
            <strong style={amountHighlight}>${dollars}</strong> has been
            received.
          </Text>
        )}

        {productName && (
          <Section style={card}>
            <Text style={p}>
              <strong>{productName}</strong>
            </Text>
          </Section>
        )}

        {receiptUrl && (
          <Section style={col}>
            <EmailButton href={receiptUrl} label="View receipt" />
          </Section>
        )}
      </Section>
      <EmailFooter origin_site={origin_site} />
    </EmailWrapper>
  );
}

export async function renderPaymentReceiptEmail(
  props: PaymentReceiptEmailProps,
): Promise<string> {
  return await render(React.createElement(PaymentReceiptEmail, props));
}
