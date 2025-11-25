import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAtendimentos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["atendimentos", user?.id],
    queryFn: async () => {
      let query = supabase
        .from("atendimentos")
        .select(`
          *,
          barbeiros (
            nome
          ),
          servicos (
            nome,
            preco
          )
        `)
        .order("data_atendimento", { ascending: false });

      // Se for barbeiro, busca o ID do barbeiro e filtra seus atendimentos
      if (user?.role === "barber") {
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
