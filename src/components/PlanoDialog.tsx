import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PlanoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano?: any;
}

export const PlanoDialog = ({ open, onOpenChange, plano }: PlanoDialogProps) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: plano?.nome || "",
    quantidade_cortes: plano?.quantidade_cortes || 4,
    valor: plano?.valor || "",
    descricao: plano?.descricao || "",
    ativo: plano?.ativo ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (plano) {
        const { error } = await supabase
          .from("planos")
          .update(formData)
          .eq("id", plano.id);

        if (error) throw error;
        toast.success("Plano atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("planos")
          .insert([formData]);

        if (error) throw error;
        toast.success("Plano criado com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["planos"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plano ? "Editar Plano" : "Novo Plano"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Plano</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="quantidade_cortes">Quantidade de Cortes</Label>
            <Input
              id="quantidade_cortes"
              type="number"
              min="1"
              value={formData.quantidade_cortes}
              onChange={(e) => setFormData({ ...formData, quantidade_cortes: parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              min="0"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="ativo">Plano Ativo</Label>
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
