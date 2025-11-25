import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePagamentos = () => {
  return useQuery({
    queryKey: ["pagamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*")
        .order("data_pagamento", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
