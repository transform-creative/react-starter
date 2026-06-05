-- Used to set specific users as an admin
UPDATE
  auth.users AS u
SET
  raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
WHERE
  u.email IN ('isaacthelad2@gmail.com');

-- Testing
--select id, email, raw_app_meta_data from auth.users as u;