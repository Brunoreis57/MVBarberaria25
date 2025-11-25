import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ProdutoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto?: any;
}

export function ProdutoDialog({ open, onOpenChange, produto }: ProdutoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco_venda: "",
    preco_custo: "",
    estoque_atual: "",
    estoque_minimo: "",
    porcentagem_comissao: "",
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome || "",
        descricao: produto.descricao || "",
        preco_venda: produto.preco_venda?.toString() || "",
        preco_custo: produto.preco_custo?.toString() || "",
        estoque_atual: produto.estoque_atual?.toString() || "",
        estoque_minimo: produto.estoque_minimo?.toString() || "",
        porcentagem_comissao: produto.porcentagem_comissao?.toString() || "",
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        preco_venda: "",
        preco_custo: "",
        estoque_atual: "",
        estoque_minimo: "",
        porcentagem_comissao: "",
      });
    }
  }, [produto, open]);

  const handleSubmit = async () => {
    if (!formData.nome || !formData.preco_venda || !formData.estoque_atual) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const produtoData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim(),
        preco_venda: parseFloat(formData.preco_venda),
        preco_custo: formData.preco_custo ? parseFloat(formData.preco_custo) : null,
        estoque_atual: parseInt(formData.estoque_atual),
        estoque_minimo: formData.estoque_minimo ? parseInt(formData.estoque_minimo) : 0,
        porcentagem_comissao: formData.porcentagem_comissao ? parseFloat(formData.porcentagem_comissao) : 0,
        ativo: true,
      };

      if (produto) {
        // Atualizar
        const { error } = await supabase
          .from("produtos")
          .update(produtoData)
          .eq("id", produto.id);

        if (error) throw error;

        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso",
        });
      } else {
        // Criar
        const { error } = await supabase
          .from("produtos")
          .insert([produtoData]);

        if (error) throw error;

        toast({
          title: "Produto adicionado",
          description: "O produto foi adicionado com sucesso",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{produto ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
          <DialogDescription>
            Preencha as informações do produto
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Pomada Modeladora"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o produto"
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preco_venda">Preço Venda (R$) *</Label>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_venda}
                onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="preco_custo">Preço Custo (R$)</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_custo}
                onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estoque_atual">Estoque Atual *</Label>
              <Input
                id="estoque_atual"
                type="number"
                min="0"
                value={formData.estoque_atual}
                onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                min="0"
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="porcentagem_comissao">Comissão do Barbeiro (%)</Label>
            <Input
              id="porcentagem_comissao"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.porcentagem_comissao}
              onChange={(e) => setFormData({ ...formData, porcentagem_comissao: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : produto ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
