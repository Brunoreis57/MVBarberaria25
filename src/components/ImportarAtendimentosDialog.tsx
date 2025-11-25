import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportarAtendimentosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportarAtendimentosDialog = ({ open, onOpenChange }: ImportarAtendimentosDialogProps) => {
  const [textData, setTextData] = useState("");
  const { toast } = useToast();

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

  const handleImport = () => {
    if (!textData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, adicione os dados para importar",
        variant: "destructive",
      });
      return;
    }

    // Aqui você processaria os dados importados
    console.log("Dados importados:", textData);
    
    toast({
      title: "Sucesso!",
      description: "Atendimentos importados com sucesso",
    });
    
    setTextData("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Atendimentos</DialogTitle>
          <DialogDescription>
            Importe dados históricos de atendimentos via arquivo CSV ou cole os dados diretamente.
            <br />
            <span className="text-xs mt-2 block font-semibold">
              Formato esperado: Data, Tipo de Corte, Valor, Tipo Pagamento, Nome do Cliente, Telefone, Barbeiro
            </span>
            <span className="text-xs mt-1 block text-muted-foreground">
              Separe os campos por vírgula (uma linha por atendimento)
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
              placeholder="Cole aqui os dados dos atendimentos...&#10;Exemplo:&#10;2025-08-15,Corte Simples,35.00,Dinheiro,João Silva,(11) 98765-4321,Carlos&#10;2025-08-15,Barba,25.00,Pix,Maria Santos,(11) 91234-5678,Marco"
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} className="gap-2">
              <FileText className="w-4 h-4" />
              Importar Atendimentos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarAtendimentosDialog;
