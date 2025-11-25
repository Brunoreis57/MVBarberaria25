-- Adicionar coluna de porcentagem de comissão na tabela produtos
ALTER TABLE produtos
ADD COLUMN porcentagem_comissao NUMERIC DEFAULT 0;

-- Criar tabela de vendas de produtos
CREATE TABLE public.vendas_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  barbeiro_id UUID REFERENCES barbeiros(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_comissao NUMERIC DEFAULT 0,
  forma_pagamento TEXT NOT NULL,
  data_venda TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vendas_produtos ENABLE ROW LEVEL SECURITY;

-- Create policies for vendas_produtos
CREATE POLICY "Authenticated users can view vendas_produtos" 
ON public.vendas_produtos 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create vendas_produtos" 
ON public.vendas_produtos 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can delete vendas_produtos" 
ON public.vendas_produtos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendas_produtos;