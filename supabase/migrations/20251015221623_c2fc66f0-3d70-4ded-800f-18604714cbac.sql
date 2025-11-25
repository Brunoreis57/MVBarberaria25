-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(telefone)
);

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
CREATE POLICY "Authenticated users can view clientes"
  ON public.clientes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clientes"
  ON public.clientes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete clientes"
  ON public.clientes FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Criar tabela de configurações do sistema
CREATE TABLE public.configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas para configurações (apenas admins podem gerenciar)
CREATE POLICY "Anyone can view configuracoes"
  ON public.configuracoes FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage configuracoes"
  ON public.configuracoes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir configuração padrão para logo
INSERT INTO public.configuracoes (chave, valor)
VALUES ('logo_url', NULL);

-- Criar bucket para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Políticas de storage para logos
CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Admins can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger para atualizar updated_at em clientes
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em configuracoes
CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();