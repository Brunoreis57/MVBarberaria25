-- Adicionar coluna atendimento_id na tabela pagamentos para relacionar com atendimentos
ALTER TABLE pagamentos 
ADD COLUMN atendimento_id uuid REFERENCES atendimentos(id) ON DELETE CASCADE;

-- Adicionar índice para melhor performance
CREATE INDEX idx_pagamentos_atendimento_id ON pagamentos(atendimento_id);