import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar, DollarSign, Users, TrendingUp, Download, CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/utils";

const Relatorios = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("diario");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [stats, setStats] = useState({
    revenue: 0,
    appointments: 0,
    clients: 0,
    totalCommissions: 0,
  });
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Gera lista de últimos 12 meses
  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: i.toString(),
        label: format(date, "MMMM 'de' yyyy", { locale: ptBR })
      });
    }
    return options;
  };

  const getDateRange = () => {
    const baseDate = selectedPeriod === "mensal" 
      ? subMonths(new Date(), selectedMonthOffset)
      : selectedDate;
    
    switch (selectedPeriod) {
      case "semanal":
        return { start: startOfWeek(baseDate), end: endOfWeek(baseDate) };
      case "mensal":
        return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
      case "anual":
        return { start: startOfYear(baseDate), end: endOfYear(baseDate) };
      default:
        return { start: startOfDay(baseDate), end: endOfDay(baseDate) };
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const { start, end } = getDateRange();

      try {
        // Se for barbeiro, busca apenas seus dados
        if (user?.role === "barber") {
          const { data: barbeiroData } = await supabase
            .from("barbeiros")
            .select("id, porcentagem_comissao")
            .eq("user_id", user.id)
            .single();

          if (barbeiroData) {
            const { data: atendimentos } = await supabase
              .from("atendimentos")
              .select("valor, cliente_nome")
              .eq("barbeiro_id", barbeiroData.id)
              .eq("pago", true)
              .gte("data_atendimento", start.toISOString())
              .lte("data_atendimento", end.toISOString());

            const totalRevenue = atendimentos?.reduce((sum, a) => sum + Number(a.valor), 0) || 0;
            const uniqueClients = new Set(atendimentos?.map(a => a.cliente_nome)).size;
            const commission = (totalRevenue * ((barbeiroData.porcentagem_comissao || 50) / 100));

            setStats({
              revenue: totalRevenue,
              appointments: atendimentos?.length || 0,
              clients: uniqueClients,
              totalCommissions: commission,
            });
            setBarbers([{
              revenue: totalRevenue,
              appointments: atendimentos?.length || 0,
              commission: commission,
            }]);
          }
        } else {
          // Se for admin, busca todos os dados
          const { data: atendimentos } = await supabase
            .from("atendimentos")
            .select(`
              valor,
              cliente_nome,
              barbeiro_id,
              barbeiros (
                nome,
                porcentagem_comissao
              )
            `)
            .eq("pago", true)
            .gte("data_atendimento", start.toISOString())
            .lte("data_atendimento", end.toISOString());

          const totalRevenue = atendimentos?.reduce((sum, a) => sum + Number(a.valor), 0) || 0;
          const uniqueClients = new Set(atendimentos?.map(a => a.cliente_nome)).size;

          // Agrupa por barbeiro
          const barberMap = new Map();
          atendimentos?.forEach((a: any) => {
            if (!a.barbeiro_id) return;
            
            const existing = barberMap.get(a.barbeiro_id) || {
              name: a.barbeiros?.nome || "Sem nome",
              revenue: 0,
              appointments: 0,
              commission: 0,
              percentage: a.barbeiros?.porcentagem_comissao || 50,
              retiradas: 0,
            };

            existing.revenue += Number(a.valor);
            existing.appointments += 1;
            barberMap.set(a.barbeiro_id, existing);
          });

          const barberStats = Array.from(barberMap.values()).map(b => ({
            ...b,
            commission: (b.revenue * (b.percentage / 100)),
          }));

          const totalCommissions = barberStats.reduce((sum, b) => sum + b.commission, 0);

          setStats({
            revenue: totalRevenue,
            appointments: atendimentos?.length || 0,
            clients: uniqueClients,
            totalCommissions,
          });

          setBarbers(barberStats);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadStats();
    }

    // Configurar listener de realtime para atualizar automaticamente
    const channel = supabase
      .channel("relatorios-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "atendimentos" },
        () => {
          loadStats();
        }
      )
      // Retiradas não afetam mais relatórios
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPeriod, selectedDate, selectedMonthOffset, user]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "semanal":
        return "da Semana";
      case "mensal":
        return "do Mês";
      case "anual":
        return "do Ano";
      default:
        return "do Dia";
    }
  };

  const formatCurrency = (value: number) => formatBRL(value);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('relatorios-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`relatorio-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {user?.role === "barber" ? "Meus Resultados" : "Relatórios"}
            </h2>
            <p className="text-muted-foreground">
              {user?.role === "barber" ? "Acompanhe seu desempenho" : "Análise detalhada de desempenho"}
            </p>
          </div>
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {selectedPeriod === "mensal" ? (
            <Select 
              value={selectedMonthOffset.toString()} 
              onValueChange={(value) => setSelectedMonthOffset(parseInt(value))}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div id="relatorios-content">
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diario">Diário</TabsTrigger>
            <TabsTrigger value="semanal">Semanal</TabsTrigger>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="anual">Anual</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedPeriod} className="space-y-6 mt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {user?.role === "admin" ? (
                    <>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Receita Total {getPeriodLabel()}</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.revenue)}</div>
                          <p className="text-xs text-muted-foreground">Total em atendimentos pagos</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Comissões Barbeiros</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalCommissions)}</div>
                          <p className="text-xs text-muted-foreground">Total de comissões pagas</p>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Minha Comissão {getPeriodLabel()}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalCommissions)}</div>
                        <p className="text-xs text-muted-foreground">Valor que você recebe</p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{stats.appointments}</div>
                      <p className="text-xs text-muted-foreground">Total de atendimentos pagos</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{stats.clients}</div>
                      <p className="text-xs text-muted-foreground">Clientes únicos atendidos</p>
                    </CardContent>
                  </Card>
                </div>

                {user?.role === "barber" ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Minha Comissão</CardTitle>
                      <CardDescription>Valor recebido {getPeriodLabel().toLowerCase()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {barbers.length > 0 ? (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total de atendimentos</p>
                              <p className="text-2xl font-bold text-foreground">{barbers[0].appointments}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Minha comissão</p>
                              <p className="text-2xl font-bold text-primary">{formatCurrency(barbers[0].commission)}</p>
                              
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Nenhum atendimento no período</p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Desempenho por Barbeiro</CardTitle>
                      <CardDescription>Estatísticas individuais {getPeriodLabel().toLowerCase()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {barbers.length > 0 ? (
                        <div className="space-y-4">
                          {barbers.map((barber, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Users className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{barber.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {barber.appointments} atendimentos
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-foreground">{formatCurrency(barber.revenue)}</p>
                                <p className="text-sm text-muted-foreground">
                                  Comissão: {formatCurrency(barber.commission)}
                                </p>
                                
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Nenhum atendimento no período</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
