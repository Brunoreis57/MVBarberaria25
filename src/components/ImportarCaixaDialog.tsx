import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ImportarCaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportarCaixaDialog = ({ open, onOpenChange }: ImportarCaixaDialogProps) => {
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
      const pagamentos = [];
      const retiradas = [];
      let errors = 0;

      for (const line of lines) {
        const [data, tipo, valor, metodo, descricao] = line.split(',').map(s => s.trim());
        
        if (!data || !tipo || !valor || !metodo) {
          errors++;
          continue;
        }

        const valorNum = parseFloat(valor);
        if (isNaN(valorNum)) {
          errors++;
          continue;
        }

        if (tipo.toLowerCase() === 'entrada') {
          pagamentos.push({
            data_pagamento: data,
            tipo: 'entrada',
            valor: valorNum,
            metodo_pagamento: metodo,
            descricao: descricao || 'Importação manual'
          });
        } else if (tipo.toLowerCase() === 'saida') {
          retiradas.push({
            data_retirada: data,
            valor: valorNum,
            pessoa: 'Importação',
            motivo: descricao || 'Importação manual',
            aprovado: true
          });
        }
      }

      let totalImported = 0;

      if (pagamentos.length > 0) {
        const { error } = await supabase
          .from('pagamentos')
          .insert(pagamentos);
        
        if (error) throw error;
        totalImported += pagamentos.length;
      }

      if (retiradas.length > 0) {
        const { error } = await supabase
          .from('retiradas')
          .insert(retiradas);
        
        if (error) throw error;
        totalImported += retiradas.length;
      }

      if (totalImported > 0) {
        queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
        
        toast({
          title: "Sucesso!",
          description: `${totalImported} transação(ões) importada(s)${errors > 0 ? ` (${errors} linha(s) com erro)` : ''}`,
        });
        
        setTextData("");
        onOpenChange(false);
      } else {
        toast({
          title: "Erro",
          description: "Nenhuma transação válida foi encontrada",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar dados: " + error.message,
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
          <DialogTitle>Importar Dados do Caixa</DialogTitle>
          <DialogDescription>
            Importe dados históricos de pagamentos e retiradas via arquivo CSV ou cole os dados diretamente.
            <br />
            <span className="text-xs mt-2 block font-semibold">
              Formato esperado: Data, Tipo (entrada/saida), Valor, Método Pagamento, Descrição
            </span>
            <span className="text-xs mt-1 block text-muted-foreground">
              Separe os campos por vírgula (uma linha por transação)
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
              placeholder="Cole aqui os dados do caixa...&#10;Exemplo:&#10;2025-10-15,entrada,150.00,Pix,Pagamento de serviço&#10;2025-10-15,saida,50.00,Dinheiro,Retirada - Carlos"
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
              {isImporting ? "Importando..." : "Importar Dados"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarCaixaDialog;
