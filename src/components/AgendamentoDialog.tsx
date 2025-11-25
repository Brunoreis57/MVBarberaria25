import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { useServicos } from "@/hooks/useServicos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAgendamento?: any;
}

const AgendamentoDialog = ({ open, onOpenChange, editingAgendamento }: AgendamentoDialogProps) => {
  const queryClient = useQueryClient();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    barber: "",
    servico: "",
  });

  const horarios = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30",
  ];

  useEffect(() => {
    if (editingAgendamento) {
      setFormData({
        name: editingAgendamento.cliente_nome,
        phone: editingAgendamento.cliente_telefone,
        date: editingAgendamento.data,
        time: editingAgendamento.hora,
        barber: editingAgendamento.barbeiro_id || "",
        servico: editingAgendamento.servico_id || "",
      });
      // Parse da data para o calendário
      if (editingAgendamento.data) {
        const [year, month, day] = editingAgendamento.data.split('-');
        setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
      }
    } else {
      setFormData({
        name: "",
        phone: "",
        date: "",
        time: "",
        barber: "",
        servico: "",
      });
      setSelectedDate(undefined);
    }
  }, [editingAgendamento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAgendamento) {
        // Atualizar agendamento existente
        const { error } = await supabase
          .from("agendamentos")
          .update({
            cliente_nome: formData.name,
            cliente_telefone: formData.phone,
            data: formData.date,
            hora: formData.time,
            barbeiro_id: formData.barber || null,
            servico_id: formData.servico || null,
          })
          .eq("id", editingAgendamento.id);

        if (error) throw error;
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        // Salvar ou atualizar cliente
        const { data: existingClient } = await supabase
          .from("clientes")
          .select("id")
          .eq("telefone", formData.phone)
          .maybeSingle();

        if (existingClient) {
          // Atualizar nome do cliente se já existir
          await supabase
            .from("clientes")
            .update({ nome: formData.name })
            .eq("id", existingClient.id);
        } else {
          // Criar novo cliente
          await supabase.from("clientes").insert({
            nome: formData.name,
            telefone: formData.phone,
          });
        }

        // Criar novo agendamento
        const { error: agendamentoError } = await supabase.from("agendamentos").insert({
          cliente_nome: formData.name,
          cliente_telefone: formData.phone,
          data: formData.date,
          hora: formData.time,
          barbeiro_id: formData.barber || null,
          servico_id: formData.servico || null,
        });

        if (agendamentoError) throw agendamentoError;

        // Criar notificação apenas para novos agendamentos
        const { data: profiles } = await supabase.from("profiles").select("id");
        
        if (profiles) {
          const dataFormatada = format(new Date(formData.date), "dd/MM/yyyy", { locale: ptBR });
          const notificacoes = profiles.map(profile => ({
            user_id: profile.id,
            tipo: "agendamento",
            titulo: "Novo Agendamento",
            descricao: `${formData.name} agendou para ${dataFormatada} às ${formData.time}`,
          }));

          await supabase.from("notificacoes").insert(notificacoes);
        }

        toast.success("Agendamento criado com sucesso!");
      }
      onOpenChange(false);
      setFormData({ name: "", phone: "", date: "", time: "", barber: "", servico: "" });
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar agendamento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingAgendamento ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          <DialogDescription>
            {editingAgendamento 
              ? "Atualize os dados do agendamento abaixo" 
              : "Preencha os dados abaixo para criar um novo agendamento"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente</Label>
            <Input
              id="name"
              placeholder="João Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="(11) 98765-4321"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setFormData({ ...formData, date: format(date, "yyyy-MM-dd") });
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {horarios.map((horario) => (
                    <SelectItem key={horario} value={horario}>
                      {horario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="servico">Tipo de Corte</Label>
            <Select
              value={formData.servico}
              onValueChange={(value) => setFormData({ ...formData, servico: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de corte" />
              </SelectTrigger>
              <SelectContent>
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.nome} - R$ {Number(servico.preco || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barber">Barbeiro</Label>
            <Select
              value={formData.barber}
              onValueChange={(value) => setFormData({ ...formData, barber: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbeiros.map((barbeiro) => (
                  <SelectItem key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingAgendamento ? "Atualizar" : "Criar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgendamentoDialog;
