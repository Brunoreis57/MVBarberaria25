import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Percent, UserCog, Plus, Scissors, Trash2, Pencil, Phone, AlertTriangle, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBarbeiros } from "@/hooks/useBarbeiros";
import { useServicos } from "@/hooks/useServicos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL } from "@/lib/utils";

const Configuracoes = () => {
  const queryClient = useQueryClient();
  const { data: barbeiros = [], isLoading: loadingBarbeiros } = useBarbeiros();
  const { data: servicos = [], isLoading: loadingServicos } = useServicos();

  const [newBarber, setNewBarber] = useState({ 
    name: "", 
    email: "", 
    password: "" 
  });
  const [newService, setNewService] = useState({ name: "", price: 0, categoria: "" });
  const [editingService, setEditingService] = useState<{ id: string; name: string; price: number; categoria: string } | null>(null);
  const [editingBarber, setEditingBarber] = useState<{ id: string; name: string; email: string; password: string; porcentagem: number; userId: string } | null>(null);
  const [openNewBarber, setOpenNewBarber] = useState(false);
  const [openNewService, setOpenNewService] = useState(false);
  const [openEditService, setOpenEditService] = useState(false);
  const [openEditBarber, setOpenEditBarber] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDeleteData, setOpenDeleteData] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [backupPeriod, setBackupPeriod] = useState("semana");
  const [isExporting, setIsExporting] = useState(false);
  
  const [importText, setImportText] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ total: number; pagos: number; valorTotal: number } | null>(null);
  
  const parseDateTime = (s: string) => {
    const [datePart, timePart] = s.trim().split(" ");
    const [d, m, y] = datePart.split("/").map((x) => parseInt(x, 10));
    const [hh, mm] = timePart.split(":").map((x) => parseInt(x, 10));
    const dt = new Date(y, m - 1, d, hh, mm);
    return dt.toISOString();
  };

  const parseValor = (s: string) => {
    const t = String(s || "").trim();
    const u = t.replace(/[^0-9,\.\-]/g, "");
    if (u.includes(",") && u.includes(".")) {
      return parseFloat(u.replace(/\./g, "").replace(",", ".")) || 0;
    }
    if (u.includes(",")) {
      return parseFloat(u.replace(",", ".")) || 0;
    }
    const parts = u.split(".");
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(u) || 0;
    }
    return parseFloat(u.replace(/\./g, "")) || 0;
  };

  const analyzeImport = () => {
    setAnalyzing(true);
    try {
      const lines = importText.split(/\r?\n/).map((l) => l.trim());
      const startIdx = lines.findIndex((l) => l.toUpperCase().startsWith("ATENDIMENTOS"));
      if (startIdx === -1) {
        toast.error("Seção ATENDIMENTOS não encontrada");
        setParsedRows([]);
        setImportSummary(null);
        setAnalyzing(false);
        return;
      }
      let headerIdx = startIdx + 1;
      while (headerIdx < lines.length && lines[headerIdx] === "") headerIdx++;
      const header = lines[headerIdx];
      const expectedHeader = "Data/Hora;Cliente;Barbeiro;Serviço;Valor;Pago;Forma Pagamento;Desconto";
      if (!header || header.replace(/\s+/g, " ").trim() !== expectedHeader) {
        toast.error("Cabeçalho de ATENDIMENTOS inválido");
        setAnalyzing(false);
        return;
      }
      const rows: any[] = [];
      for (let i = headerIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.startsWith("====") || line.toUpperCase().includes("VENDAS")) break;
        const parts = line.split(";");
        if (parts.length < 8) continue;
        const [dataHora, cliente, barbeiro, servico, valorStr, pagoStr, forma, desconto] = parts;
        const valor = parseValor(valorStr);
        rows.push({
          data_atendimento: parseDateTime(dataHora),
          cliente_nome: cliente.trim(),
          barbeiro_nome: barbeiro.trim(),
          servico_nome: servico.trim(),
          valor: Number(valor),
          pago: pagoStr.trim().toLowerCase().startsWith("sim"),
          forma_pagamento: pagoStr.trim().toLowerCase().startsWith("sim") && forma.trim() !== "-" ? forma.trim().toLowerCase() : null,
          desconto_tipo: ["barbeiro", "barbearia"].includes(desconto.trim().toLowerCase()) ? desconto.trim().toLowerCase() : null,
          desconto_valor: 0,
        });
      }
      setParsedRows(rows);
      const pagos = rows.filter((r) => r.pago).length;
      const valorTotal = rows.filter((r) => r.pago).reduce((sum, r) => sum + Number(r.valor || 0), 0);
      setImportSummary({ total: rows.length, pagos, valorTotal });
      toast.success(`Analisado ${rows.length} atendimentos`);
    } catch (e: any) {
      toast.error("Erro ao analisar dados");
    } finally {
      setAnalyzing(false);
    }
  };

  const getOrCreateBarbeiroId = async (nome: string) => {
    const { data } = await supabase.from("barbeiros").select("id").eq("nome", nome).maybeSingle();
    if (data?.id) return data.id;
    const ins = await supabase.from("barbeiros").insert({ nome, ativo: true }).select("id").single();
    if (ins.error) throw ins.error;
    return ins.data.id;
  };

  const getOrCreateServicoId = async (nome: string, preco: number) => {
    const { data } = await supabase.from("servicos").select("id").eq("nome", nome).maybeSingle();
    if (data?.id) return data.id;
    const ins = await supabase.from("servicos").insert({ nome, preco: Number(preco) || 0, ativo: true }).select("id").single();
    if (ins.error) throw ins.error;
    return ins.data.id;
  };

  const handleImportData = async () => {
    if (parsedRows.length === 0) {
      toast.error("Nenhum atendimento analisado");
      return;
    }
    setImporting(true);
    try {
      let inserted = 0;
      for (const r of parsedRows) {
        const barbeiroId = await getOrCreateBarbeiroId(r.barbeiro_nome);
        const servicoId = await getOrCreateServicoId(r.servico_nome, r.valor);
        const { error } = await supabase.from("atendimentos").insert({
          barbeiro_id: barbeiroId,
          cliente_nome: r.cliente_nome,
          servico_id: servicoId,
          forma_pagamento: r.forma_pagamento,
          valor: r.valor,
          data_atendimento: r.data_atendimento,
          pago: r.pago,
          desconto_tipo: r.desconto_tipo,
          desconto_valor: r.desconto_valor,
        });
        if (!error) inserted++;
      }
      toast.success(`Importados ${inserted} atendimentos`);
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
    } catch (e: any) {
      toast.error("Erro ao importar dados");
    } finally {
      setImporting(false);
    }
  };

  const handleAddBarber = async () => {
    const form = document.getElementById('barber-form') as HTMLFormElement;
    const porcentagemInput = form?.querySelector('#barber-porcentagem') as HTMLInputElement;
    const porcentagem = parseFloat(porcentagemInput?.value || '50');

    if (!newBarber.name.trim() || !newBarber.email.trim() || !newBarber.password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newBarber.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newBarber.email,
        password: newBarber.password,
        options: {
          data: {
            name: newBarber.name
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // 2. Criar registro no barbeiros
      const { error: barbeiroError } = await supabase
        .from("barbeiros")
        .insert({
          nome: newBarber.name,
          user_id: authData.user.id,
          ativo: true,
          porcentagem_comissao: porcentagem
        });

      if (barbeiroError) throw barbeiroError;

      // 3. Adicionar role de barber
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "barber"
        });

      if (roleError) throw roleError;

      toast.success("Barbeiro criado com sucesso! Login: " + newBarber.email);
      setNewBarber({ name: "", email: "", password: "" });
      setOpenNewBarber(false);
      queryClient.invalidateQueries({ queryKey: ["barbeiros"] });
    } catch (error: any) {
      console.error("Erro ao criar barbeiro:", error);
      toast.error(error.message || "Erro ao criar barbeiro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBarber = async () => {
    if (!editingBarber) return;

    if (!editingBarber.name.trim() || !editingBarber.email.trim()) {
      toast.error("Preencha nome e email");
      return;
    }

    if (editingBarber.password && editingBarber.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Atualizar dados do barbeiro
      const { error: barbeiroError } = await supabase
        .from("barbeiros")
        .update({
          nome: editingBarber.name,
          porcentagem_comissao: editingBarber.porcentagem
        })
        .eq("id", editingBarber.id);

      if (barbeiroError) throw barbeiroError;

      // Atualizar senha se fornecida
      if (editingBarber.password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          editingBarber.userId,
          { password: editingBarber.password }
        );
        
        if (passwordError) {
          toast.error("Erro ao atualizar senha. Use o método de recuperação de senha.");
        }
      }

      toast.success("Barbeiro atualizado com sucesso!");
      setEditingBarber(null);
      setOpenEditBarber(false);
      queryClient.invalidateQueries({ queryKey: ["barbeiros"] });
    } catch (error: any) {
      console.error("Erro ao editar barbeiro:", error);
      toast.error(error.message || "Erro ao editar barbeiro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBarber = async (id: string) => {
    try {
      const { error } = await supabase
        .from("barbeiros")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Barbeiro desativado!");
      queryClient.invalidateQueries({ queryKey: ["barbeiros"] });
    } catch (error: any) {
      console.error("Erro ao desativar barbeiro:", error);
      toast.error("Erro ao desativar barbeiro");
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim() || newService.price <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    try {
      const { error } = await supabase
        .from("servicos")
        .insert({
          nome: newService.name,
          preco: newService.price,
          categoria: newService.categoria || null,
          ativo: true
        });

      if (error) throw error;

      setNewService({ name: "", price: 0, categoria: "" });
      setOpenNewService(false);
      toast.success("Serviço adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
    } catch (error: any) {
      console.error("Erro ao adicionar serviço:", error);
      toast.error("Erro ao adicionar serviço");
    }
  };

  const handleEditService = async () => {
    if (!editingService || !editingService.name.trim() || editingService.price <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    try {
      const { error } = await supabase
        .from("servicos")
        .update({
          nome: editingService.name,
          preco: editingService.price,
          categoria: editingService.categoria || null
        })
        .eq("id", editingService.id);

      if (error) throw error;

      setEditingService(null);
      setOpenEditService(false);
      toast.success("Serviço atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
    } catch (error: any) {
      console.error("Erro ao atualizar serviço:", error);
      toast.error("Erro ao atualizar serviço");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from("servicos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Serviço desativado!");
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
    } catch (error: any) {
      console.error("Erro ao desativar serviço:", error);
      toast.error("Erro ao desativar serviço");
    }
  };


  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    const loadWhatsapp = async () => {
      const { data } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("chave", "whatsapp_barbearia")
        .single();
      
      if (data) {
        setWhatsappNumber(data.valor || "");
      }
    };
    loadWhatsapp();
  }, []);

  const handleSaveWhatsapp = async () => {
    if (!whatsappNumber.trim()) {
      toast.error("Preencha o número do WhatsApp");
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("chave", "whatsapp_barbearia")
        .single();

      if (existing) {
        await supabase
          .from("configuracoes")
          .update({ valor: whatsappNumber })
          .eq("chave", "whatsapp_barbearia");
      } else {
        await supabase
          .from("configuracoes")
          .insert({ chave: "whatsapp_barbearia", valor: whatsappNumber });
      }

      toast.success("Número do WhatsApp salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar WhatsApp:", error);
      toast.error("Erro ao salvar número");
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);

    try {
      const now = new Date();
      let start, end;

      switch (backupPeriod) {
        case "semana":
          start = startOfWeek(now);
          end = endOfWeek(now);
          break;
        case "mes":
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case "ano":
          start = startOfYear(now);
          end = endOfYear(now);
          break;
        default:
          start = startOfWeek(now);
          end = endOfWeek(now);
      }

      // Buscar atendimentos
      const { data: atendimentos, error: atendError } = await supabase
        .from("atendimentos")
        .select(`
          *,
          barbeiros (nome),
          servicos (nome)
        `)
        .gte("data_atendimento", start.toISOString())
        .lte("data_atendimento", end.toISOString())
        .order("data_atendimento", { ascending: false });

      if (atendError) throw atendError;

      // Buscar vendas de produtos
      const { data: vendas, error: vendasError } = await supabase
        .from("vendas_produtos")
        .select(`
          *,
          produto:produtos(nome),
          barbeiro:barbeiros(nome)
        `)
        .gte("data_venda", start.toISOString())
        .lte("data_venda", end.toISOString())
        .order("data_venda", { ascending: false });

      if (vendasError) throw vendasError;

      // Excluir agendamentos
      const { error: agendError } = await supabase
        .from("agendamentos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (agendError) throw agendError;

      // Excluir assinaturas de planos
      const { error: assinError } = await supabase
        .from("assinaturas_planos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (assinError) throw assinError;

      // Excluir ajustes de caixa dos barbeiros
      const { error: ajustesError } = await supabase
        .from("ajustes_caixa_barbeiro")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (ajustesError) throw ajustesError;

      // Criar CSV de atendimentos
      const atendimentosCSV = [
        ["Data/Hora", "Cliente", "Barbeiro", "Serviço", "Valor", "Pago", "Forma Pagamento", "Desconto"].join(";"),
        ...(atendimentos || []).map((a: any) => [
          format(new Date(a.data_atendimento), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          a.cliente_nome,
          a.barbeiros?.nome || "-",
          a.servicos?.nome || "-",
          Number(a.valor).toFixed(2),
          a.pago ? "Sim" : "Não",
          a.forma_pagamento || "-",
          a.desconto_tipo || "-"
        ].join(";"))
      ].join("\n");

      // Criar CSV de vendas
      const vendasCSV = [
        ["Data/Hora", "Produto", "Barbeiro", "Quantidade", "Valor Unitário", "Valor Total", "Comissão", "Forma Pagamento"].join(";"),
        ...(vendas || []).map((v: any) => [
          format(new Date(v.data_venda), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          v.produto?.nome || "-",
          v.barbeiro?.nome || "Venda direta",
          v.quantidade,
          Number(v.valor_unitario).toFixed(2),
          Number(v.valor_total).toFixed(2),
          Number(v.valor_comissao || 0).toFixed(2),
          v.forma_pagamento
        ].join(";"))
      ].join("\n");

      // Calcular totais
      const totalAtendimentos = (atendimentos || [])
        .filter((a: any) => a.pago)
        .reduce((sum, a: any) => sum + Number(a.valor), 0);
      
      const totalVendas = (vendas || [])
        .reduce((sum, v: any) => sum + Number(v.valor_total), 0);

      const totalGeral = totalAtendimentos + totalVendas;

      // Criar relatório resumo
      const resumo = [
        "RESUMO FINANCEIRO",
        `Período: ${format(start, "dd/MM/yyyy", { locale: ptBR })} a ${format(end, "dd/MM/yyyy", { locale: ptBR })}`,
        "",
        `Total Atendimentos Pagos: ${formatBRL(totalAtendimentos)}`,
        `Total Vendas de Produtos: ${formatBRL(totalVendas)}`,
        `TOTAL GERAL: ${formatBRL(totalGeral)}`,
        "",
        `Quantidade de Atendimentos: ${atendimentos?.length || 0}`,
        `Quantidade de Vendas: ${vendas?.length || 0}`,
        "",
        "=" .repeat(50),
        "",
        "ATENDIMENTOS",
        atendimentosCSV,
        "",
        "=" .repeat(50),
        "",
        "VENDAS DE PRODUTOS",
        vendasCSV
      ].join("\n");

      // Download do arquivo
      const blob = new Blob([resumo], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `backup_${backupPeriod}_${format(now, "yyyyMMdd_HHmmss")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Backup exportado com sucesso! ${atendimentos?.length || 0} atendimentos e ${vendas?.length || 0} vendas`);
    } catch (error: any) {
      console.error("Erro ao exportar backup:", error);
      toast.error("Erro ao exportar backup");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    if (!deletePassword.trim()) {
      toast.error("Digite sua senha para confirmar");
      return;
    }

    setIsDeleting(true);

    try {
      // Verificar a senha do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Usuário não encontrado");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword
      });

      if (authError) {
        toast.error("Senha incorreta");
        return;
      }

      // Excluir notificações
      const { error: notifError } = await supabase
        .from("notificacoes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (notifError) throw notifError;

      // Excluir pagamentos
      const { error: pagError } = await supabase
        .from("pagamentos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (pagError) throw pagError;

      // Excluir retiradas
      const { error: retError } = await supabase
        .from("retiradas")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (retError) throw retError;

      // Excluir todos os atendimentos
      const { error: atendError } = await supabase
        .from("atendimentos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (atendError) throw atendError;

      // Excluir vendas de produtos
      const { error: vendasError } = await supabase
        .from("vendas_produtos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (vendasError) throw vendasError;

      toast.success("Dados excluídos com sucesso!");
      setDeletePassword("");
      setOpenDeleteData(false);
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["retiradas"] });
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["vendas_produtos"] });
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["assinaturas"] });
    } catch (error: any) {
      console.error("Erro ao excluir dados:", error);
      toast.error("Erro ao excluir dados");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h2>
          <p className="text-muted-foreground">Gerencie as configurações da barbearia</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp da Barbearia</CardTitle>
            <CardDescription>
              Número de contato para clientes (com DDD, apenas números)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 11999999999"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
              />
              <Button onClick={handleSaveWhatsapp}>Salvar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <CardTitle>Importar Dados</CardTitle>
            </div>
            <CardDescription>
              Cole o relatório no formato indicado para importar atendimentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={"Cole aqui o texto contendo RESUMO FINANCEIRO e a seção ATENDIMENTOS"}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="min-h-[200px]"
            />
            <div className="flex gap-2">
              <Button onClick={analyzeImport} disabled={analyzing || !importText.trim()}>Analisar</Button>
              <Button onClick={handleImportData} disabled={importing || parsedRows.length === 0}>
                {importing ? "Importando..." : `Importar ${parsedRows.length} atendimentos`}
              </Button>
            </div>
            {importSummary && (
              <div className="text-sm text-muted-foreground">
                <p>Total: {importSummary.total}</p>
                <p>Pagos: {importSummary.pagos}</p>
                <p>Valor Total Pago: {formatBRL(importSummary.valorTotal)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              <CardTitle>Backup de Dados</CardTitle>
            </div>
            <CardDescription>
              Exporte todos os atendimentos e vendas por período
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={backupPeriod} onValueChange={setBackupPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportBackup} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exportando..." : "Exportar Backup"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              O backup incluirá todos os atendimentos, vendas de produtos e um resumo financeiro do período selecionado em formato CSV.
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" />
                <CardTitle>Barbeiros</CardTitle>
              </div>
              <Dialog open={openNewBarber} onOpenChange={setOpenNewBarber}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Barbeiro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Barbeiro</DialogTitle>
                    <DialogDescription>Crie um novo barbeiro com acesso ao sistema</DialogDescription>
                  </DialogHeader>
                  <form id="barber-form" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="barber-name">Nome Completo</Label>
                      <Input
                        id="barber-name"
                        value={newBarber.name}
                        onChange={(e) => setNewBarber({ ...newBarber, name: e.target.value })}
                        placeholder="Nome do barbeiro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-email">Email</Label>
                      <Input
                        id="barber-email"
                        type="email"
                        value={newBarber.email}
                        onChange={(e) => setNewBarber({ ...newBarber, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-password">Senha</Label>
                      <Input
                        id="barber-password"
                        type="password"
                        value={newBarber.password}
                        onChange={(e) => setNewBarber({ ...newBarber, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-porcentagem">Porcentagem de Comissão (%)</Label>
                      <Input
                        id="barber-porcentagem"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue="50"
                        placeholder="50"
                      />
                    </div>
                  </form>
                  <DialogFooter>
                    <Button onClick={handleAddBarber} disabled={isSubmitting}>
                      {isSubmitting ? "Criando..." : "Criar Barbeiro"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>
              Gerencie os barbeiros e suas porcentagens de comissão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingBarbeiros ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : barbeiros.length === 0 ? (
              <p className="text-muted-foreground">Nenhum barbeiro cadastrado</p>
            ) : (
              barbeiros.map((barber, index) => (
                <div key={barber.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <UserCog className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{barber.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Comissão: {barber.porcentagem_comissao || 50}%
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBarber({
                              id: barber.id,
                              name: barber.nome,
                              email: '',
                              password: '',
                              porcentagem: Number(barber.porcentagem_comissao || 50),
                              userId: barber.user_id
                            });
                            setOpenEditBarber(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBarber(barber.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                <CardTitle>Serviços</CardTitle>
              </div>
              <Dialog open={openNewService} onOpenChange={setOpenNewService}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Serviço
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                    <DialogDescription>Preencha os dados do novo serviço</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-name">Nome do Serviço</Label>
                      <Input
                        id="service-name"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        placeholder="Ex: Corte + Barba"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-categoria">Categoria / Divisão (opcional)</Label>
                      <Input
                        id="service-categoria"
                        value={newService.categoria}
                        onChange={(e) => setNewService({ ...newService, categoria: e.target.value })}
                        placeholder="Ex: Cabelo, Barba, Especiais"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-price">Preço (R$)</Label>
                      <Input
                        id="service-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddService}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>
              Gerencie os serviços e valores oferecidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingServicos ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : servicos.length === 0 ? (
                <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
              ) : (
                servicos.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{service.nome}</p>
                      {service.categoria && (
                        <p className="text-xs text-primary/80 font-medium">
                          {service.categoria}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatBRL(service.preco)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingService({ 
                            id: service.id, 
                            name: service.nome, 
                            price: Number(service.preco),
                            categoria: service.categoria || ""
                          });
                          setOpenEditService(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            </div>
            <CardDescription>
              Ações irreversíveis que excluirão dados permanentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={openDeleteData} onOpenChange={setOpenDeleteData}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Notificações e Transações
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                  <DialogDescription>
                    Esta ação irá zerar os dados operacionais: notificações, pagamentos, retiradas, vendas de produtos, agendamentos, atendimentos e assinaturas.
                    Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm font-semibold text-destructive mb-2">
                      ⚠️ Aviso: Esta ação é irreversível!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Todos os registros de notificações e transações financeiras serão excluídos permanentemente.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Digite sua senha para confirmar</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Sua senha"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeletePassword("");
                      setOpenDeleteData(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteData}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Dialog open={openEditService} onOpenChange={setOpenEditService}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
              <DialogDescription>Atualize os dados do serviço</DialogDescription>
            </DialogHeader>
            {editingService && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-service-name">Nome do Serviço</Label>
                  <Input
                    id="edit-service-name"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-service-categoria">Categoria / Divisão (opcional)</Label>
                  <Input
                    id="edit-service-categoria"
                    value={editingService.categoria}
                    onChange={(e) => setEditingService({ ...editingService, categoria: e.target.value })}
                    placeholder="Ex: Cabelo, Barba, Especiais"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-service-price">Preço (R$)</Label>
                  <Input
                    id="edit-service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditService}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openEditBarber} onOpenChange={setOpenEditBarber}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Barbeiro</DialogTitle>
              <DialogDescription>Atualize os dados do barbeiro</DialogDescription>
            </DialogHeader>
            {editingBarber && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-barber-name">Nome Completo</Label>
                  <Input
                    id="edit-barber-name"
                    value={editingBarber.name}
                    onChange={(e) => setEditingBarber({ ...editingBarber, name: e.target.value })}
                    placeholder="Nome do barbeiro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-barber-email">Email</Label>
                  <Input
                    id="edit-barber-email"
                    type="email"
                    value={editingBarber.email}
                    onChange={(e) => setEditingBarber({ ...editingBarber, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-barber-password">Nova Senha (opcional)</Label>
                  <Input
                    id="edit-barber-password"
                    type="password"
                    value={editingBarber.password}
                    onChange={(e) => setEditingBarber({ ...editingBarber, password: e.target.value })}
                    placeholder="Deixe vazio para manter a atual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-barber-porcentagem">Porcentagem de Comissão (%)</Label>
                  <Input
                    id="edit-barber-porcentagem"
                    type="number"
                    min="0"
                    max="100"
                    value={editingBarber.porcentagem}
                    onChange={(e) => setEditingBarber({ ...editingBarber, porcentagem: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleEditBarber} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
