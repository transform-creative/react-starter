import React from "react";
import { render } from "@react-email/render";
import { Heading, Section, Text } from "react-email";
import {
  h1,
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

export interface ErrorLogItem {
  message: string;
  errors?: string[];
  event_type?: string;
  created_at?: string;
  audit_log_id?: string;
}

export interface ErrorLogEmailProps {
  app?: string;
  count?: number;
  items?: ErrorLogItem[];
  view_url?: string;
  origin_site?: string;
}

export default function ErrorLogEmail({
  app,
  count,
  items,
  view_url,
  origin_site,
}: ErrorLogEmailProps) {
  const errorCount = count || items?.length || 0;
  return (
    <EmailWrapper previewText={`${errorCount} new errors in ${app}`}>
      <Section style={content}>
        <Heading style={h1}>
          {errorCount} new{" "}
          <strong style={amountHighlight}>errors</strong> in {app}
        </Heading>

        {items?.map((item, i) => (
          <Section
            key={i}
            style={{
              ...card,
              textAlign: "left" as const,
            }}
          >
            <Text
              style={{
                ...p,
                margin: "0 0 4px",
                lineHeight: "24px",
                fontWeight: "600",
              }}
            >
              {item.message}
            </Text>
            {item.event_type && (
              <Text
                style={{
                  ...p,
                  margin: "0 0 8px",
                  fontSize: "13px",
                  color: "#5b5b5b",
                  lineHeight: "20px",
                }}
              >
                {item.event_type}
                {item.created_at
                  ? ` · ${new Date(item.created_at).toLocaleString()}`
                  : ""}
              </Text>
            )}
            {item.errors?.map(
              (err, j) =>
                typeof err === "string" && (
                  <Text
                    key={j}
                    style={{
                      ...p,
                      margin: "2px 0",
                      fontSize: "13px",
                      lineHeight: "20px",
                      color: "#c0392b",
                    }}
                  >
                    — {err}
                  </Text>
                ),
            )}
          </Section>
        ))}

        {view_url && (
          <Section style={{ ...col, marginTop: "24px" }}>
            <EmailButton href={view_url} label="Open Supabase" />
          </Section>
        )}
      </Section>
      <EmailFooter origin_site={origin_site} />
    </EmailWrapper>
  );
}

export async function renderErrorLogEmail(
  props: ErrorLogEmailProps,
): Promise<string> {
  return await render(React.createElement(ErrorLogEmail, props));
}
