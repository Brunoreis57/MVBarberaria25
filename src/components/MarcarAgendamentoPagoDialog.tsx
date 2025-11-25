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

interface MarcarAgendamentoPagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: any;
}

export function MarcarAgendamentoPagoDialog({ open, onOpenChange, agendamento }: MarcarAgendamentoPagoDialogProps) {
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
      // Buscar informações do serviço para pegar o valor
      let valor = 0;
      if (agendamento.servico_id) {
        const { data: servicoData } = await supabase
          .from("servicos")
          .select("preco")
          .eq("id", agendamento.servico_id)
          .single();
        
        if (servicoData) {
          valor = Number(servicoData.preco);
        }
      }

      // Preparar descrição com observação se houver
      let descricao = `Agendamento de ${agendamento.cliente_nome}`;
      if (formaPagamento === "mv-funcionarios") {
        const funcionario = barbeiros?.find(b => b.id === funcionarioId);
        descricao += ` - MV Funcionário: ${funcionario?.nome || ''}`;
        if (observacao) {
          descricao += ` - Obs: ${observacao}`;
        }
      }

      // Criar registro em atendimentos
      const { data: atendimentoData, error: atendimentoError } = await supabase
        .from("atendimentos")
        .insert({
          cliente_nome: agendamento.cliente_nome,
          barbeiro_id: agendamento.barbeiro_id,
          servico_id: agendamento.servico_id,
          valor: valor,
          pago: true,
          forma_pagamento: formaPagamento,
          data_atendimento: new Date().toISOString(),
        })
        .select()
        .single();

      if (atendimentoError) throw atendimentoError;

      // Criar registro na tabela de pagamentos (receita)
      const { error: pagamentoError } = await supabase
        .from("pagamentos")
        .insert({
          tipo: "entrada",
          valor: valor,
          metodo_pagamento: formaPagamento,
          descricao: descricao,
          atendimento_id: atendimentoData.id,
        });

      if (pagamentoError) throw pagamentoError;

      // Atualizar status do agendamento para concluído
      const { error: updateError } = await supabase
        .from("agendamentos")
        .update({ status: "concluido" })
        .eq("id", agendamento.id);

      if (updateError) throw updateError;

      toast.success("Agendamento marcado como pago e movido para últimos serviços!");
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      onOpenChange(false);
      setFormaPagamento("");
      setFuncionarioId("");
      setObservacao("");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Marcar Agendamento como Pago</DialogTitle>
          <DialogDescription>
            Cliente: {agendamento?.cliente_nome}
            <br />
            Data: {agendamento?.data ? new Date(agendamento.data + "T00:00:00").toLocaleDateString("pt-BR") : ""}
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
