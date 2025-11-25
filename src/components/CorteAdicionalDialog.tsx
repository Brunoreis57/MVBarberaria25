import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { useServicos } from "@/hooks/useServicos";

interface CorteAdicionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioNome: string;
}

export const CorteAdicionalDialog = ({
  open,
  onOpenChange,
  funcionarioNome,
}: CorteAdicionalDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    barbeiro_id: "",
    servico_id: "",
    valor: "",
    data_atendimento: new Date().toISOString().slice(0, 16),
    observacao: "",
  });

  const { data: barbeiros } = useBarbeiros();
  const { data: servicos } = useServicos();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.barbeiro_id || !formData.servico_id || !formData.valor) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      // Registrar o atendimento adicional
      const { error } = await supabase.from("atendimentos").insert({
        cliente_nome: funcionarioNome,
        barbeiro_id: formData.barbeiro_id,
        servico_id: formData.servico_id,
        valor: parseFloat(formData.valor),
        data_atendimento: formData.data_atendimento,
        forma_pagamento: "mv-funcionarios",
        pago: false,
      });

      if (error) throw error;

      // Registrar pagamento pendente
      await supabase.from("pagamentos").insert({
        valor: parseFloat(formData.valor),
        metodo_pagamento: "mv-funcionarios",
        tipo: "entrada",
        descricao: `Corte adicional - ${funcionarioNome}${formData.observacao ? ` - ${formData.observacao}` : ""}`,
        data_pagamento: formData.data_atendimento,
      });

      toast.success("Corte adicional registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao registrar corte adicional:", error);
      toast.error("Erro ao registrar corte adicional");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Corte Extra - {funcionarioNome}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barbeiro">Barbeiro *</Label>
            <Select
              value={formData.barbeiro_id}
              onValueChange={(value) =>
                setFormData({ ...formData, barbeiro_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbeiros?.map((barbeiro) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Serviço *</Label>
            <Select
              value={formData.servico_id}
              onValueChange={(value) => {
                const servico = servicos?.find((s) => s.id === value);
                setFormData({
                  ...formData,
                  servico_id: value,
                  valor: servico?.preco?.toString() || "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {servicos?.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.nome} - R$ {Number(servico.preco || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) =>
                setFormData({ ...formData, valor: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data e Hora *</Label>
            <Input
              id="data"
              type="datetime-local"
              value={formData.data_atendimento}
              onChange={(e) =>
                setFormData({ ...formData, data_atendimento: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) =>
                setFormData({ ...formData, observacao: e.target.value })
              }
              placeholder="Observações sobre este corte adicional..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Registrar Corte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
