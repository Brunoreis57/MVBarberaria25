import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditarAtendimentoDialog } from "@/components/EditarAtendimentoDialog";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CorteAdicionalDialog } from "@/components/CorteAdicionalDialog";
import { formatBRL } from "@/lib/utils";

const Atendimentos = () => {
  const { data: atendimentos, isLoading } = useAtendimentos();
  const [editingAtendimento, setEditingAtendimento] = useState<any>(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string | null>(null);

  const handleEdit = (atendimento: any) => {
    setEditingAtendimento(atendimento);
  };

  const atendimentosFuncionarios = atendimentos?.filter(
    (a) => a.forma_pagamento === "mv-funcionarios"
  ) || [];

  // Agrupar atendimentos de funcionários por cliente
  const atendimentosPorFuncionario = atendimentosFuncionarios.reduce((acc, atendimento) => {
    const nome = atendimento.cliente_nome;
    if (!acc[nome]) {
      acc[nome] = [];
    }
    acc[nome].push(atendimento);
    return acc;
  }, {} as Record<string, typeof atendimentosFuncionarios>);

  // Separar atendimentos do mês atual e meses anteriores
  const getFuncionarioStats = (atendimentos: typeof atendimentosFuncionarios) => {
    const now = new Date();
    const mesAtual = atendimentos.filter(a => 
      isSameMonth(new Date(a.data_atendimento), now)
    );
    const mesesAnteriores = atendimentos.filter(a => 
      !isSameMonth(new Date(a.data_atendimento), now)
    );
    
    return {
      mesAtual,
      mesesAnteriores,
      cortesRealizados: mesAtual.length,
      cortesTotais: 4,
      progresso: (mesAtual.length / 4) * 100
    };
  };

  const formatCurrency = (value: number) => formatBRL(value);

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      "dinheiro": "Dinheiro",
      "pix": "PIX",
      "credito": "Crédito",
      "debito": "Débito",
      "mv-funcionarios": "MV Funcionários",
    };
    return methods[method] || method;
  };

  const renderAtendimentosList = (list: any[]) => {
    if (isLoading) {
      return <p className="text-muted-foreground">Carregando...</p>;
    }

    if (!list || list.length === 0) {
      return (
        <p className="text-muted-foreground">
          Nenhum atendimento encontrado.
        </p>
      );
    }

    return (
      <div className="grid gap-4">
        {list.map((atendimento) => (
          <Card key={atendimento.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {atendimento.cliente_nome}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(atendimento)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Barbeiro:</span>
                  <p className="font-medium">
                    {atendimento.barbeiros?.nome || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Serviço:</span>
                  <p className="font-medium">
                    {atendimento.servicos?.nome || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data:</span>
                  <p className="font-medium">
                    {format(
                      new Date(atendimento.data_atendimento),
                      "dd/MM/yyyy HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <p className="font-medium text-primary">
                    {formatCurrency(Number(atendimento.valor))}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pagamento:</span>
                  <p className="font-medium">
                    {getPaymentMethodLabel(atendimento.forma_pagamento || "")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">
                    {atendimento.pago ? "✓ Pago" : "Pendente"}
                  </p>
                </div>
              </div>
              {atendimento.desconto_tipo && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground text-sm">
                    Desconto aplicado:{" "}
                  </span>
                  <span className="text-sm font-medium">
                    {atendimento.desconto_tipo === "percentual" ? "%" : "R$"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Atendimentos Realizados</h1>
          <p className="text-muted-foreground">
            Histórico completo de atendimentos
          </p>
        </div>

        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="todos">
              Todos ({atendimentos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="funcionarios">
              Funcionários ({atendimentosFuncionarios.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-6">
            {renderAtendimentosList(atendimentos || [])}
          </TabsContent>

          <TabsContent value="funcionarios" className="mt-6">
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : Object.keys(atendimentosPorFuncionario).length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum atendimento de funcionário encontrado.
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(atendimentosPorFuncionario).map(([nome, atendimentos]) => {
                  const stats = getFuncionarioStats(atendimentos);
                  const [showOldAtendimentos, setShowOldAtendimentos] = useState(false);
                  
                  return (
                    <Card key={nome}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">{nome}</CardTitle>
                            <div className="space-y-2 mt-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Cortes este mês: {stats.cortesRealizados} de {stats.cortesTotais}
                                </span>
                                <span className="font-medium">
                                  {Math.round(stats.progresso)}%
                                </span>
                              </div>
                              <Progress value={stats.progresso} className="h-2" />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setFuncionarioSelecionado(nome)}
                            className="ml-4"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Corte Adicional
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Atendimentos do mês atual */}
                        <div>
                          <h4 className="font-semibold mb-3">Mês Atual</h4>
                          <div className="grid gap-3">
                            {stats.mesAtual.map((atendimento) => (
                              <Card key={atendimento.id} className="border-l-4 border-l-primary">
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                      {format(
                                        new Date(atendimento.data_atendimento),
                                        "dd/MM/yyyy HH:mm",
                                        { locale: ptBR }
                                      )}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(atendimento)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Barbeiro:</span>
                                      <p className="font-medium">
                                        {atendimento.barbeiros?.nome || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Serviço:</span>
                                      <p className="font-medium">
                                        {atendimento.servicos?.nome || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Valor:</span>
                                      <p className="font-medium text-primary">
                                        {formatCurrency(Number(atendimento.valor))}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Status:</span>
                                      <p className="font-medium">
                                        {atendimento.pago ? "✓ Pago" : "Pendente"}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Atendimentos de meses anteriores (colapsável) */}
                        {stats.mesesAnteriores.length > 0 && (
                          <Collapsible open={showOldAtendimentos} onOpenChange={setShowOldAtendimentos}>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <span>Meses Anteriores ({stats.mesesAnteriores.length})</span>
                                {showOldAtendimentos ? (
                                  <ChevronUp className="ml-2 h-4 w-4" />
                                ) : (
                                  <ChevronDown className="ml-2 h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3">
                              <div className="grid gap-3">
                                {stats.mesesAnteriores.map((atendimento) => (
                                  <Card key={atendimento.id} className="opacity-70">
                                    <CardContent className="pt-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">
                                          {format(
                                            new Date(atendimento.data_atendimento),
                                            "dd/MM/yyyy HH:mm",
                                            { locale: ptBR }
                                          )}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEdit(atendimento)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Barbeiro:</span>
                                          <p className="font-medium">
                                            {atendimento.barbeiros?.nome || "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Serviço:</span>
                                          <p className="font-medium">
                                            {atendimento.servicos?.nome || "N/A"}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Valor:</span>
                                          <p className="font-medium text-primary">
                                            {formatCurrency(Number(atendimento.valor))}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Status:</span>
                                          <p className="font-medium">
                                            {atendimento.pago ? "✓ Pago" : "Pendente"}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {editingAtendimento && (
        <EditarAtendimentoDialog
          open={!!editingAtendimento}
          onOpenChange={(open) => !open && setEditingAtendimento(null)}
          atendimento={editingAtendimento}
        />
      )}

      {funcionarioSelecionado && (
        <CorteAdicionalDialog
          open={!!funcionarioSelecionado}
          onOpenChange={(open) => !open && setFuncionarioSelecionado(null)}
          funcionarioNome={funcionarioSelecionado}
        />
      )}
    </DashboardLayout>
  );
};

export default Atendimentos;
