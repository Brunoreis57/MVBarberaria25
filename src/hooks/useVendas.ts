import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useVendas = () => {
  return useQuery({
    queryKey: ["vendas_produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas_produtos")
        .select(`
          *,
          produto:produtos(nome),
          barbeiro:barbeiros(nome)
        `)
        .order("data_venda", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
