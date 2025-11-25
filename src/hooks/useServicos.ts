import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useServicos = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("public:servicos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "servicos" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["servicos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
