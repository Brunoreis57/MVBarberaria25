-- Corrigir todas as funções security definer para usar search_path vazio

-- Função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'));
  RETURN NEW;
END;
$$;

-- Função assign_default_role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Apenas adiciona role se o usuário ainda não tiver uma
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.id
  ) THEN
    -- Se não for um dos admins, adiciona como barber
    IF NEW.email NOT IN ('bruno.g.reis@gmail.com', 'mvadministrador@gmail.com') THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'barber'::app_role);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;