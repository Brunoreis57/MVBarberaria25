-- Add INSERT policy for profiles table
-- This allows the handle_new_user trigger to create profiles for new users
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Also ensure the handle_new_user function has the correct permissions
-- The trigger should be able to insert into profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;