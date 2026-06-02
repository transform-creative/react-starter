/**
 * email-handler
 * Drains the `general_email_queue` pgmq queue and dispatches each message
 * to `sendEmail` (in generateEmailBody.ts), which renders the matching
 * react-email template and sends via Resend.
 *
 * Schedule this function to run on a cron (e.g. every minute) via Supabase
 * scheduled functions. Each invocation processes up to N messages so spikes
 * don't time out the function.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendEmail } from "./generateEmailBody.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const QUEUE_NAME = Deno.env.get("EMAIL_QUEUE_NAME") ?? "general_email_queue";
const BATCH_SIZE = 5;
const VISIBILITY_SECONDS = 5;

async function processMessage(message: any) {
  const data = message.message;

  const { error: sendErr } = await sendEmail(data);
  if (sendErr) throw sendErr;

  const { error: archiveErr } = await supabase
    .schema("pgmq_public")
    .rpc("archive", {
      queue_name: QUEUE_NAME,
      message_id: message.msg_id,
    });

  if (archiveErr) {
    console.error(
      `Failed to archive message ${message.msg_id}:`,
      archiveErr,
    );
  }
}

Deno.serve(async () => {
  const errors: unknown[] = [];

  const { data: messages, error } = await supabase
    .schema("pgmq_public")
    .rpc("read", {
      queue_name: QUEUE_NAME,
      sleep_seconds: VISIBILITY_SECONDS,
      n: BATCH_SIZE,
    });

  if (error) {
    console.error(`Error reading queue ${QUEUE_NAME}:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!messages || messages.length === 0) {
    return new Response(null, { status: 204 });
  }

  for (const message of messages) {
    try {
      await processMessage(message);
    } catch (err) {
      console.error("processMessage failed:", err);
      errors.push(err);
    }
  }

  if (errors.length > 0) {
    return new Response(JSON.stringify({ errors: errors.map(String) }), {
      status: 510,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ processed: messages.length }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
