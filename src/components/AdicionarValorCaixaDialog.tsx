import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AdicionarValorCaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbeiros: any[];
}

export const AdicionarValorCaixaDialog = ({ open, onOpenChange, barbeiros }: AdicionarValorCaixaDialogProps) => {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"credito" | "debito">("credito");
  const [barbeiroId, setBarbeiroId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!valor || !descricao || !barbeiroId) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("ajustes_caixa_barbeiro")
        .insert({
          barbeiro_id: barbeiroId,
          valor: parseFloat(valor),
          descricao,
          tipo,
          criado_por: user?.id,
        });

      if (error) throw error;

      toast.success("Valor adicionado ao caixa com sucesso!");
      
      // Resetar formulário
      setValor("");
      setDescricao("");
      setTipo("credito");
      setBarbeiroId("");
      
      // Fechar dialog
      onOpenChange(false);
      
      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["ajustes_caixa"] });
    } catch (error: any) {
      console.error("Erro ao adicionar valor ao caixa:", error);
      toast.error("Erro ao adicionar valor: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Valor ao Caixa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barbeiro">Barbeiro</Label>
            <Select value={barbeiroId} onValueChange={setBarbeiroId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbeiros?.map((barbeiro: any) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(value: "credito" | "debito") => setTipo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credito">Crédito (Adicionar)</SelectItem>
                <SelectItem value="debito">Débito (Remover)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Motivo do ajuste..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
