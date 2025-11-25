import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ImportarAgendamentosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportarAgendamentosDialog = ({ open, onOpenChange }: ImportarAgendamentosDialogProps) => {
  const [textData, setTextData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextData(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!textData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, adicione os dados para importar",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const lines = textData.trim().split('\n');
      const agendamentos = [];
      let errors = 0;

      for (const line of lines) {
        const [data, hora, cliente_nome, cliente_telefone, barbeiroNome, status] = line.split(',').map(s => s.trim());
        
        if (!data || !hora || !cliente_nome || !cliente_telefone) {
          errors++;
          continue;
        }

        // Buscar barbeiro_id pelo nome
        let barbeiro_id = null;
        if (barbeiroNome) {
          const { data: barbeiro } = await supabase
            .from('barbeiros')
            .select('id')
            .ilike('nome', barbeiroNome)
            .single();
          
          barbeiro_id = barbeiro?.id || null;
        }

        agendamentos.push({
          data,
          hora,
          cliente_nome,
          cliente_telefone,
          barbeiro_id,
          status: status || 'pendente'
        });
      }

      if (agendamentos.length > 0) {
        const { error } = await supabase
          .from('agendamentos')
          .insert(agendamentos);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
        
        toast({
          title: "Sucesso!",
          description: `${agendamentos.length} agendamento(s) importado(s)${errors > 0 ? ` (${errors} linha(s) com erro)` : ''}`,
        });
        
        setTextData("");
        onOpenChange(false);
      } else {
        toast({
          title: "Erro",
          description: "Nenhum agendamento válido foi encontrado",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar agendamentos: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Agendamentos</DialogTitle>
          <DialogDescription>
            Importe dados históricos de agendamentos via arquivo CSV ou cole os dados diretamente.
            <br />
            <span className="text-xs mt-2 block font-semibold">
              Formato esperado: Data, Hora, Nome do Cliente, Telefone, Barbeiro, Status
            </span>
            <span className="text-xs mt-1 block text-muted-foreground">
              Separe os campos por vírgula (uma linha por agendamento)
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload" className="text-sm font-medium">
              Upload de Arquivo CSV
            </Label>
            <div className="mt-2">
              <input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="w-4 h-4" />
                Escolher Arquivo
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          <div>
            <Label htmlFor="text-data" className="text-sm font-medium">
              Colar Dados
            </Label>
            <Textarea
              id="text-data"
              placeholder="Cole aqui os dados dos agendamentos...&#10;Exemplo:&#10;2025-10-20,14:00,João Silva,(11) 98765-4321,Carlos,confirmado&#10;2025-10-20,15:00,Maria Santos,(11) 91234-5678,Marco,pendente"
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} className="gap-2" disabled={isImporting}>
              <FileText className="w-4 h-4" />
              {isImporting ? "Importando..." : "Importar Agendamentos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarAgendamentosDialog;
