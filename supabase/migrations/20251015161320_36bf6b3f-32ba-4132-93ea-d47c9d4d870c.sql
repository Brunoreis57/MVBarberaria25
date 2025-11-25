-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'barber');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create barbeiros table
CREATE TABLE public.barbeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create servicos table
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  duracao_minutos INTEGER DEFAULT 30,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agendamentos table
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  barbeiro_id UUID REFERENCES public.barbeiros(id),
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create atendimentos table
CREATE TABLE public.atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID REFERENCES public.barbeiros(id),
  cliente_nome TEXT NOT NULL,
  servico_id UUID REFERENCES public.servicos(id),
  forma_pagamento TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_atendimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pagamentos table  
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valor DECIMAL(10,2) NOT NULL,
  metodo_pagamento TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'entrada',
  data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create retiradas table
CREATE TABLE public.retiradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valor DECIMAL(10,2) NOT NULL,
  pessoa TEXT NOT NULL,
  motivo TEXT NOT NULL,
  data_retirada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  aprovado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create produtos table
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_custo DECIMAL(10,2),
  preco_venda DECIMAL(10,2) NOT NULL,
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retiradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for barbeiros
CREATE POLICY "Anyone can view barbers" ON public.barbeiros FOR SELECT USING (true);
CREATE POLICY "Only admins can manage barbers" ON public.barbeiros FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for servicos
CREATE POLICY "Anyone can view services" ON public.servicos FOR SELECT USING (true);
CREATE POLICY "Only admins can manage services" ON public.servicos FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for agendamentos
CREATE POLICY "Anyone can create appointments" ON public.agendamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view appointments" ON public.agendamentos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update appointments" ON public.agendamentos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete appointments" ON public.agendamentos FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for atendimentos
CREATE POLICY "Authenticated users can view atendimentos" ON public.atendimentos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create atendimentos" ON public.atendimentos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for pagamentos
CREATE POLICY "Authenticated users can view pagamentos" ON public.pagamentos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create pagamentos" ON public.pagamentos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for retiradas
CREATE POLICY "Authenticated users can view retiradas" ON public.retiradas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create retiradas" ON public.retiradas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Only admins can update retiradas" ON public.retiradas FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for produtos
CREATE POLICY "Authenticated users can view produtos" ON public.produtos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Only admins can manage produtos" ON public.produtos FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default services
INSERT INTO public.servicos (nome, preco, duracao_minutos) VALUES
('Corte', 35.00, 30),
('Barba', 25.00, 20),
('Corte + Barba', 55.00, 50),
('Sobrancelha', 15.00, 10);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();