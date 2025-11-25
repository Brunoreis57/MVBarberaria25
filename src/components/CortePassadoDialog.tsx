import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { useServicos } from "@/hooks/useServicos";
import { useQueryClient } from "@tanstack/react-query";

interface CortePassadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CortePassadoDialog({ open, onOpenChange }: CortePassadoDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: barbeiros } = useBarbeiros();
  const { data: servicos } = useServicos();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: "",
    servicoId: "",
    barbeiroId: "",
    dataAtendimento: "",
    formaPagamento: "dinheiro",
    desconto: 0,
    descontoTipo: "barbeiro" as "barbeiro" | "barbearia",
  });
  const [servicoSelecionado, setServicoSelecionado] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.servicoId || !formData.barbeiroId || !formData.dataAtendimento || !formData.formaPagamento) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar o serviço selecionado para obter o valor
      const { data: servico } = await supabase
        .from("servicos")
        .select("preco")
        .eq("id", formData.servicoId)
        .single();

      if (!servico) throw new Error("Serviço não encontrado");

      // Validar desconto
      if (formData.desconto > Number(servico.preco)) {
        toast({
          title: "Erro",
          description: "O desconto não pode ser maior que o valor do serviço.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Calcular valor final (preço - desconto)
      const valorFinal = Number(servico.preco) - formData.desconto;

      // Inserir atendimento com data específica e já marcado como pago
      const { error } = await supabase
        .from("atendimentos")
        .insert({
          cliente_nome: formData.clientName,
          servico_id: formData.servicoId,
          barbeiro_id: formData.barbeiroId,
          valor: valorFinal,
          pago: true,
          forma_pagamento: formData.formaPagamento,
          data_atendimento: formData.dataAtendimento,
          desconto_tipo: formData.desconto > 0 ? formData.descontoTipo : null,
        });

      if (error) throw error;

      const descontoMsg = formData.desconto > 0 
        ? ` (Desconto de R$ ${formData.desconto.toFixed(2)} aplicado - sai da ${formData.descontoTipo === 'barbeiro' ? 'comissão do barbeiro' : 'barbearia'})`
        : '';

      toast({
        title: "Corte registrado!",
        description: `Atendimento de ${formData.clientName} registrado com sucesso${descontoMsg}`,
      });

      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      setFormData({ 
        clientName: "", 
        servicoId: "", 
        barbeiroId: "",
        dataAtendimento: "",
        formaPagamento: "dinheiro",
        desconto: 0,
        descontoTipo: "barbeiro",
      });
      setServicoSelecionado(null);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar corte",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Corte Passado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nome do Cliente</Label>
            <Input
              id="clientName"
              placeholder="Digite o nome do cliente"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataAtendimento">Data do Atendimento</Label>
            <Input
              id="dataAtendimento"
              type="datetime-local"
              value={formData.dataAtendimento}
              onChange={(e) => setFormData({ ...formData, dataAtendimento: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barbeiro">Barbeiro</Label>
            <Select
              value={formData.barbeiroId}
              onValueChange={(value) => setFormData({ ...formData, barbeiroId: value })}
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
            <Label htmlFor="service">Tipo de Corte</Label>
            <Select
              value={formData.servicoId}
              onValueChange={(value) => {
                const servico = servicos?.find(s => s.id === value);
                setServicoSelecionado(servico);
                setFormData({ ...formData, servicoId: value, desconto: 0 });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de corte" />
              </SelectTrigger>
              <SelectContent>
                {servicos?.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.nome} - R$ {Number(servico.preco).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
            <Select
              value={formData.formaPagamento}
              onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credito">Cartão de Crédito</SelectItem>
                <SelectItem value="debito">Cartão de Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {servicoSelecionado && (
            <>
              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto (opcional)</Label>
                <Input
                  id="desconto"
                  type="number"
                  min="0"
                  max={Number(servicoSelecionado.preco)}
                  step="0.01"
                  placeholder="0.00"
                  value={formData.desconto || ""}
                  onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
                />
                {formData.desconto > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Valor final: R$ {(Number(servicoSelecionado.preco) - formData.desconto).toFixed(2)}
                  </p>
                )}
              </div>

              {formData.desconto > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="descontoTipo">Desconto sai de:</Label>
                  <Select
                    value={formData.descontoTipo}
                    onValueChange={(value: "barbeiro" | "barbearia") => 
                      setFormData({ ...formData, descontoTipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barbeiro">Comissão do Barbeiro</SelectItem>
                      <SelectItem value="barbearia">Barbearia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Corte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
