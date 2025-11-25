-- Corrigir o search_path da função assign_default_role para ser imutável
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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