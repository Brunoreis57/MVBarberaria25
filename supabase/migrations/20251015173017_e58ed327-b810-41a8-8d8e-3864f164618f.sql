-- Create notifications table
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notificacoes
FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can create notifications
CREATE POLICY "Authenticated users can create notifications"
ON public.notificacoes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notificacoes
FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_notificacoes_user_id ON public.notificacoes(user_id);
CREATE INDEX idx_notificacoes_created_at ON public.notificacoes(created_at DESC);