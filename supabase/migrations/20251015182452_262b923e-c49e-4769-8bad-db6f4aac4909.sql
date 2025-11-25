-- Adicionar coluna de porcentagem de comissão para barbeiros
ALTER TABLE public.barbeiros
ADD COLUMN porcentagem_comissao numeric DEFAULT 50 CHECK (porcentagem_comissao >= 0 AND porcentagem_comissao <= 100);