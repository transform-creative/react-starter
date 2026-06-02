import { render } from "@react-email/render";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import React from "react";
import MagicLinkEmail, { NAME_PLACEHOLDER, TOKEN_PLACEHOLDER } from "./templates/MagicLinkEmail.tsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../../../templates");

mkdirSync(outDir, { recursive: true });

async function renderTemplate(
  component: React.ReactElement,
  outputFile: string,
  replacements: Record<string, string> = {}
) {
  let html = await render(component);
  for (const [placeholder, value] of Object.entries(replacements)) {
    html = html.replaceAll(placeholder, value);
  }
  const outPath = resolve(outDir, outputFile);
  writeFileSync(outPath, html, "utf-8");
  console.info(`✓ ${outputFile}`);
}

await renderTemplate(
  React.createElement(MagicLinkEmail, { name: NAME_PLACEHOLDER, token: TOKEN_PLACEHOLDER }),
  "magic_link.html",
  {
    [NAME_PLACEHOLDER]: "{{ .Data.name }}",
    [TOKEN_PLACEHOLDER]: "{{ .Token }}",
  }
);

console.info(`\nTemplates written to supabase/templates/`);
