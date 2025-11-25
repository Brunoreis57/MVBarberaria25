import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, DollarSign, Calendar, Info } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Notificacoes = () => {
  const { notificacoes, isLoading, marcarComoLida } = useNotificacoes();

  const handleNotificationClick = (id: string, lida: boolean) => {
    if (!lida) {
      marcarComoLida.mutate(id);
    }
  };

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "retirada":
        return <DollarSign className="w-5 h-5 text-orange-600" />;
      case "agendamento":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-green-600" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Notificações</h2>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Notificações</h2>
            <p className="text-muted-foreground">Acompanhe todas as atividades importantes</p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Bell className="w-4 h-4" />
            {notificacoes.filter((n) => !n.lida).length} novas
          </Badge>
        </div>

        <div className="space-y-3">
          {notificacoes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma notificação ainda</p>
              </CardContent>
            </Card>
          ) : (
            notificacoes.map((notificacao) => (
              <Card
                key={notificacao.id}
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  !notificacao.lida ? "border-primary/50 bg-primary/5" : ""
                }`}
                onClick={() => handleNotificationClick(notificacao.id, notificacao.lida)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notificacao.tipo === "retirada"
                          ? "bg-orange-100"
                          : notificacao.tipo === "agendamento"
                          ? "bg-blue-100"
                          : "bg-green-100"
                      }`}
                    >
                      {getNotificationIcon(notificacao.tipo)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{notificacao.titulo}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notificacao.descricao}
                          </p>
                        </div>
                        {!notificacao.lida && (
                          <Badge className="bg-primary text-primary-foreground">Nova</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notificacao.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notificacoes;
