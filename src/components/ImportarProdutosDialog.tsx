import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ImportarProdutosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportarProdutosDialog = ({ open, onOpenChange }: ImportarProdutosDialogProps) => {
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
      const produtos = [];
      let errors = 0;

      for (const line of lines) {
        const [nome, descricao, precoVenda, precoCusto, estoqueAtual, estoqueMinimo] = line.split(',').map(s => s.trim());
        
        if (!nome || !precoVenda) {
          errors++;
          continue;
        }

        const precoVendaNum = parseFloat(precoVenda);
        const precoCustoNum = precoCusto ? parseFloat(precoCusto) : null;
        const estoqueAtualNum = estoqueAtual ? parseInt(estoqueAtual) : 0;
        const estoqueMinimoNum = estoqueMinimo ? parseInt(estoqueMinimo) : 0;

        if (isNaN(precoVendaNum)) {
          errors++;
          continue;
        }

        produtos.push({
          nome,
          descricao: descricao || null,
          preco_venda: precoVendaNum,
          preco_custo: precoCustoNum,
          estoque_atual: estoqueAtualNum,
          estoque_minimo: estoqueMinimoNum,
          ativo: true
        });
      }

      if (produtos.length > 0) {
        const { error } = await supabase
          .from('produtos')
          .insert(produtos);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ["produtos"] });
        
        toast({
          title: "Sucesso!",
          description: `${produtos.length} produto(s) importado(s)${errors > 0 ? ` (${errors} linha(s) com erro)` : ''}`,
        });
        
        setTextData("");
        onOpenChange(false);
      } else {
        toast({
          title: "Erro",
          description: "Nenhum produto válido foi encontrado",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar produtos: " + error.message,
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
          <DialogTitle>Importar Produtos</DialogTitle>
          <DialogDescription>
            Importe dados de produtos via arquivo CSV ou cole os dados diretamente.
            <br />
            <span className="text-xs mt-2 block font-semibold">
              Formato esperado: Nome, Descrição, Preço Venda, Preço Custo, Estoque Atual, Estoque Mínimo
            </span>
            <span className="text-xs mt-1 block text-muted-foreground">
              Separe os campos por vírgula (uma linha por produto)
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
              placeholder="Cole aqui os dados dos produtos...&#10;Exemplo:&#10;Pomada Modeladora,Pomada para cabelo efeito mate,45.00,25.00,15,5&#10;Shampoo Barba,Shampoo especial para barba,35.00,18.00,20,8"
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
              {isImporting ? "Importando..." : "Importar Produtos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarProdutosDialog;
