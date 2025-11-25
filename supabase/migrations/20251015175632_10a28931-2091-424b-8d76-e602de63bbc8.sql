-- Promover usuário vitormv@gmail.com para admin
UPDATE public.user_roles
SET role = 'admin'::public.app_role
WHERE user_id = '6e877d68-670f-4b29-934c-3ccb9e7ac92b';