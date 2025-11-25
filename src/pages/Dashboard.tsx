import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Plus, Bell, CheckCircle, Trash2, Edit } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AtendimentoDialog } from "@/components/AtendimentoDialog";
import { MarcarPagoDialog } from "@/components/MarcarPagoDialog";
import { EditarAtendimentoDialog } from "@/components/EditarAtendimentoDialog";
import { Badge } from "@/components/ui/badge";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { startOfDay, endOfDay, subDays } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [atendimentoDialogOpen, setAtendimentoDialogOpen] = useState(false);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [editarDialogOpen, setEditarDialogOpen] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<any>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const { data: atendimentos } = useAtendimentos();
  const { data: agendamentos } = useAgendamentos();
  const [stats, setStats] = useState<any[]>([]);

  // Auto-atualização em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'atendimentos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    const calculateStats = async () => {
      const start = startOfDay(new Date());
      const end = endOfDay(new Date());
      const todayStr = start.toISOString().split('T')[0];
      
      if (user?.role === "admin") {
        // Atendimentos pagos do dia
        const todayAtendimentosPaid = atendimentos?.filter(
          (a: any) => a.pago && a.data_atendimento && new Date(a.data_atendimento) >= start && new Date(a.data_atendimento) <= end
        ) || [];
        
        const todayAgendamentos = agendamentos?.filter(
          (a: any) => a.data === todayStr
        ) || [];
        
        const totalReceita = todayAtendimentosPaid
          .reduce((sum: number, a: any) => sum + Number(a.valor || 0), 0);
        
        setStats([
          {
            title: "Agendamentos Hoje",
            value: todayAgendamentos.length.toString(),
            icon: Calendar,
            description: `${todayAtendimentosPaid.length} atendidos`,
          },
          {
            title: "Receita do Dia",
            value: `R$ ${totalReceita.toFixed(2)}`,
            icon: DollarSign,
            description: "Total em atendimentos pagos",
          },
          {
            title: "Clientes Atendidos",
            value: todayAtendimentosPaid.length.toString(),
            icon: Users,
            description: `${todayAgendamentos.length - todayAtendimentosPaid.length} agendamentos restantes`,
          },
        ]);
      } else {
        // Stats do barbeiro - buscar porcentagem de comissão
        const { data: barbeiroData } = await supabase
          .from("barbeiros")
          .select("porcentagem_comissao")
          .eq("user_id", user.id)
          .single();

        const comissaoPercentual = (barbeiroData?.porcentagem_comissao || 50) / 100;
        
        const myAtendimentosPaid = atendimentos?.filter(
          (a: any) => a.pago && a.data_atendimento && new Date(a.data_atendimento) >= start && new Date(a.data_atendimento) <= end
        ) || [];
        
        const myAgendamentos = agendamentos?.filter(
          (a: any) => a.data === todayStr
        ) || [];
        
        const totalGanhos = myAtendimentosPaid
          .reduce((sum: number, a: any) => sum + (Number(a.valor || 0) * comissaoPercentual), 0);
        
        setStats([
          {
            title: "Meus Agendamentos Hoje",
            value: myAgendamentos.length.toString(),
            icon: Calendar,
            description: `${myAtendimentosPaid.length} concluídos, ${myAgendamentos.length - myAtendimentosPaid.length} pendentes`,
          },
          {
            title: "Meus Ganhos do Dia",
            value: `R$ ${totalGanhos.toFixed(2)}`,
            icon: DollarSign,
            description: "Total em atendimentos pagos",
          },
          {
            title: "Clientes Atendidos",
            value: myAtendimentosPaid.length.toString(),
            icon: Users,
            description: "Hoje",
          },
        ]);
      }
    };

    if (user && atendimentos && agendamentos) {
      calculateStats();
    }
  }, [user, atendimentos, agendamentos]);

  // Pegar os últimos serviços (atendimentos pagos)
  const allRecentData = atendimentos
    ?.filter((a: any) => a.pago)
    .map((a: any) => ({
      id: a.id,
      client: a.cliente_nome,
      time: new Date(a.data_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      barber: a.barbeiros?.nome || "Não definido",
      service: a.servicos?.nome || "Serviço",
      value: formatBRL(Number(a.valor || 0)),
      paymentMethod: a.forma_pagamento,
      data_atendimento: a.data_atendimento,
      dateStr: new Date(a.data_atendimento).toLocaleDateString('pt-BR'),
      forma_pagamento: a.forma_pagamento,
      cliente_nome: a.cliente_nome,
    }));

  const recentData = showAllServices ? allRecentData : allRecentData?.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Olá, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.role === "admin" ? "Visão geral da barbearia" : "Seus resultados"}
            </p>
          </div>
          <Button onClick={() => setAtendimentoDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Atendimento
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
         </div>

         {/* Agendamentos Marcados */}
         {agendamentos && agendamentos.length > 0 && (
           <Card>
             <CardHeader>
               <CardTitle>Agendamentos Marcados</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {agendamentos.slice(0, 5).map((agendamento: any) => (
                   <div
                     key={agendamento.id}
                     className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                   >
                     <div className="flex-1">
                       <p className="font-semibold text-foreground">{agendamento.cliente_nome}</p>
                       <p className="text-sm text-muted-foreground">
                         {new Date(agendamento.data + "T00:00:00").toLocaleDateString("pt-BR")} às {agendamento.hora?.slice(0, 5)}
                       </p>
                       {agendamento.barbeiros && (
                         <p className="text-xs text-muted-foreground">
                           Barbeiro: {agendamento.barbeiros.nome}
                         </p>
                       )}
                     </div>
                     <Badge className={
                       agendamento.status === 'confirmado' ? 'bg-blue-100 text-blue-700' :
                       agendamento.status === 'concluido' ? 'bg-green-100 text-green-700' :
                       agendamento.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                       'bg-gray-100 text-gray-700'
                     }>
                       {agendamento.status === 'confirmado' ? 'Confirmado' :
                        agendamento.status === 'concluido' ? 'Concluído' :
                        agendamento.status === 'cancelado' ? 'Cancelado' :
                        'Pendente'}
                     </Badge>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         )}

         {/* Atendimentos não pagos */}
         {atendimentos && atendimentos.filter((a: any) => !a.pago).length > 0 && (
           <Card>
             <CardHeader>
               <CardTitle>Atendimentos Não Pagos</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {atendimentos.filter((a: any) => !a.pago).slice(0, 5).map((atendimento: any) => (
                   <div
                     key={atendimento.id}
                     className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                   >
                     <div>
                       <p className="font-semibold text-foreground">{atendimento.cliente_nome}</p>
                       <p className="text-sm text-muted-foreground">
                         {atendimento.servicos?.nome} - R$ {Number(atendimento.valor || 0).toFixed(2)}
                       </p>
                     </div>
                     <Button
                       size="sm"
                       onClick={() => {
                         setSelectedAtendimento(atendimento);
                         setPagoDialogOpen(true);
                       }}
                       className="gap-2"
                     >
                       <CheckCircle className="w-4 h-4" />
                       Marcar como Pago
                     </Button>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimos Serviços</CardTitle>
              {allRecentData && allRecentData.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllServices(!showAllServices)}
                >
                  {showAllServices ? "Ver Menos" : `Ver Mais (${allRecentData.length - 5})`}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentData && recentData.length > 0 ? (
                (() => {
                  const todayStr = new Date().toLocaleDateString('pt-BR');
                  const yesterdayStr = subDays(new Date(), 1).toLocaleDateString('pt-BR');
                  const grouped = recentData.reduce((acc: Record<string, any[]>, s: any) => {
                    acc[s.dateStr] = acc[s.dateStr] || [];
                    acc[s.dateStr].push(s);
                    return acc;
                  }, {});
                  return Object.entries(grouped).map(([date, items]) => (
                    <div key={date} className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground px-1">{date === todayStr ? 'Hoje' : date === yesterdayStr ? 'Ontem' : date}</div>
                      {items.map((service: any) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{service.client}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.service} - {service.paymentMethod}
                              </p>
                              {user?.role === "admin" && (
                                <p className="text-xs text-muted-foreground">Barbeiro: {service.barber}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium text-foreground">{service.value}</p>
                              <p className="text-xs text-muted-foreground">{service.time}</p>
                            </div>
                            {user?.role === "admin" && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-primary/10"
                                  onClick={() => {
                                    setSelectedAtendimento(service);
                                    setEditarDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={async () => {
                                    if (confirm(`Deseja excluir o atendimento de ${service.client}?`)) {
                                      const { error } = await supabase
                                        .from("atendimentos")
                                        .delete()
                                        .eq("id", service.id);
                                      if (error) {
                                        toast({
                                          title: "Erro ao excluir",
                                          description: error.message,
                                          variant: "destructive",
                                        });
                                      } else {
                                        toast({
                                          title: "Atendimento excluído",
                                          description: "O valor foi removido da receita automaticamente",
                                        });
                                        queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
                                        queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum serviço pago ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notificações mantidas como exemplo, podem ser conectadas ao backend depois */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notificações Recentes</CardTitle>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              
            </div>
          </CardContent>
        </Card>
      </div>

      <AtendimentoDialog 
        open={atendimentoDialogOpen} 
        onOpenChange={setAtendimentoDialogOpen}
      />
      
      {selectedAtendimento && (
        <>
          <MarcarPagoDialog
            open={pagoDialogOpen}
            onOpenChange={setPagoDialogOpen}
            atendimento={selectedAtendimento}
          />
          <EditarAtendimentoDialog
            open={editarDialogOpen}
            onOpenChange={setEditarDialogOpen}
            atendimento={selectedAtendimento}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
