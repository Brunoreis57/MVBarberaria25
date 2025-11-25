import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Scissors, ArrowLeft, Clock, MessageCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useServicos } from "@/hooks/useServicos";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  telefone: z.string().min(10, "Telefone inválido").max(15),
  data: z.date({
    required_error: "Selecione uma data",
  }),
  horario: z.string({
    required_error: "Selecione um horário",
  }),
  servico: z.string({
    required_error: "Selecione um serviço",
  }),
  barbeiro: z.string({
    required_error: "Selecione um barbeiro",
  }),
});

const horarios = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
];

const AgendamentoPublico = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [datasBloqueadas, setDatasBloqueadas] = useState<Date[]>([]);
  const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>([]);
  const [agendamentoData, setAgendamentoData] = useState<{
    data: string;
    horario: string;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { data: servicos, isLoading: loadingServicos } = useServicos();
  const { data: barbeiros, isLoading: loadingBarbeiros } = useBarbeiros();

  useEffect(() => {
    const loadConfiguracoes = async () => {
      // Carregar WhatsApp
      const { data: whatsappData } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("chave", "whatsapp_barbearia")
        .single();
      
      if (whatsappData) {
        setWhatsappNumber(whatsappData.valor || "");
      }

      // Carregar datas bloqueadas
      const { data: datasData } = await supabase
        .from("configuracoes")
        .select("valor")
        .eq("chave", "datas_bloqueadas")
        .single();

      if (datasData?.valor) {
        const datas = JSON.parse(datasData.valor).map((d: string) => new Date(d));
        setDatasBloqueadas(datas);
      }

      // Carregar horários bloqueados
      const { data: horariosData } = await supabase
        .from("configuracoes")
        .select("valor")
        .eq("chave", "horarios_bloqueados")
        .single();

      if (horariosData?.valor) {
        setHorariosBloqueados(JSON.parse(horariosData.valor));
      }
    };
    loadConfiguracoes();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase
        .from("agendamentos")
        .insert({
          cliente_nome: values.nome,
          cliente_telefone: values.telefone,
          data: format(values.data, "yyyy-MM-dd"),
          hora: values.horario,
          servico_id: values.servico,
          barbeiro_id: values.barbeiro,
          status: "pendente"
        });

      if (error) throw error;

      setAgendamentoData({
        data: format(values.data, "dd/MM/yyyy", { locale: ptBR }),
        horario: values.horario
      });
      setShowConfirmDialog(true);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast({
        title: "Erro ao agendar",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    }
  };

  const handleWhatsappClick = () => {
    const message = `Olá! Fiz um agendamento para ${agendamentoData?.data} às ${agendamentoData?.horario}`;
    const url = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">MV Barbearia</span>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Agendar Horário
          </h1>
          <p className="text-muted-foreground">
            Escolha a data, horário e preencha seus dados
          </p>
          <Button 
            onClick={() => setShowPriceTable(true)} 
            variant="outline" 
            className="mt-4 gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Ver Tabela de Preços
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Novo Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingServicos && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">Carregando serviços...</div>
                          )}
                          {servicos?.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{s.nome}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({s.duracao_minutos ?? 30}min)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barbeiro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barbeiro</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o barbeiro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingBarbeiros && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">Carregando barbeiros...</div>
                          )}
                          {barbeiros?.filter((b: any) => b.ativo).map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setSelectedDate(date);
                            }}
                            disabled={(date) => {
                              // Desabilitar datas passadas
                              if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                              // Desabilitar datas bloqueadas
                              return datasBloqueadas.some(d => 
                                format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                              );
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o horário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {horarios
                            .filter(horario => !horariosBloqueados.includes(horario))
                            .map((horario) => (
                              <SelectItem key={horario} value={horario}>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {horario}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Confirmar Agendamento
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">✅ Agendamento Confirmado!</DialogTitle>
            <DialogDescription className="text-center pt-4 space-y-4">
              <p className="text-lg">
                Seu horário está confirmado para:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold text-foreground">
                  📅 {agendamentoData?.data}
                </p>
                <p className="font-semibold text-foreground">
                  🕐 {agendamentoData?.horario}
                </p>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Para qualquer dúvida ou cancelamento, entre em contato conosco pelo WhatsApp:
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {whatsappNumber && (
              <Button 
                onClick={handleWhatsappClick}
                className="w-full gap-2"
                size="lg"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmDialog(false);
                navigate("/");
              }}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPriceTable} onOpenChange={setShowPriceTable}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-center">💈 Tabela de Preços</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Confira nossos serviços e valores
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {loadingServicos ? (
              <p className="text-center text-muted-foreground text-sm">Carregando serviços...</p>
            ) : servicos && servicos.length > 0 ? (
              servicos.map((servico: any) => (
                <div 
                  key={servico.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{servico.nome}</h3>
                    <p className="text-xs text-muted-foreground">
                      Duração: {servico.duracao_minutos || 30}min
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm sm:text-base font-bold text-primary whitespace-nowrap">
                      R$ {Number(servico.preco).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">Nenhum serviço disponível</p>
            )}
          </div>
          <Button onClick={() => setShowPriceTable(false)} className="w-full">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendamentoPublico;
