import React from "react";
import { render } from "@react-email/render";
import { Heading, Section, Text } from "react-email";
import { h1, p, content, card } from "./styles.ts";
import { EmailFooter, EmailWrapper } from "./_EmailComponents.tsx";

export const NAME_PLACEHOLDER = "SUPABASE_NAME";
export const TOKEN_PLACEHOLDER = "SUPABASE_TOKEN";

export interface MagicLinkEmailProps {
  name?: string;
  token?: string;
  origin_site?: string;
}

/******************************
 * MagicLinkEmail — Supabase magic-link / OTP sign-in email.
 * Rendered to `supabase/templates/magic_link.html` via `render-auth-templates.ts`
 * with `{{ .Data.name }}` and `{{ .Token }}` interpolated in place of the placeholders.
 */
export default function MagicLinkEmail({
  name,
  token,
  origin_site,
}: MagicLinkEmailProps) {
  return (
    <EmailWrapper previewText="Your sign-in code">
      <Section style={content}>
        <Heading style={h1}>Your sign-in code</Heading>

        <Text style={p}>
          {name ? `Hi ${name}, use ` : "Use "}this code to sign in.
        </Text>

        <Section
          style={{
            ...card,
            padding: "20px 0",
            margin: 0,
          }}
        >
          <Text
            style={{
              ...h1,
              textTransform: "uppercase",
              letterSpacing: 5,
              color: "#121212",
            }}
          >
            {token}
          </Text>
        </Section>

        <Text style={p}>
          <strong>Kind regards.</strong>
        </Text>
      </Section>
      <EmailFooter origin_site={origin_site} />
    </EmailWrapper>
  );
}

export async function renderMagicLinkEmail(
  props: MagicLinkEmailProps,
): Promise<string> {
  return await render(React.createElement(MagicLinkEmail, props));
}
