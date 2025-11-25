import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBarbeiros = () => {
  return useQuery({
    queryKey: ["barbeiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbeiros")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data;
    },
  });
};
