import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL } from "@/lib/utils";

interface VendaProdutoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: any;
}

export default function VendaProdutoDialog({ open, onOpenChange, produto }: VendaProdutoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: barbeiros } = useBarbeiros();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    quantidade: 1,
    forma_pagamento: "dinheiro",
    barbeiro_id: "",
  });

  useEffect(() => {
    if (open && produto) {
      setFormData({
        quantidade: 1,
        forma_pagamento: "dinheiro",
        barbeiro_id: "",
      });
    }
  }, [open, produto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!produto) {
        throw new Error("Produto não selecionado");
      }

      if (formData.quantidade <= 0) {
        throw new Error("Quantidade deve ser maior que zero");
      }

      if (formData.quantidade > produto.estoque_atual) {
        throw new Error("Quantidade maior que o estoque disponível");
      }

      const valor_unitario = produto.preco_venda;
      const valor_total = valor_unitario * formData.quantidade;
      const porcentagem_comissao = produto.porcentagem_comissao || 0;
      const valor_comissao = formData.barbeiro_id ? (valor_total * porcentagem_comissao) / 100 : 0;

      // Inserir venda
      const { error: vendaError } = await supabase.from("vendas_produtos").insert({
        produto_id: produto.id,
        barbeiro_id: formData.barbeiro_id || null,
        quantidade: formData.quantidade,
        valor_unitario,
        valor_total,
        valor_comissao,
        forma_pagamento: formData.forma_pagamento,
      });

      if (vendaError) throw vendaError;

      // Atualizar estoque
      const { error: estoqueError } = await supabase
        .from("produtos")
        .update({
          estoque_atual: produto.estoque_atual - formData.quantidade,
        })
        .eq("id", produto.id);

      if (estoqueError) throw estoqueError;

      toast({
        title: "Venda registrada!",
        description: "A venda foi registrada com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["vendas_produtos"] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar venda",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const valor_total = produto ? produto.preco_venda * formData.quantidade : 0;
  const valor_comissao = produto && formData.barbeiro_id 
    ? (valor_total * (produto.porcentagem_comissao || 0)) / 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vender Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Produto</Label>
            <Input value={produto?.nome || ""} disabled />
          </div>

          <div>
            <Label>Preço Unitário</Label>
            <Input 
              value={produto ? formatBRL(produto.preco_venda) : ""} 
              disabled 
            />
          </div>

          <div>
            <Label>Estoque Disponível</Label>
            <Input value={produto?.estoque_atual || 0} disabled />
          </div>

          <div>
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              max={produto?.estoque_atual || 1}
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div>
            <Label>Valor Total</Label>
            <Input value={formatBRL(valor_total)} disabled />
          </div>

          <div>
            <Label htmlFor="barbeiro_id">Barbeiro (opcional)</Label>
            <Select
              value={formData.barbeiro_id}
              onValueChange={(value) => setFormData({ ...formData, barbeiro_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum (venda direta)</SelectItem>
                {barbeiros?.map((barbeiro) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.barbeiro_id && (
            <div>
              <Label>Comissão do Barbeiro ({produto?.porcentagem_comissao || 0}%)</Label>
              <Input value={formatBRL(valor_comissao)} disabled />
            </div>
          )}

          <div>
            <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
            <Select
              value={formData.forma_pagamento}
              onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="credito">Crédito</SelectItem>
                <SelectItem value="debito">Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processando..." : "Registrar Venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
