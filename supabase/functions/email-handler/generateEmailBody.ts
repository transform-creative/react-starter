/**
 * generateEmailBody
 * Maps a queue message to the matching react-email template, renders the
 * HTML, and POSTs to Resend. Add new branches to `sendEmail` as you add
 * templates.
 *
 * Expected message shape: { type: string, recipient_email: string, ...templateProps }
 */

// @ts-ignore Deno-resolved npm import
import { render } from "npm:@react-email/render@0.0.12";
import MagicLinkEmail from "../_shared/emails/templates/MagicLinkEmail.tsx";
import WelcomeEmail from "../_shared/emails/templates/WelcomeEmail.tsx";
import ErrorLogEmail from "../_shared/emails/templates/ErrorLogEmail.tsx";
import PaymentReceiptEmail from "../_shared/emails/templates/PaymentReceiptEmail.tsx";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@example.com";

interface EmailResult {
  data?: unknown;
  error?: string | null;
}

interface MailMessage {
  type: string;
  recipient_email: string;
  subject?: string;
  origin_site?: string;
  [key: string]: any;
}

/******************************
 * sendEmail — dispatch by `type`. Each branch builds template props from the
 * incoming payload, renders the email, and pushes to Resend.
 */
export async function sendEmail(data: MailMessage): Promise<EmailResult> {
  switch (data.type) {
    case "account.created":
      return sendTemplate({
        to: data.recipient_email,
        subject: data.subject ?? "Welcome",
        html: await render(
          WelcomeEmail({
            userName: data.userName,
            origin_site: data.origin_site,
          }),
        ),
      });

    case "payment.received":
      return sendTemplate({
        to: data.recipient_email,
        subject: data.subject ?? "Payment received",
        html: await render(
          PaymentReceiptEmail({
            recipientName: data.recipientName,
            productName: data.productName,
            amountCents: data.amountCents,
            receiptUrl: data.receiptUrl,
            origin_site: data.origin_site,
          }),
        ),
      });

    case "error.logged":
      return sendTemplate({
        to: data.recipient_email,
        subject: data.subject ?? "Error report",
        html: await render(
          ErrorLogEmail({
            app: data.app,
            count: data.count,
            items: data.items,
            view_url: data.view_url,
            origin_site: data.origin_site,
          }),
        ),
      });

    case "magic_link":
      return sendTemplate({
        to: data.recipient_email,
        subject: data.subject ?? "Your sign-in code",
        html: await render(
          MagicLinkEmail({
            name: data.name,
            token: data.token,
            origin_site: data.origin_site,
          }),
        ),
      });

    default:
      return { error: `invalid_template ${data.type}` };
  }
}

/******************************
 * sendTemplate — minimal Resend wrapper. Swap to SendGrid / Postmark / etc.
 * by replacing the fetch call.
 */
async function sendTemplate(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — email not sent");
    return { error: null };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: `resend_${res.status}: ${body}` };
  }

  return { data: await res.json() };
}
