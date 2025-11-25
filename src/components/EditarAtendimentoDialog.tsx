import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface EditarAtendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atendimento: any;
}

export function EditarAtendimentoDialog({ open, onOpenChange, atendimento }: EditarAtendimentoDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: "",
    dataAtendimento: "",
    formaPagamento: "dinheiro",
    desconto: "",
    descontoTipo: "valor" as "valor" | "percentual",
  });

  useEffect(() => {
    if (atendimento) {
      setFormData({
        clientName: atendimento.cliente_nome || "",
        dataAtendimento: atendimento.data_atendimento ? new Date(atendimento.data_atendimento).toISOString().slice(0, 16) : "",
        formaPagamento: atendimento.forma_pagamento || "dinheiro",
        desconto: atendimento.desconto_valor || "",
        descontoTipo: atendimento.desconto_tipo || "valor",
      });
    }
  }, [atendimento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.dataAtendimento || !formData.formaPagamento) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Calcular valor com desconto se houver
      let valorFinal = atendimento.valor;
      if (formData.desconto) {
        const desconto = Number(formData.desconto);
        if (formData.descontoTipo === "percentual") {
          valorFinal = atendimento.valor * (1 - desconto / 100);
        } else {
          valorFinal = atendimento.valor - desconto;
        }
      }

      const { error } = await supabase
        .from("atendimentos")
        .update({
          cliente_nome: formData.clientName,
          data_atendimento: formData.dataAtendimento,
          forma_pagamento: formData.formaPagamento,
          valor: valorFinal,
          desconto_tipo: formData.desconto ? formData.descontoTipo : null,
        })
        .eq("id", atendimento.id);

      if (error) throw error;

      toast({
        title: "Atendimento atualizado!",
        description: `Atendimento de ${formData.clientName} foi atualizado com sucesso`,
      });

      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar atendimento",
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
          <DialogTitle>Editar Atendimento</DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="desconto">Desconto</Label>
            <div className="flex gap-2">
              <Input
                id="desconto"
                type="number"
                placeholder="0"
                value={formData.desconto}
                onChange={(e) => setFormData({ ...formData, desconto: e.target.value })}
                min="0"
                step="0.01"
              />
              <Select
                value={formData.descontoTipo}
                onValueChange={(value: "valor" | "percentual") => 
                  setFormData({ ...formData, descontoTipo: value })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valor">R$ (Valor)</SelectItem>
                  <SelectItem value="percentual">% (Percentual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
