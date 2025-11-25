import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Package, Users } from "lucide-react";
import { usePlanos } from "@/hooks/usePlanos";
import { useAssinaturas } from "@/hooks/useAssinaturas";
import { PlanoDialog } from "@/components/PlanoDialog";
import { AssinaturaDialog } from "@/components/AssinaturaDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { formatBRL } from "@/lib/utils";

const Planos = () => {
  const { data: planos, isLoading: loadingPlanos } = usePlanos();
  const { data: assinaturas, isLoading: loadingAssinaturas } = useAssinaturas();
  const queryClient = useQueryClient();

  const [planoDialogOpen, setPlanoDialogOpen] = useState(false);
  const [assinaturaDialogOpen, setAssinaturaDialogOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<any>(null);
  const [selectedAssinatura, setSelectedAssinatura] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'plano' | 'assinatura', id: string } | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("planos-assinaturas-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "planos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["planos"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "assinaturas_planos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["assinaturas"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleEditPlano = (plano: any) => {
    setSelectedPlano(plano);
    setPlanoDialogOpen(true);
  };

  const handleEditAssinatura = (assinatura: any) => {
    setSelectedAssinatura(assinatura);
    setAssinaturaDialogOpen(true);
  };

  const handleDeletePlano = async () => {
    if (!itemToDelete || itemToDelete.type !== 'plano') return;

    try {
      const { error } = await supabase
        .from("planos")
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;
      toast.success("Plano excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["planos"] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteAssinatura = async () => {
    if (!itemToDelete || itemToDelete.type !== 'assinatura') return;

    try {
      const { error } = await supabase
        .from("assinaturas_planos")
        .delete()
        .eq("id", itemToDelete.id);

      if (error) throw error;
      toast.success("Assinatura excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["assinaturas"] });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const confirmDelete = () => {
    if (itemToDelete?.type === 'plano') {
      handleDeletePlano();
    } else {
      handleDeleteAssinatura();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Planos e Assinaturas</h1>
        </div>

        <Tabs defaultValue="planos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="planos">
              <Package className="h-4 w-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="assinaturas">
              <Users className="h-4 w-4 mr-2" />
              Assinaturas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planos" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setSelectedPlano(null);
                  setPlanoDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Planos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPlanos ? (
                  <p>Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cortes</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planos?.map((plano) => (
                        <TableRow key={plano.id}>
                          <TableCell className="font-medium">{plano.nome}</TableCell>
                          <TableCell>{plano.quantidade_cortes}</TableCell>
                          <TableCell>{formatBRL(plano.valor)}</TableCell>
                          <TableCell>
                            <Badge variant={plano.ativo ? "default" : "secondary"}>
                              {plano.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>{plano.descricao || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPlano(plano)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemToDelete({ type: 'plano', id: plano.id });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assinaturas" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setSelectedAssinatura(null);
                  setAssinaturaDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Assinatura
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Assinaturas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAssinaturas ? (
                  <p>Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Cortes</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Forma Pgto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assinaturas?.map((assinatura) => (
                        <TableRow key={assinatura.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{assinatura.cliente_nome}</p>
                              <p className="text-sm text-muted-foreground">{assinatura.cliente_telefone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{assinatura.planos?.nome}</TableCell>
                          <TableCell>
                            {assinatura.cortes_utilizados}/{assinatura.cortes_totais}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(assinatura.data_inicio + 'T00:00:00'), "dd/MM/yyyy")}</p>
                              <p className="text-muted-foreground">
                                até {format(new Date(assinatura.data_fim + 'T00:00:00'), "dd/MM/yyyy")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {assinatura.forma_pagamento === "antecipado" ? "Antecipado" : "Final do Mês"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={assinatura.pago ? "default" : "secondary"}>
                              {assinatura.pago ? "Pago" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAssinatura(assinatura)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemToDelete({ type: 'assinatura', id: assinatura.id });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PlanoDialog
        open={planoDialogOpen}
        onOpenChange={(open) => {
          setPlanoDialogOpen(open);
          if (!open) setSelectedPlano(null);
        }}
        plano={selectedPlano}
      />

      <AssinaturaDialog
        open={assinaturaDialogOpen}
        onOpenChange={(open) => {
          setAssinaturaDialogOpen(open);
          if (!open) setSelectedAssinatura(null);
        }}
        assinatura={selectedAssinatura}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este{" "}
              {itemToDelete?.type === 'plano' ? "plano" : "assinatura"}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Planos;
