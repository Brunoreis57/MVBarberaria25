import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GerenciarDisponibilidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const horarios = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
];

export function GerenciarDisponibilidadeDialog({ open, onOpenChange }: GerenciarDisponibilidadeDialogProps) {
  const [datasBloqueadas, setDatasBloqueadas] = useState<Date[]>([]);
  const [horariosBloqueados, setHorariosBloqueados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadConfiguracoes();
    }
  }, [open]);

  const loadConfiguracoes = async () => {
    try {
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
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Salvar datas bloqueadas
      const datasFormatadas = datasBloqueadas.map(d => format(d, "yyyy-MM-dd"));
      
      const { error: datasError } = await supabase
        .from("configuracoes")
        .upsert({
          chave: "datas_bloqueadas",
          valor: JSON.stringify(datasFormatadas),
        }, { onConflict: "chave" });

      if (datasError) throw datasError;

      // Salvar horários bloqueados
      const { error: horariosError } = await supabase
        .from("configuracoes")
        .upsert({
          chave: "horarios_bloqueados",
          valor: JSON.stringify(horariosBloqueados),
        }, { onConflict: "chave" });

      if (horariosError) throw horariosError;

      toast.success("Disponibilidade atualizada com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  const toggleHorario = (horario: string) => {
    if (horariosBloqueados.includes(horario)) {
      setHorariosBloqueados(horariosBloqueados.filter(h => h !== horario));
    } else {
      setHorariosBloqueados([...horariosBloqueados, horario]);
    }
  };

  const isDataBloqueada = (date: Date) => {
    return datasBloqueadas.some(d => 
      format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
  };

  const toggleData = (date: Date | undefined) => {
    if (!date) return;
    
    if (isDataBloqueada(date)) {
      setDatasBloqueadas(datasBloqueadas.filter(d => 
        format(d, "yyyy-MM-dd") !== format(date, "yyyy-MM-dd")
      ));
    } else {
      setDatasBloqueadas([...datasBloqueadas, date]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Disponibilidade</DialogTitle>
          <DialogDescription>
            Bloqueie datas e horários que não estarão disponíveis para agendamento
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="horarios" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="horarios">Horários</TabsTrigger>
            <TabsTrigger value="datas">Datas</TabsTrigger>
          </TabsList>

          <TabsContent value="horarios" className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione os horários que deseja bloquear:</Label>
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-2">
                {horarios.map((horario) => (
                  <div key={horario} className="flex items-center space-x-2">
                    <Checkbox
                      id={horario}
                      checked={horariosBloqueados.includes(horario)}
                      onCheckedChange={() => toggleHorario(horario)}
                    />
                    <label
                      htmlFor={horario}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {horario}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="datas" className="space-y-4">
            <div className="space-y-2">
              <Label>Clique nas datas para bloquear/desbloquear:</Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={undefined}
                  onSelect={toggleData}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  modifiers={{
                    bloqueada: datasBloqueadas
                  }}
                  modifiersStyles={{
                    bloqueada: { 
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'hsl(var(--destructive-foreground))',
                      fontWeight: 'bold'
                    }
                  }}
                  className="pointer-events-auto rounded-md border"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Datas em vermelho estão bloqueadas
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
