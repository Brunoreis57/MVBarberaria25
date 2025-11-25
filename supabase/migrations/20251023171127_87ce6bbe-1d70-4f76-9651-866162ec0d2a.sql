-- Adicionar campo barbeiro_id na tabela retiradas
ALTER TABLE public.retiradas 
ADD COLUMN barbeiro_id uuid REFERENCES public.barbeiros(id) ON DELETE SET NULL;