-- Function to decide if user is admin based on user_id
create or replace function is_admin()
returns boolean
language plpgsql
security definer
as $$

declare
  user_role text;

begin
set search_path = '';

select CAST(u.raw_user_meta_data->>'role' AS text) 
from auth.users as u 
into user_role
where u.id = auth.uid()
limit 1;

if user_role = 'admin' then 
  return true;
end if;

return false;

end; $$;

--TESTING
--select * from is_admin()