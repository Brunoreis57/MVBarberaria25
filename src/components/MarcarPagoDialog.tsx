import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBarbeiros } from "@/hooks/useBarbeiros";

interface MarcarPagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atendimento: any;
}

export function MarcarPagoDialog({ open, onOpenChange, atendimento }: MarcarPagoDialogProps) {
  const queryClient = useQueryClient();
  const { data: barbeiros } = useBarbeiros();
  const [formaPagamento, setFormaPagamento] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formaPagamento) {
      toast.error("Selecione a forma de pagamento");
      return;
    }

    if (formaPagamento === "mv-funcionarios" && !funcionarioId) {
      toast.error("Selecione o funcionário");
      return;
    }

    setLoading(true);

    try {
      // Preparar descrição com observação se houver
      let descricao = `Atendimento de ${atendimento.cliente_nome} - ${atendimento.servicos?.nome || 'Serviço'}`;
      if (formaPagamento === "mv-funcionarios") {
        const funcionario = barbeiros?.find(b => b.id === funcionarioId);
        descricao += ` - MV Funcionário: ${funcionario?.nome || ''}`;
        if (observacao) {
          descricao += ` - Obs: ${observacao}`;
        }
      }

      // Atualizar atendimento para marcar como pago
      const { error: atendimentoError } = await supabase
        .from("atendimentos")
        .update({ 
          pago: true,
          forma_pagamento: formaPagamento
        })
        .eq("id", atendimento.id);

      if (atendimentoError) throw atendimentoError;

      // Criar registro na tabela de pagamentos (receita) com referência ao atendimento
      const { error: pagamentoError } = await supabase
        .from("pagamentos")
        .insert({
          tipo: "entrada",
          valor: atendimento.valor,
          metodo_pagamento: formaPagamento,
          descricao: descricao,
          atendimento_id: atendimento.id,
        });

      if (pagamentoError) throw pagamentoError;

      toast.success("Atendimento marcado como pago!");
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      onOpenChange(false);
      setFormaPagamento("");
      setFuncionarioId("");
      setObservacao("");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao marcar como pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Marcar como Pago</DialogTitle>
          <DialogDescription>
            Cliente: {atendimento?.cliente_nome}
            <br />
            Valor: R$ {Number(atendimento?.valor || 0).toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
            <Select
              value={formaPagamento}
              onValueChange={setFormaPagamento}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                <SelectItem value="mv-funcionarios">MV Funcionários</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formaPagamento === "mv-funcionarios" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="funcionario">Funcionário</Label>
                <Select
                  value={funcionarioId}
                  onValueChange={setFuncionarioId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
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
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Textarea
                  id="observacao"
                  placeholder="Digite alguma observação"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
