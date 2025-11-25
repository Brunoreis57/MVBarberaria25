import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Notificacao {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  lida: boolean;
  created_at: string;
}

export const useNotificacoes = () => {
  const queryClient = useQueryClient();

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notificacao[];
    },
  });

  const marcarComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
    onError: (error) => {
      toast.error("Erro ao marcar notificação como lida");
      console.error(error);
    },
  });

  const criarNotificacao = useMutation({
    mutationFn: async (notificacao: Omit<Notificacao, "id" | "created_at" | "lida">) => {
      const { error } = await supabase
        .from("notificacoes")
        .insert(notificacao);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });

  return {
    notificacoes,
    isLoading,
    marcarComoLida,
    criarNotificacao,
  };
};
