-- Adicionar coluna para indicar de onde sai o desconto
ALTER TABLE public.atendimentos 
ADD COLUMN desconto_tipo text CHECK (desconto_tipo IN ('barbeiro', 'barbearia')) DEFAULT NULL;

COMMENT ON COLUMN public.atendimentos.desconto_tipo IS 'Indica se o desconto sai da comissão do barbeiro ou da barbearia';