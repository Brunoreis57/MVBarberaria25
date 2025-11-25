-- Permitir que forma_pagamento seja null até o atendimento ser marcado como pago
ALTER TABLE atendimentos 
ALTER COLUMN forma_pagamento DROP NOT NULL;