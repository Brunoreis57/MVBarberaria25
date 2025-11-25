-- Adicionar coluna servico_id à tabela agendamentos
ALTER TABLE public.agendamentos
ADD COLUMN servico_id UUID REFERENCES public.servicos(id);