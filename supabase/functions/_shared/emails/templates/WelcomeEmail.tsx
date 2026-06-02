import React from "react";
import { render } from "@react-email/render";
import { Heading, Section, Text } from "react-email";
import {
  baseUrl,
  h1,
  h2,
  p,
  content,
  col,
  amountHighlight,
  getBrandName,
} from "./styles.ts";
import {
  EmailButton,
  EmailFooter,
  EmailWrapper,
} from "./_EmailComponents.tsx";

export interface WelcomeEmailProps {
  userName?: string;
  origin_site?: string;
}

export default function WelcomeEmail({
  userName,
  origin_site,
}: WelcomeEmailProps) {
  const site_name = getBrandName(origin_site);
  return (
    <EmailWrapper previewText={`Welcome to ${site_name}!`}>
      <Section style={content}>
        <Heading style={h1}>
          {userName ? `Welcome, ${userName}!` : "Welcome!"}
        </Heading>

        <Text style={h2}>
          You're now part of the <strong>{site_name}</strong> community.
        </Text>

        <Text style={p}>
          <strong style={amountHighlight}>Ready to get started?</strong>
        </Text>

        <Section style={col}>
          <EmailButton href={baseUrl} label="Open the app" />
        </Section>
      </Section>
      <EmailFooter origin_site={origin_site} />
    </EmailWrapper>
  );
}

export async function renderWelcomeEmail(
  props: WelcomeEmailProps,
): Promise<string> {
  return await render(React.createElement(WelcomeEmail, props));
}
