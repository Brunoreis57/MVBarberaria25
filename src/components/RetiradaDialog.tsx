import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { formatBRL } from "@/lib/utils";

interface RetiradaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RetiradaDialog = ({ open, onOpenChange }: RetiradaDialogProps) => {
  const queryClient = useQueryClient();
  const { data: barbeiros } = useBarbeiros();
  const [formData, setFormData] = useState({
    amount: "",
    person: "",
    reason: "",
    barbeiro_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Salvar retirada
      const { error: retiradaError } = await supabase.from("retiradas").insert({
        valor: parseFloat(formData.amount),
        pessoa: formData.person,
        motivo: formData.reason,
        barbeiro_id: formData.barbeiro_id || null,
      });

      if (retiradaError) throw retiradaError;

      // Criar notificação para todos os usuários autenticados
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profiles } = await supabase.from("profiles").select("id");
        
        if (profiles) {
          const notificacoes = profiles.map(profile => ({
            user_id: profile.id,
            tipo: "retirada",
            titulo: "Retirada de Dinheiro",
            descricao: `${formData.person} retirou ${formatBRL(formData.amount)} do caixa - Motivo: ${formData.reason}`,
          }));

          await supabase.from("notificacoes").insert(notificacoes);
        }
      }

      toast.success("Retirada registrada! Notificação enviada.");
      onOpenChange(false);
      setFormData({ amount: "", person: "", reason: "", barbeiro_id: "" });
      queryClient.invalidateQueries({ queryKey: ["retiradas"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar retirada");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Retirada</DialogTitle>
          <DialogDescription>
            Registre uma retirada de dinheiro do caixa. Uma notificação será enviada.
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
            <Label htmlFor="barbeiro">Barbeiro (opcional)</Label>
            <Select
              value={formData.barbeiro_id}
              onValueChange={(value) => {
                const barbeiro = barbeiros?.find(b => b.id === value);
                setFormData({ 
                  ...formData, 
                  barbeiro_id: value,
                  person: barbeiro ? barbeiro.nome : formData.person
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um barbeiro" />
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
            <Label htmlFor="person">Quem está retirando</Label>
            <Input
              id="person"
              placeholder="Ex: Carlos (Barbeiro)"
              value={formData.person}
              onChange={(e) => setFormData({ ...formData, person: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Retirada</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da retirada"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Registrar Retirada
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RetiradaDialog;
