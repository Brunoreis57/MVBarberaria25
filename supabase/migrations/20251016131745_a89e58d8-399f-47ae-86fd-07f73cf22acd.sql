-- Adicionar coluna de categoria aos serviços
ALTER TABLE servicos ADD COLUMN categoria text;

-- Criar índice para melhorar performance de consultas por categoria
CREATE INDEX idx_servicos_categoria ON servicos(categoria);