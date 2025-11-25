-- Adicionar política de UPDATE para atendimentos
CREATE POLICY "Authenticated users can update atendimentos"
ON atendimentos
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Adicionar política de DELETE para atendimentos
CREATE POLICY "Authenticated users can delete atendimentos"
ON atendimentos
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);