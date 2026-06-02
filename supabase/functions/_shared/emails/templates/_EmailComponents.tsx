import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Button,
  Text,
} from "react-email";
import {
  h1,
  banner,
  buttonPrimary,
  buttonSecondary,
  contactEmail,
  container,
  footer,
  hr,
  link,
  main,
  getBrandName,
} from "./styles.ts";

export interface EmailButtonProps {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  style?: React.CSSProperties;
}

export function EmailButton({
  href,
  label,
  variant = "primary",
  style,
}: EmailButtonProps) {
  return (
    <Button
      style={{
        ...(variant === "primary" ? buttonPrimary : buttonSecondary),
        ...style,
      }}
      href={href}
    >
      {label}
    </Button>
  );
}

export interface EmailFooterProps {
  origin_site?: string;
}

export function EmailFooter({ origin_site }: EmailFooterProps = {}) {
  const brandName = getBrandName(origin_site);
  return (
    <>
      <hr style={hr} />
      <section style={footer}>
        <p>This is an automated email sent by {brandName}.</p>
        <p>
          Please{" "}
          <a style={link} href={`mailto:${contactEmail}`}>
            contact us
          </a>{" "}
          if you don't want to receive these emails.
        </p>
      </section>
    </>
  );
}

export interface EmailWrapperProps {
  previewText: string;
  children: React.ReactNode;
  /** Optional brand override. Defaults to the BRAND_NAME env var. */
  brandName?: string;
  /** Optional banner image URL. Drop to hide the banner. */
  logoUrl?: string;
}

export function EmailWrapper({
  previewText,
  children,
  brandName,
  logoUrl,
}: EmailWrapperProps) {
  const displayBrand = brandName ?? getBrandName();
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text
            style={{
              ...h1,
              fontSize: 14,
              justifyContent: "center",
              display: "flex",
              color: "#222222",
            }}
          >
            {displayBrand}
          </Text>
          {logoUrl && (
            <Img src={logoUrl} width="100%" alt={displayBrand} style={banner} />
          )}
          {children}
        </Container>
      </Body>
    </Html>
  );
}
