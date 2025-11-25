import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, Smartphone, Banknote, ArrowUpRight, ArrowDownRight, Plus, Upload, Trash2 } from "lucide-react";
import { MobileSidebar } from "@/components/MobileSidebar";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PagamentoDialog from "@/components/PagamentoDialog";
import RetiradaDialog from "@/components/RetiradaDialog";
import ImportarCaixaDialog from "@/components/ImportarCaixaDialog";
import { AdicionarValorCaixaDialog } from "@/components/AdicionarValorCaixaDialog";
import { usePagamentos } from "@/hooks/usePagamentos";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { useVendas } from "@/hooks/useVendas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";
import { formatBRL } from "@/lib/utils";

const Caixa = () => {
  const { user } = useAuth();
  const formatCurrency = (value: number) => formatBRL(value);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [retiradaOpen, setRetiradaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [adicionarValorOpen, setAdicionarValorOpen] = useState(false);
  const { data: pagamentos } = usePagamentos();
  const { data: atendimentos } = useAtendimentos();
  const { data: barbeiros } = useBarbeiros();
  const { data: vendas } = useVendas();
  const [stats, setStats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [barbeiroStats, setBarbeiroStats] = useState<any[]>([]);
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<string | null>(null);
  

  

  const handleDeleteTransaction = async (transactionId: string, type: 'entrada' | 'saida') => {
    try {
      if (type === 'saida') {
        const { error } = await supabase
          .from('retiradas')
          .delete()
          .eq('id', transactionId);
        
        if (error) throw error;
        toast.success('Retirada excluída com sucesso!');
      } else {
        const { error } = await supabase
          .from('atendimentos')
          .delete()
          .eq('id', transactionId);
        
        if (error) throw error;
        toast.success('Atendimento excluído com sucesso!');
      }
      
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação: ' + error.message);
    }
  };

  // Auto-atualização em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('caixa-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pagamentos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'atendimentos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'retiradas'
        },
        () => {
          // Força recalcular tudo quando há mudança nas retiradas
          setReloadTrigger(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendas_produtos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["vendas_produtos"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ajustes_caixa_barbeiro'
        },
        () => {
          // Força recalcular tudo quando há mudança nos ajustes
          setReloadTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (pagamentos && atendimentos && vendas) {
      // Buscar retiradas e ajustes de caixa primeiro
      Promise.all([
        supabase.from("retiradas").select("*").order("data_retirada", { ascending: false }),
        supabase.from("ajustes_caixa_barbeiro").select("*").order("data_ajuste", { ascending: false })
      ]).then(([{ data: retiradas }, { data: ajustes }]) => {
          // Calcular totais por forma de pagamento dos atendimentos pagos
          const atendimentosPagos = atendimentos.filter((a: any) => a.pago);
          
          // Calcular totais de vendas por forma de pagamento
          const totalVendasCredito = (vendas || [])
            .filter((v: any) => v.forma_pagamento?.toLowerCase() === 'credito')
            .reduce((sum: number, v: any) => sum + parseFloat(v.valor_total || 0), 0);
          
          const totalVendasDebito = (vendas || [])
            .filter((v: any) => v.forma_pagamento?.toLowerCase() === 'debito')
            .reduce((sum: number, v: any) => sum + parseFloat(v.valor_total || 0), 0);
          
          const totalVendasPix = (vendas || [])
            .filter((v: any) => v.forma_pagamento?.toLowerCase() === 'pix')
            .reduce((sum: number, v: any) => sum + parseFloat(v.valor_total || 0), 0);
          
          const totalVendasDinheiro = (vendas || [])
            .filter((v: any) => v.forma_pagamento?.toLowerCase() === 'dinheiro')
            .reduce((sum: number, v: any) => sum + parseFloat(v.valor_total || 0), 0);
          
          const totalCartaoCredito = atendimentosPagos
            .filter((a: any) => a.forma_pagamento?.toLowerCase() === 'cartao-credito')
            .reduce((sum: number, a: any) => sum + parseFloat(a.valor || 0), 0) + totalVendasCredito;
          
          const totalCartaoDebito = atendimentosPagos
            .filter((a: any) => a.forma_pagamento?.toLowerCase() === 'cartao-debito')
            .reduce((sum: number, a: any) => sum + parseFloat(a.valor || 0), 0) + totalVendasDebito;
          
          const inicioMes = startOfMonth(new Date());
          const fimMes = endOfMonth(new Date());

          const noMes = (d: string) => {
            const dt = new Date(d);
            return dt >= inicioMes && dt <= fimMes;
          };

          const atendimentosMes = atendimentosPagos.filter((a: any) => noMes(a.data_atendimento));
          const vendasMes = (vendas || []).filter((v: any) => noMes(v.data_venda));
          const retiradasMes = (retiradas || []).filter((r: any) => noMes(r.data_retirada));
          const ajustesMes = (ajustes || []).filter((a: any) => noMes(a.data_ajuste));

          const totalVendasCreditoMes = vendasMes
            .filter((v: any) => v.forma_pagamento?.toLowerCase() === 'credito')
            .reduce((sum: number, v: any) => sum + parseFloat(v.valor_total || 0), 0);
          const totalVendasDebitoMes = vendasMes
            .filter((v: any) => v.forma_pagamento?.toLowerCase() === 'debito')
            .reduce((sum: number, v: any) => sum + parseFloat(v.valor_total || 0), 0);
          const totalVendasPixMes = vendasMes
            .filter((v: any) => v.forma_pagamento?.toLowerCase() === 'pix')
            .reduce((sum: number, v: any) => sum + parseFloat(v.valor_total || 0), 0);
          const totalVendasDinheiroMes = vendasMes
            .filter((v: any) => v.forma_pagamento?.toLowerCase() === 'dinheiro')
            .reduce((sum: number, v: any) => sum + parseFloat(v.valor_total || 0), 0);

          const totalCartaoCreditoMes = atendimentosMes
            .filter((a: any) => a.forma_pagamento?.toLowerCase() === 'credito')
            .reduce((sum: number, a: any) => sum + parseFloat(a.valor || 0), 0) + totalVendasCreditoMes;
          const totalCartaoDebitoMes = atendimentosMes
            .filter((a: any) => a.forma_pagamento?.toLowerCase() === 'debito')
            .reduce((sum: number, a: any) => sum + parseFloat(a.valor || 0), 0) + totalVendasDebitoMes;
          const totalPixMes = atendimentosMes
            .filter((a: any) => a.forma_pagamento?.toLowerCase() === 'pix')
            .reduce((sum: number, a: any) => sum + parseFloat(a.valor || 0), 0) + totalVendasPixMes;
          const totalDinheiroEntradasMes = atendimentosMes
            .filter((a: any) => a.forma_pagamento?.toLowerCase() === 'dinheiro')
            .reduce((sum: number, a: any) => sum + parseFloat(a.valor || 0), 0) + totalVendasDinheiroMes;
          const totalRetiradasMes = retiradasMes.reduce((sum: number, r: any) => sum + parseFloat(r.valor || 0), 0);
          const totalDinheiroMes = totalDinheiroEntradasMes - totalRetiradasMes;
          const totalGeralMes = totalCartaoCreditoMes + totalCartaoDebitoMes + totalPixMes + totalDinheiroMes;

          setStats([
            {
              title: "Saldo do Mês",
              value: formatCurrency(totalGeralMes),
              icon: DollarSign,
              color: "text-primary",
            },
            {
              title: "Cartão Crédito",
              value: formatCurrency(totalCartaoCreditoMes),
              icon: CreditCard,
              color: "text-blue-600",
            },
            {
              title: "Cartão Débito",
              value: formatCurrency(totalCartaoDebitoMes),
              icon: CreditCard,
              color: "text-purple-600",
            },
            {
              title: "Pix",
              value: formatCurrency(totalPixMes),
              icon: Smartphone,
              color: "text-green-600",
            },
            {
              title: "Dinheiro",
              value: formatCurrency(totalDinheiroMes),
              icon: Banknote,
              color: "text-orange-600",
            },
          ]);

          // Buscar transações recentes (atendimentos pagos + vendas + retiradas)
          const atendimentosTransacoes = atendimentosMes.map((a: any) => ({
        id: a.id,
        type: "entrada",
        description: `${a.servicos?.nome || 'Serviço'} - ${a.cliente_nome}`,
        method: a.forma_pagamento,
        amount: Number(a.valor),
        date: a.data_atendimento,
        time: new Date(a.data_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));

          const vendasTransacoes = vendasMes.map((v: any) => ({
            id: v.id,
            type: "entrada",
            description: `Venda: ${v.produto?.nome || 'Produto'} (${v.quantidade}x)${v.barbeiro ? ` - ${v.barbeiro.nome}` : ''}`,
            method: v.forma_pagamento,
            amount: Number(v.valor_total),
            date: v.data_venda,
            time: new Date(v.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          }));

          const retiradasTransacoes = retiradasMes.map((r: any) => ({
            id: r.id,
            type: "saida",
            description: `Retirada - ${r.pessoa}`,
            method: "Dinheiro",
            amount: Number(r.valor),
            date: r.data_retirada,
            time: new Date(r.data_retirada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          }));

          // Combinar e ordenar todas as transações
          const todasTransacoes = [...atendimentosTransacoes, ...vendasTransacoes, ...retiradasTransacoes]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

          setTransactions(todasTransacoes);

          // Calcular caixa por barbeiro
          if (barbeiros) {
            const statsPorBarbeiro = barbeiros.map((barbeiro: any) => {
              const atendimentosBarbeiro = atendimentosMes.filter((a: any) => a.barbeiro_id === barbeiro.id);
              const vendasBarbeiro = vendasMes.filter((v: any) => v.barbeiro_id === barbeiro.id);
              
              // Calcular comissão baseada na porcentagem do barbeiro
              const porcentagemComissao = parseFloat(barbeiro.porcentagem_comissao || 50) / 100;
              const totalComissaoAtendimentos = atendimentosBarbeiro.reduce((sum: number, a: any) => {
                const valorAtendimento = parseFloat(a.valor || 0);
                return sum + (valorAtendimento * porcentagemComissao);
              }, 0);
              
              // Somar comissões de vendas de produtos
              const totalComissaoVendas = vendasBarbeiro.reduce((sum: number, v: any) => {
                return sum + parseFloat(v.valor_comissao || 0);
              }, 0);
              
              const totalComissao = totalComissaoAtendimentos + totalComissaoVendas;
              
              const retiradasBarbeiro = retiradasMes.filter((r: any) => r.barbeiro_id === barbeiro.id);
              const totalRetiradasBarbeiro = retiradasBarbeiro.reduce((sum: number, r: any) => sum + parseFloat(r.valor || 0), 0);
              
              // Calcular ajustes de caixa (créditos - débitos)
              const ajustesBarbeiro = ajustesMes.filter((a: any) => a.barbeiro_id === barbeiro.id);
              const totalAjustes = ajustesBarbeiro.reduce((sum: number, a: any) => {
                const valor = parseFloat(a.valor || 0);
                return a.tipo === 'credito' ? sum + valor : sum - valor;
              }, 0);
              
              const saldoBarbeiro = totalComissao - totalRetiradasBarbeiro + totalAjustes;

              // Criar transações do barbeiro com comissão
              const atendimentosTransacoesBarbeiro = atendimentosBarbeiro.map((a: any) => {
                const valorAtendimento = parseFloat(a.valor || 0);
                const comissaoAtendimento = valorAtendimento * porcentagemComissao;
                return {
                  id: a.id,
                  type: "entrada",
                  description: `${a.servicos?.nome || 'Serviço'} - ${a.cliente_nome}`,
                  method: a.forma_pagamento,
                  amount: comissaoAtendimento,
                  date: a.data_atendimento,
                  time: new Date(a.data_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                };
              });

              const vendasTransacoesBarbeiro = vendasBarbeiro.map((v: any) => ({
                id: v.id,
                type: "entrada",
                description: `Venda: ${v.produto?.nome || 'Produto'} (${v.quantidade}x)`,
                method: v.forma_pagamento,
                amount: parseFloat(v.valor_comissao || 0),
                date: v.data_venda,
                time: new Date(v.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              }));

              const retiradasTransacoesBarbeiro = retiradasBarbeiro.map((r: any) => ({
                id: r.id,
                type: "saida",
                description: `Retirada - ${r.pessoa}`,
                method: "Dinheiro",
                amount: Number(r.valor),
                date: r.data_retirada,
                time: new Date(r.data_retirada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              }));

              const ajustesTransacoesBarbeiro = ajustesBarbeiro.map((a: any) => ({
                id: a.id,
                type: a.tipo === 'credito' ? "entrada" : "saida",
                description: `Ajuste - ${a.descricao}`,
                method: a.tipo === 'credito' ? "Crédito Manual" : "Débito Manual",
                amount: Number(a.valor),
                date: a.data_ajuste,
                time: new Date(a.data_ajuste).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              }));

              const transacoesBarbeiro = [...atendimentosTransacoesBarbeiro, ...vendasTransacoesBarbeiro, ...retiradasTransacoesBarbeiro, ...ajustesTransacoesBarbeiro]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return {
                barbeiro_id: barbeiro.id,
                barbeiro_nome: barbeiro.nome,
                total_comissao: totalComissao,
                total_retiradas: totalRetiradasBarbeiro,
                total_ajustes: totalAjustes,
                saldo: saldoBarbeiro,
                quantidade_atendimentos: atendimentosBarbeiro.length,
                transacoes: transacoesBarbeiro,
                porcentagem_comissao: barbeiro.porcentagem_comissao,
              };
            });

            setBarbeiroStats(statsPorBarbeiro);
          }
        }).catch(error => {
          console.error('Erro ao buscar dados do caixa:', error);
        });
    }
  }, [pagamentos, atendimentos, vendas, reloadTrigger, barbeiros, user?.role]);

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <header className="h-14 border-b border-border flex items-center px-4 bg-card sticky top-0 z-10">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Caixa</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {user?.role === "admin" ? "Visão Geral Financeira" : "Meu Caixa"}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                {user?.role === "admin" ? "Gestão financeira e pagamentos" : "Visualize o caixa e registre retiradas"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.role === "admin" && (
                <>
                  
                  <Button onClick={() => setAdicionarValorOpen(true)} variant="outline" className="gap-2 flex-1 md:flex-none">
                    <DollarSign className="w-4 h-4" />
                    <span className="hidden sm:inline">Adicionar ao Caixa</span>
                    <span className="sm:hidden">Caixa</span>
                  </Button>
                  
                </>
              )}
              <Button onClick={() => setRetiradaOpen(true)} variant={user?.role === "barber" ? "default" : "outline"} className="gap-2 flex-1 md:flex-none">
                <ArrowDownRight className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar Retirada</span>
                <span className="sm:hidden">Retirada</span>
              </Button>
            </div>
          </div>

        {user?.role === "admin" ? (
          // Visão completa para administrador com abas
          <Tabs defaultValue="geral" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="geral">Caixa Geral</TabsTrigger>
              <TabsTrigger value="barbeiros">Caixa por Barbeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {stats.map((stat) => (
                  <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Transações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "entrada"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {transaction.type === "entrada" ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{transaction.method}</span>
                              <span>•</span>
                              <span>{transaction.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                transaction.type === "entrada" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transaction.type === "entrada" ? "+" : "-"}{formatCurrency(transaction.amount)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTransaction(transaction.id, transaction.type)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="barbeiros" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {barbeiroStats.map((stat) => (
                  <Card key={stat.barbeiro_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        {stat.barbeiro_nome}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Comissão ({stat.porcentagem_comissao}%):</span>
                        <span className="font-semibold text-green-600">{formatCurrency(stat.total_comissao)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Retiradas:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(stat.total_retiradas)}</span>
                      </div>
                      {stat.total_ajustes !== 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Ajustes:</span>
                          <span className={`font-semibold ${stat.total_ajustes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(stat.total_ajustes)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-semibold">Saldo:</span>
                        <span className={`text-xl font-bold ${stat.saldo >= 0 ? 'text-primary' : 'text-red-600'}`}>
                          {formatCurrency(stat.saldo)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground text-center pt-1">
                        {stat.quantidade_atendimentos} atendimento{stat.quantidade_atendimentos !== 1 ? 's' : ''}
                      </div>
                      <Button 
                        onClick={() => setSelectedBarbeiro(selectedBarbeiro === stat.barbeiro_id ? null : stat.barbeiro_id)}
                        variant="outline" 
                        className="w-full mt-4"
                      >
                        {selectedBarbeiro === stat.barbeiro_id ? 'Ocultar Transações' : 'Ver Transações'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedBarbeiro && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>
                      Transações de {barbeiroStats.find(b => b.barbeiro_id === selectedBarbeiro)?.barbeiro_nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {barbeiroStats.find(b => b.barbeiro_id === selectedBarbeiro)?.transacoes.length > 0 ? (
                        barbeiroStats.find(b => b.barbeiro_id === selectedBarbeiro)?.transacoes.map((transaction: any) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  transaction.type === "entrada"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {transaction.type === "entrada" ? (
                                  <ArrowUpRight className="w-5 h-5" />
                                ) : (
                                  <ArrowDownRight className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{transaction.description}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{transaction.method}</span>
                                  <span>•</span>
                                  <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                                  <span>•</span>
                                  <span>{transaction.time}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-lg font-bold ${
                                  transaction.type === "entrada" ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {transaction.type === "entrada" ? "+" : "-"}{formatCurrency(transaction.amount)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Nenhuma transação registrada</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // Visão detalhada para barbeiro
          (() => {
            // Encontrar o barbeiro do usuário logado
            const barbeiroLogado = barbeiros?.find((b: any) => b.user_id === user?.id);
            const statsBarbeiro = barbeiroStats.find((s: any) => s.barbeiro_id === barbeiroLogado?.id);

            if (!statsBarbeiro) {
              return (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="space-y-6">
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <CardTitle className="text-center text-xl">{statsBarbeiro.barbeiro_nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <span className="font-semibold">Total Comissão ({statsBarbeiro.porcentagem_comissao}%):</span>
                        <span className="text-xl font-bold text-green-600">{formatCurrency(statsBarbeiro.total_comissao)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <span className="font-semibold">Total Retiradas:</span>
                        <span className="text-xl font-bold text-red-600">{formatCurrency(statsBarbeiro.total_retiradas)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <span className="font-semibold">Ajustes:</span>
                        <span className={`text-xl font-bold ${statsBarbeiro.total_ajustes >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                          {formatCurrency(statsBarbeiro.total_ajustes)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                        <span className="font-bold text-lg">Saldo:</span>
                        <span className={`text-2xl font-bold ${statsBarbeiro.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(statsBarbeiro.saldo)}
                        </span>
                      </div>
                    </div>
                    <Button onClick={() => setRetiradaOpen(true)} size="lg" className="w-full gap-2 mt-4">
                      <ArrowDownRight className="w-5 h-5" />
                      Registrar Retirada
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Minhas Transações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {statsBarbeiro.transacoes.length > 0 ? (
                        statsBarbeiro.transacoes.slice(0, 10).map((transaction: any) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  transaction.type === "entrada"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {transaction.type === "entrada" ? (
                                  <ArrowUpRight className="w-5 h-5" />
                                ) : (
                                  <ArrowDownRight className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{transaction.description}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{transaction.method}</span>
                                  <span>•</span>
                                  <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                                  <span>•</span>
                                  <span>{transaction.time}</span>
                                </div>
                              </div>
                            </div>
                            <p
                              className={`text-lg font-bold ${
                                transaction.type === "entrada" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transaction.type === "entrada" ? "+" : "-"}{formatCurrency(transaction.amount)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Nenhuma transação registrada</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()
        )}
        </div>
      </main>

      <PagamentoDialog open={pagamentoOpen} onOpenChange={setPagamentoOpen} />
      <RetiradaDialog open={retiradaOpen} onOpenChange={setRetiradaOpen} />
      <ImportarCaixaDialog open={importOpen} onOpenChange={setImportOpen} />
      <AdicionarValorCaixaDialog open={adicionarValorOpen} onOpenChange={setAdicionarValorOpen} barbeiros={barbeiros || []} />
    </div>
  );
};

export default Caixa;
