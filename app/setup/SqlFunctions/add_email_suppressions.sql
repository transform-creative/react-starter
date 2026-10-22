-- Email suppression list: addresses email-handler must never send to, apart
-- from the exempt types in supabase/functions/_shared/email-suppression.ts.
--
-- Enforced at SEND time by email-handler, not here. It reads this whole table
-- once per run and checks each message's recipient. Messages are still queued
-- as normal; a suppressed one is archived unsent with an `email_suppressed`
-- warning in audit_logs.
--
-- Manage it in Studio's table editor. Case and surrounding whitespace don't
-- matter, and the unique index rejects the same address twice in any casing.
-- Changes apply from email-handler's next run, with no redeploy.

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL CHECK (btrim(email) <> ''),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT current_user
);

COMMENT ON TABLE public.email_suppressions IS
  'Addresses email-handler never sends to (except exempt types). See supabase/functions/_shared/email-suppression.ts.';

CREATE UNIQUE INDEX IF NOT EXISTS email_suppressions_email_norm_key
  ON public.email_suppressions (lower(btrim(email)));

-- No policies: only the service role (email-handler) and Studio can see it.
-- It's a list of people who asked to be left alone, and isn't for the browser.
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_suppressions FROM anon, authenticated;
