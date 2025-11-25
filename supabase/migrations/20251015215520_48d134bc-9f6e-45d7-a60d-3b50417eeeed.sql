-- Criar tabela de planos
CREATE TABLE public.planos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  quantidade_cortes INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de assinaturas de planos
CREATE TABLE public.assinaturas_planos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id UUID REFERENCES public.planos(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  cortes_utilizados INTEGER DEFAULT 0,
  cortes_totais INTEGER NOT NULL,
  forma_pagamento TEXT NOT NULL,
  valor_pago NUMERIC NOT NULL,
  pago BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas_planos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para planos
CREATE POLICY "Anyone can view planos"
  ON public.planos FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage planos"
  ON public.planos FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para assinaturas
CREATE POLICY "Authenticated users can view assinaturas"
  ON public.assinaturas_planos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create assinaturas"
  ON public.assinaturas_planos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update assinaturas"
  ON public.assinaturas_planos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON public.planos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assinaturas_planos_updated_at
  BEFORE UPDATE ON public.assinaturas_planos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();