import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, DollarSign, TrendingUp, Edit, Trash2, Upload, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProdutos } from "@/hooks/useProdutos";
import { useVendas } from "@/hooks/useVendas";
import { ProdutoDialog } from "@/components/ProdutoDialog";
import ImportarProdutosDialog from "@/components/ImportarProdutosDialog";
import VendaProdutoDialog from "@/components/VendaProdutoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Produtos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: produtos, isLoading } = useProdutos();
  const { data: vendas } = useVendas();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [vendaDialogOpen, setVendaDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<any>(null);
  const [produtoToVender, setProdutoToVender] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<any>(null);

  // Auto-atualização em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('produtos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["produtos"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendas_produtos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["vendas_produtos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleEdit = (produto: any) => {
    setSelectedProduto(produto);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduto(null);
    setDialogOpen(true);
  };

  const handleVenderClick = (produto: any) => {
    setProdutoToVender(produto);
    setVendaDialogOpen(true);
  };

  const handleDeleteClick = (produto: any) => {
    setProdutoToDelete(produto);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!produtoToDelete) return;

    try {
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: false })
        .eq("id", produtoToDelete.id);

      if (error) throw error;

      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso",
      });

      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProdutoToDelete(null);
    }
  };

  const totalEstoque = produtos?.reduce((acc, p) => acc + (p.estoque_atual || 0), 0) || 0;
  const valorTotal = produtos?.reduce((acc, p) => acc + ((p.preco_venda || 0) * (p.estoque_atual || 0)), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">Gerencie os produtos da barbearia</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importar Dados</span>
              <span className="sm:hidden">Importar</span>
            </Button>
            <Button className="gap-2" onClick={handleAddNew}>
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{produtos?.length || 0}</div>
              <p className="text-xs text-muted-foreground">produtos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEstoque}</div>
              <p className="text-xs text-muted-foreground">unidades em estoque</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBRL(valorTotal || 0)}</div>
              <p className="text-xs text-muted-foreground">valor total do estoque</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <p className="text-muted-foreground col-span-full text-center py-8">Carregando produtos...</p>
          ) : produtos && produtos.length > 0 ? (
            produtos.map((produto) => (
              <Card key={produto.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{produto.nome}</CardTitle>
                      <CardDescription>{produto.descricao}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(produto)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(produto)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Preço Venda</span>
                      <span className="font-bold text-lg">{formatBRL(produto.preco_venda || 0)}</span>
                    </div>
                    {produto.preco_custo && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Preço Custo</span>
                        <span className="text-sm">{formatBRL(produto.preco_custo || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estoque</span>
                      <Badge variant={(produto.estoque_atual || 0) > (produto.estoque_minimo || 0) ? "outline" : "destructive"}>
                        {produto.estoque_atual || 0} unidades
                      </Badge>
                    </div>
                    {produto.estoque_minimo && produto.estoque_minimo > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estoque Mínimo</span>
                        <span className="text-sm">{produto.estoque_minimo}</span>
                      </div>
                    )}
                    {produto.porcentagem_comissao > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Comissão</span>
                        <span className="text-sm">{produto.porcentagem_comissao}%</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4 gap-2" 
                    onClick={() => handleVenderClick(produto)}
                    disabled={produto.estoque_atual === 0}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Vender
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Nenhum produto cadastrado
            </p>
          )}
        </div>

        {vendas && vendas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Últimas Vendas</CardTitle>
              <CardDescription>Histórico recente de vendas de produtos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Barbeiro</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.slice(0, 10).map((venda: any) => (
                      <TableRow key={venda.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                          {' '}
                          {new Date(venda.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>{venda.produto?.nome || '-'}</TableCell>
                        <TableCell>{venda.quantidade}</TableCell>
                        <TableCell>{venda.barbeiro?.nome || 'Venda direta'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{venda.forma_pagamento}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatBRL(venda.valor_total || 0)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatBRL(venda.valor_comissao || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ProdutoDialog
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        produto={selectedProduto}
      />

      <VendaProdutoDialog
        open={vendaDialogOpen}
        onOpenChange={setVendaDialogOpen}
        produto={produtoToVender}
      />

      <ImportarProdutosDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{produtoToDelete?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Produtos;
