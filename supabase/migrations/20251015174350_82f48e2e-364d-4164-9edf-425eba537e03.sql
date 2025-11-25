-- Fix functions and policies referencing enum without schema qualification

-- 1) Update has_role to use schema-qualified enum and table references
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 2) Update assign_default_role to cast with public.app_role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Apenas adiciona role se o usuário ainda não tiver uma
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.id
  ) THEN
    -- Se não for um dos admins, adiciona como barber
    IF NEW.email NOT IN ('bruno.g.reis@gmail.com', 'mvadministrador@gmail.com') THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'barber'::public.app_role);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3) Recreate policies that cast to enum; qualify enum type

-- Barbeiros: Only admins can manage barbers
DROP POLICY IF EXISTS "Only admins can manage barbers" ON public.barbeiros;
CREATE POLICY "Only admins can manage barbers"
ON public.barbeiros
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Produtos: Only admins can manage produtos
DROP POLICY IF EXISTS "Only admins can manage produtos" ON public.produtos;
CREATE POLICY "Only admins can manage produtos"
ON public.produtos
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Servicos: Only admins can manage services
DROP POLICY IF EXISTS "Only admins can manage services" ON public.servicos;
CREATE POLICY "Only admins can manage services"
ON public.servicos
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Retiradas: Only admins can update retiradas
DROP POLICY IF EXISTS "Only admins can update retiradas" ON public.retiradas;
CREATE POLICY "Only admins can update retiradas"
ON public.retiradas
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
