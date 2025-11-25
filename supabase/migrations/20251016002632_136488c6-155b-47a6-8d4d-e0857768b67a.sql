-- Remover a política existente de delete para notificações
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notificacoes;

-- Criar nova política que permite admins deletarem todas as notificações
CREATE POLICY "Admins can delete all notifications"
ON public.notificacoes
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Permitir usuários deletarem suas próprias notificações
CREATE POLICY "Users can delete own notifications"
ON public.notificacoes
FOR DELETE
USING (auth.uid() = user_id);