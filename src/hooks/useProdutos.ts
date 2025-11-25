import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProdutos = () => {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
