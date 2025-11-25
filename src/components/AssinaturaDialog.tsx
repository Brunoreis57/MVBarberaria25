import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePlanos } from "@/hooks/usePlanos";
import { format, addMonths } from "date-fns";

interface AssinaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assinatura?: any;
}

export const AssinaturaDialog = ({ open, onOpenChange, assinatura }: AssinaturaDialogProps) => {
  const queryClient = useQueryClient();
  const { data: planos } = usePlanos();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    plano_id: assinatura?.plano_id || "",
    cliente_nome: assinatura?.cliente_nome || "",
    cliente_telefone: assinatura?.cliente_telefone || "",
    data_inicio: assinatura?.data_inicio || format(new Date(), "yyyy-MM-dd"),
    data_fim: assinatura?.data_fim || format(addMonths(new Date(), 1), "yyyy-MM-dd"),
    forma_pagamento: assinatura?.forma_pagamento || "antecipado",
    pago: assinatura?.pago ?? false,
    cortes_utilizados: assinatura?.cortes_utilizados || 0,
  });

  const selectedPlano = planos?.find(p => p.id === formData.plano_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        cortes_totais: selectedPlano?.quantidade_cortes || 0,
        valor_pago: selectedPlano?.valor || 0,
      };

      const foiMarcadoComoPago = formData.pago && (!assinatura || !assinatura.pago);

      if (assinatura) {
        const { error } = await supabase
          .from("assinaturas_planos")
          .update(dataToSubmit)
          .eq("id", assinatura.id);

        if (error) throw error;
        toast.success("Assinatura atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("assinaturas_planos")
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success("Assinatura criada com sucesso!");
      }

      // Registrar pagamento no caixa se foi marcado como pago
      if (foiMarcadoComoPago && selectedPlano) {
        const { error: pagamentoError } = await supabase
          .from("pagamentos")
          .insert([{
            valor: selectedPlano.valor,
            metodo_pagamento: formData.forma_pagamento === "antecipado" ? "dinheiro" : "dinheiro",
            descricao: `Pagamento de assinatura - ${formData.cliente_nome}`,
            tipo: "entrada"
          }]);

        if (pagamentoError) {
          console.error("Erro ao registrar pagamento:", pagamentoError);
          toast.error("Erro ao registrar pagamento no caixa");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["assinaturas"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{assinatura ? "Editar Assinatura" : "Nova Assinatura"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plano_id">Plano</Label>
            <Select
              value={formData.plano_id}
              onValueChange={(value) => setFormData({ ...formData, plano_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {planos?.filter(p => p.ativo).map((plano) => (
                  <SelectItem key={plano.id} value={plano.id}>
                    {plano.nome} - {plano.quantidade_cortes} cortes - R$ {Number(plano.valor || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente_nome">Nome do Cliente</Label>
              <Input
                id="cliente_nome"
                value={formData.cliente_nome}
                onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="cliente_telefone">Telefone</Label>
              <Input
                id="cliente_telefone"
                value={formData.cliente_telefone}
                onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="antecipado">Antecipado</SelectItem>
                  <SelectItem value="final_mes">Final do Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cortes_utilizados">Cortes Utilizados</Label>
              <Input
                id="cortes_utilizados"
                type="number"
                min="0"
                max={selectedPlano?.quantidade_cortes || 0}
                value={formData.cortes_utilizados}
                onChange={(e) => setFormData({ ...formData, cortes_utilizados: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pago"
              checked={formData.pago}
              onChange={(e) => setFormData({ ...formData, pago: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="pago">Pago</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
