-- Criar tabela para ajustes manuais de caixa dos barbeiros
CREATE TABLE public.ajustes_caixa_barbeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id UUID REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
  data_ajuste TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ajustes_caixa_barbeiro ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view ajustes_caixa_barbeiro"
  ON public.ajustes_caixa_barbeiro
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage ajustes_caixa_barbeiro"
  ON public.ajustes_caixa_barbeiro
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar índice para performance
CREATE INDEX idx_ajustes_caixa_barbeiro_barbeiro_id ON public.ajustes_caixa_barbeiro(barbeiro_id);
CREATE INDEX idx_ajustes_caixa_barbeiro_data ON public.ajustes_caixa_barbeiro(data_ajuste);