import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { useServicos } from "@/hooks/useServicos";
import { useClientes } from "@/hooks/useClientes";
import { useQueryClient } from "@tanstack/react-query";
import { formatBRL } from "@/lib/utils";

interface AtendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AtendimentoDialog({ open, onOpenChange }: AtendimentoDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: barbeiros } = useBarbeiros();
  const { data: servicos } = useServicos();
  const { data: clientes } = useClientes();
  const [loading, setLoading] = useState(false);
  const [barbeiroIdLogado, setBarbeiroIdLogado] = useState<string>("");
  
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientBirthday: "",
    servicoId: "",
    barbeiroId: "",
    desconto: 0,
    descontoTipo: "barbeiro" as "barbeiro" | "barbearia",
  });
  const [servicoSelecionado, setServicoSelecionado] = useState<any>(null);

  // Busca o barbeiro_id do usuário logado se for barbeiro
  useEffect(() => {
    const loadBarbeiroId = async () => {
      if (user?.role === "barber") {
        const { data } = await supabase
          .from("barbeiros")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (data) {
          setBarbeiroIdLogado(data.id);
          setFormData(prev => ({ ...prev, barbeiroId: data.id }));
        }
      }
    };

    if (open) {
      loadBarbeiroId();
    }
  }, [user, open]);

  // Autocompletar dados do cliente quando o nome for digitado
  const handleClientNameChange = (name: string) => {
    setFormData({ ...formData, clientName: name });
    
    // Buscar cliente pelo nome
    const clienteEncontrado = clientes?.find(
      c => c.nome.toLowerCase() === name.toLowerCase()
    );
    
    if (clienteEncontrado) {
      setFormData({
        ...formData,
        clientName: name,
        clientPhone: clienteEncontrado.telefone || "",
        clientBirthday: clienteEncontrado.data_aniversario || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.servicoId || !formData.barbeiroId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    // Validar desconto
    if (servicoSelecionado && formData.desconto > Number(servicoSelecionado.preco)) {
      toast({
        title: "Erro",
        description: "O desconto não pode ser maior que o valor do serviço.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Salvar ou atualizar cliente se houver telefone
      if (formData.clientPhone) {
        const { data: existingClient } = await supabase
          .from("clientes")
          .select("id")
          .eq("telefone", formData.clientPhone)
          .maybeSingle();

        if (existingClient) {
          // Atualizar cliente existente
          await supabase
            .from("clientes")
            .update({
              nome: formData.clientName,
              data_aniversario: formData.clientBirthday || null,
            })
            .eq("id", existingClient.id);
        } else {
          // Criar novo cliente
          await supabase.from("clientes").insert({
            nome: formData.clientName,
            telefone: formData.clientPhone,
            data_aniversario: formData.clientBirthday || null,
          });
        }
      }

      // Buscar o serviço selecionado para obter o valor
      const { data: servico } = await supabase
        .from("servicos")
        .select("preco")
        .eq("id", formData.servicoId)
        .single();

      if (!servico) throw new Error("Serviço não encontrado");

      // Calcular valor final (preço - desconto)
      const valorFinal = Number(servico.preco) - formData.desconto;

      // Inserir atendimento
      const { error } = await supabase
        .from("atendimentos")
        .insert({
          cliente_nome: formData.clientName,
          servico_id: formData.servicoId,
          barbeiro_id: formData.barbeiroId,
          valor: valorFinal,
          pago: false,
          desconto_tipo: formData.desconto > 0 ? formData.descontoTipo : null,
        });

      if (error) throw error;

      const descontoMsg = formData.desconto > 0 
        ? ` (Desconto de ${formatBRL(formData.desconto)} aplicado - sai da ${formData.descontoTipo === 'barbeiro' ? 'comissão do barbeiro' : 'barbearia'})`
        : '';

      toast({
        title: "Atendimento registrado!",
        description: `Cliente: ${formData.clientName}${descontoMsg} - Marque como pago para adicionar à receita`,
      });

      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setFormData({ 
        clientName: "",
        clientPhone: "",
        clientBirthday: "",
        servicoId: "", 
        barbeiroId: user?.role === "barber" ? barbeiroIdLogado : "",
        desconto: 0,
        descontoTipo: "barbeiro",
      });
      setServicoSelecionado(null);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar atendimento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Atendimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nome do Cliente</Label>
            <Input
              id="clientName"
              placeholder="Digite o nome do cliente"
              value={formData.clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              list="clientes-list"
            />
            <datalist id="clientes-list">
              {clientes?.map((cliente) => (
                <option key={cliente.id} value={cliente.nome} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientPhone">Telefone (opcional)</Label>
            <Input
              id="clientPhone"
              placeholder="(11) 98765-4321"
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientBirthday">Data de Aniversário (opcional)</Label>
            <Input
              id="clientBirthday"
              type="date"
              value={formData.clientBirthday}
              onChange={(e) => setFormData({ ...formData, clientBirthday: e.target.value })}
            />
          </div>

          {user?.role === "admin" && (
            <div className="space-y-2">
              <Label htmlFor="barbeiro">Barbeiro</Label>
              <Select
                value={formData.barbeiroId}
                onValueChange={(value) => setFormData({ ...formData, barbeiroId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {barbeiros?.map((barbeiro) => (
                    <SelectItem key={barbeiro.id} value={barbeiro.id}>
                      {barbeiro.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            <Select
              value={formData.servicoId}
              onValueChange={(value) => {
                const servico = servicos?.find(s => s.id === value);
                setServicoSelecionado(servico);
                setFormData({ ...formData, servicoId: value, desconto: 0 });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {servicos?.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.nome} - {formatBRL(servico.preco)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {servicoSelecionado && (
            <>
              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto (opcional)</Label>
                <Input
                  id="desconto"
                  type="number"
                  min="0"
                  max={Number(servicoSelecionado.preco)}
                  step="0.01"
                  placeholder="0.00"
                  value={formData.desconto || ""}
                  onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
                />
                {formData.desconto > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Valor final: {formatBRL(Number(servicoSelecionado.preco) - formData.desconto)}
                  </p>
                )}
              </div>

              {formData.desconto > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="descontoTipo">Desconto sai de:</Label>
                  <Select
                    value={formData.descontoTipo}
                    onValueChange={(value: "barbeiro" | "barbearia") => 
                      setFormData({ ...formData, descontoTipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barbeiro">Comissão do Barbeiro</SelectItem>
                      <SelectItem value="barbearia">Barbearia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Atendimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
