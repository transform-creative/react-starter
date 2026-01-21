-- Create a function that queries stripe for recent checkout sessions
------------------------------------------------------------------------

-- Generate the type
create  type stripe_checkout_session_min as (
  id text,
  created integer,
  currency text,
  customer_details jsonb,
  metadata jsonb,
  status text,
  mode text,
  amount_total bigint,
  subscription jsonb
);

-- Generate the function
create or replace function public.get_stripe_checkout_sessions () 
returns setof stripe_checkout_session_min 
language plpgsql 
security definer
set
  search_path = stripe stable as $$

begin

  -- enforce admin via roles table
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select cs.id, 
  cs.created, 
  cs.currency, 
  cs.customer_details, 
  cs.metadata, 
  cs.status, 
  cs.mode, 
  cs.amount_total, 
    (select (
      jsonb_build_object('id', s.id, 'interval', (s.plan::jsonb)->>'interval')
      ) from stripe.subscriptions s 
      where s.id = cs.subscription) as subscriptions
  from stripe.checkout_sessions as cs
  where status != 'expired' and status != 'open'
  order by cs.created desc
  limit 500;

end;
$$;

-- Test the function (should fail if no impersonating an admin user)
select
  *
from
  public.get_stripe_checkout_sessions ()