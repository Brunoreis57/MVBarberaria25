import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Phone, Plus, Upload, Pencil, Trash2, CheckCircle, Settings, History } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import AgendamentoDialog from "@/components/AgendamentoDialog";
import ImportarAgendamentosDialog from "@/components/ImportarAgendamentosDialog";
import { MarcarAgendamentoPagoDialog } from "@/components/MarcarAgendamentoPagoDialog";
import { GerenciarDisponibilidadeDialog } from "@/components/GerenciarDisponibilidadeDialog";
import { CortePassadoDialog } from "@/components/CortePassadoDialog";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

const Agendamentos = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [disponibilidadeOpen, setDisponibilidadeOpen] = useState(false);
  const [cortePassadoOpen, setCortePassadoOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pagandoAgendamento, setPagandoAgendamento] = useState<any>(null);
  const { data: agendamentos, isLoading } = useAgendamentos();

  const handleEdit = (agendamento: any) => {
    setEditingAgendamento(agendamento);
    setDialogOpen(true);
  };

  const handleMarcarPago = (agendamento: any) => {
    setPagandoAgendamento(agendamento);
    setPagoDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("agendamentos")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      toast.success("Agendamento excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir agendamento");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: "Pendente", className: "bg-gray-100 text-gray-700" },
      confirmado: { label: "Confirmado", className: "bg-blue-100 text-blue-700" },
      concluido: { label: "Concluído", className: "bg-green-100 text-green-700" },
      cancelado: { label: "Cancelado", className: "bg-red-100 text-red-700" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Agendamentos</h2>
            <p className="text-muted-foreground">Gerencie todos os agendamentos</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setCortePassadoOpen(true)} variant="outline" className="gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar Corte Passado</span>
              <span className="sm:hidden">Corte Passado</span>
            </Button>
            <Button onClick={() => setDisponibilidadeOpen(true)} variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Gerenciar Disponibilidade</span>
              <span className="sm:hidden">Disponibilidade</span>
            </Button>
            <Button onClick={() => setImportOpen(true)} variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importar Dados</span>
              <span className="sm:hidden">Importar</span>
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando agendamentos...</p>
          ) : agendamentos && agendamentos.length > 0 ? (
            agendamentos.map((appointment: any) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {appointment.cliente_nome}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {appointment.cliente_telefone}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(appointment.data + "T00:00:00").toLocaleDateString("pt-BR")}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {appointment.hora?.slice(0, 5)}
                        </div>
                        {appointment.barbeiros && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            Barbeiro: {appointment.barbeiros.nome}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(appointment.status || "pendente")}
                      <div className="flex gap-2">
                        {appointment.status !== "concluido" && appointment.status !== "cancelado" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarcarPago(appointment)}
                            className="gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Marcar como Pago
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(appointment)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(appointment.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhum agendamento encontrado
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AgendamentoDialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAgendamento(null);
        }}
        editingAgendamento={editingAgendamento}
      />
      <ImportarAgendamentosDialog open={importOpen} onOpenChange={setImportOpen} />
      <MarcarAgendamentoPagoDialog
        open={pagoDialogOpen}
        onOpenChange={(open) => {
          setPagoDialogOpen(open);
          if (!open) setPagandoAgendamento(null);
        }}
        agendamento={pagandoAgendamento}
      />
      <GerenciarDisponibilidadeDialog
        open={disponibilidadeOpen}
        onOpenChange={setDisponibilidadeOpen}
      />
      <CortePassadoDialog
        open={cortePassadoOpen}
        onOpenChange={setCortePassadoOpen}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Agendamentos;
