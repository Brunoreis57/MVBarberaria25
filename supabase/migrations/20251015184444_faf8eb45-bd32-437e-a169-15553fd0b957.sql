-- Adicionar coluna pago à tabela atendimentos
ALTER TABLE public.atendimentos
ADD COLUMN pago BOOLEAN DEFAULT false;