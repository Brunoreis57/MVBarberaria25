import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PagamentoDialog = ({ open, onOpenChange }: PagamentoDialogProps) => {
  const [formData, setFormData] = useState({
    amount: "",
    method: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pagamento registrado com sucesso!");
    onOpenChange(false);
    setFormData({ amount: "", method: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Adicione um novo pagamento ao caixa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="method">Método de Pagamento</Label>
            <Select
              value={formData.method}
              onValueChange={(value) => setFormData({ ...formData, method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Ex: Corte - Cliente João"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PagamentoDialog;
