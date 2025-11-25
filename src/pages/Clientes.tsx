import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, Calendar, Plus, Pencil, Trash2, Search, Upload, Scissors } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useClientes } from "@/hooks/useClientes";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Clientes = () => {
  const queryClient = useQueryClient();
  const { data: clientes, isLoading } = useClientes();
  const { data: atendimentos } = useAtendimentos();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    data_aniversario: "",
  });
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const handleEdit = (cliente: any) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || "",
      data_aniversario: cliente.data_aniversario || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      toast.success("Cliente excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir cliente");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCliente) {
        const { error } = await supabase
          .from("clientes")
          .update({
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email || null,
            data_aniversario: formData.data_aniversario || null,
          })
          .eq("id", editingCliente.id);

        if (error) throw error;
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("clientes").insert({
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email || null,
          data_aniversario: formData.data_aniversario || null,
        });

        if (error) throw error;
        toast.success("Cliente criado com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setDialogOpen(false);
      setEditingCliente(null);
      setFormData({ nome: "", telefone: "", email: "", data_aniversario: "" });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar cliente");
    }
  };

  const filteredClientes = clientes?.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  const cortesPorCliente: Record<string, number> = (atendimentos || []).reduce((acc: Record<string, number>, a: any) => {
    const nome = (a.cliente_nome || "").trim();
    if (!nome) return acc;
    acc[nome] = (acc[nome] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h2>
            <p className="text-muted-foreground">Gerencie todos os clientes</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </Button>
            <Button onClick={() => setImportOpen(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Importar Dados
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando clientes...</p>
          ) : filteredClientes && filteredClientes.length > 0 ? (
            filteredClientes.map((cliente: any) => (
              <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">
                            {cliente.nome}
                          </h3>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {cliente.telefone}
                        </div>
                        {cliente.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {cliente.email}
                          </div>
                        )}
                        {cliente.data_aniversario && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Aniversário: {format(new Date(cliente.data_aniversario + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Scissors className="w-4 h-4" />
                          Cortes: {cortesPorCliente[cliente.nome] || 0}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(cliente)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteClick(cliente.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingCliente(null);
          setFormData({ nome: "", telefone: "", email: "", data_aniversario: "" });
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Nome completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(11) 98765-4321"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_aniversario">Data de Aniversário</Label>
              <Input
                id="data_aniversario"
                type="date"
                value={formData.data_aniversario}
                onChange={(e) => setFormData({ ...formData, data_aniversario: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCliente ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(open) => {
        setImportOpen(open);
        if (!open) {
          setImportText("");
          setParsedRows([]);
        }
      }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Importar Clientes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-text">Colar dados</Label>
              <Textarea
                id="import-text"
                placeholder="Nome;Telefone;Email;Data de Aniversário\nJoão Silva;11987654321;joao@email.com;12/05/1990"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[180px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const lines = importText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
                  if (lines.length === 0) {
                    setParsedRows([]);
                    return;
                  }
                  const header = lines[0].toLowerCase();
                  const hasHeader = ["nome", "telefone"].some((h) => header.includes(h));
                  const body = hasHeader ? lines.slice(1) : lines;
                  const rows = body.map((line) => {
                    const parts = line.split(/;|\,|\t/).map((p) => p.trim());
                    const nome = parts[0] || "";
                    const telefone = parts[1] || "";
                    const email = parts[2] || "";
                    const d = parts[3] || "";
                    let data_aniversario = "";
                    if (d) {
                      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
                        const [dd, mm, yyyy] = d.split("/");
                        data_aniversario = `${yyyy}-${mm}-${dd}`;
                      } else if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
                        data_aniversario = d;
                      }
                    }
                    return { nome, telefone, email: email || null, data_aniversario: data_aniversario || null };
                  }).filter((r) => r.nome && r.telefone);
                  setParsedRows(rows);
                }}
                disabled={!importText.trim()}
              >
                Analisar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (parsedRows.length === 0) return;
                    setImporting(true);
                    const { error } = await supabase.from("clientes").insert(parsedRows);
                    if (error) throw error;
                    toast.success("Clientes importados com sucesso!");
                    queryClient.invalidateQueries({ queryKey: ["clientes"] });
                    setImportOpen(false);
                  } catch (e: any) {
                    toast.error("Erro ao importar clientes");
                    console.error(e);
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={parsedRows.length === 0 || importing}
              >
                {importing ? "Importando..." : `Importar ${parsedRows.length}`}
              </Button>
            </div>
            {parsedRows.length > 0 && (
              <p className="text-sm text-muted-foreground">Prontos para importar: {parsedRows.length}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Clientes;
