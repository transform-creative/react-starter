-- 1. Create a dedicated table for Audit Logs
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz default now() not null,
  
  -- WHO did it? (Nullable because system events might not have a user)
  user_id uuid references auth.users(id) on delete set null,
  ip_address text,
  
  -- WHAT happened?
  event_type text not null, -- e.g. 'payment_failed', 'settings_updated'
  severity text check (severity in ('info', 'warning', 'error', 'critical')) default 'info',
  
  -- THE DATA (Flexible storage)
  metadata jsonb default '{}'::jsonb,
  
  -- Performance: Index commonly searched fields
  constraint audit_logs_event_type_key unique (id, timestamp) -- Helps with partitioning later
);

-- 2. Performance Indexes
-- You will almost always query logs by Time or User. Index them!
create index idx_audit_logs_timestamp on public.audit_logs(timestamp desc);
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_metadata on public.audit_logs using gin (metadata); 
-- ^ GIN index allows you to query INSIDE the JSON (e.g., find logs where metadata->'amount' > 50)

-- 3. Security (RLS) - CRITICAL
alter table public.audit_logs enable row level security;

-- Delete logs older than 90 days every night at 3 AM
select cron.schedule(
  'purge-old-audit-logs',
  '0 3 * * *', -- Cron syntax for 3 AM daily
  $$delete from public.audit_logs where timestamp < now() - interval '90 days'$$
);