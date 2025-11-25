-- Adicionar política de DELETE para notificações
CREATE POLICY "Users can delete their own notifications"
ON public.notificacoes
FOR DELETE
USING (auth.uid() = user_id);

-- Adicionar política de DELETE para pagamentos (apenas admins)
CREATE POLICY "Admins can delete pagamentos"
ON public.pagamentos
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Adicionar política de DELETE para retiradas (apenas admins)
CREATE POLICY "Admins can delete retiradas"
ON public.retiradas
FOR DELETE
USING (has_role(auth.uid(), 'admin'));