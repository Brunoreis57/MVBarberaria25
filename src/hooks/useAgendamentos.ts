import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAgendamentos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["agendamentos", user?.id],
    queryFn: async () => {
      let query = supabase
        .from("agendamentos")
        .select(`
          *,
          barbeiros (
            nome
          )
        `)
        .neq("status", "concluido")
        .order("data", { ascending: true })
        .order("hora", { ascending: true });

      // Se for barbeiro, filtra apenas seus agendamentos
      if (user?.role === "barber") {
        // Primeiro, busca o barbeiro_id correspondente ao user_id
        const { data: barbeiroData } = await supabase
          .from("barbeiros")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (barbeiroData) {
          query = query.eq("barbeiro_id", barbeiroData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
