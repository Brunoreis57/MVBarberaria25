-- Add desconto_valor column to atendimentos table
ALTER TABLE public.atendimentos
ADD COLUMN desconto_valor numeric DEFAULT 0;