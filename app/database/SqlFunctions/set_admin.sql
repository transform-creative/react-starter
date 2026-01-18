-- Used to set specific users as an admin
update auth.users as u
set
  raw_user_meta_data = 
    raw_user_meta_data || '{"role": "admin"}'
where
  u.email in (
    'isaacthelad2@gmail.com'
  );

-- Testing
--select id, email, raw_user_meta_data from auth.users as u;