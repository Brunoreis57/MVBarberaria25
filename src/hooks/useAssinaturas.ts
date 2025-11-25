import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAssinaturas = () => {
  return useQuery({
    queryKey: ["assinaturas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assinaturas_planos")
        .select(`
          *,
          planos (
            nome,
            quantidade_cortes,
            valor
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
