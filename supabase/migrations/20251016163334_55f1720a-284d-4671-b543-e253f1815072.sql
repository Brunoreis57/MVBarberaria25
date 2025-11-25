-- Atualizar política de delete em atendimentos para apenas admins
DROP POLICY IF EXISTS "Authenticated users can delete atendimentos" ON public.atendimentos;

CREATE POLICY "Only admins can delete atendimentos" 
ON public.atendimentos 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));