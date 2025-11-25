import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";
import Atendimentos from "./pages/Atendimentos";
import AgendamentoPublico from "./pages/AgendamentoPublico";
import Caixa from "./pages/Caixa";
import Relatorios from "./pages/Relatorios";
import Notificacoes from "./pages/Notificacoes";
import Configuracoes from "./pages/Configuracoes";
import Produtos from "./pages/Produtos";
import Planos from "./pages/Planos";
import Clientes from "./pages/Clientes";
import Install from "./pages/Install";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agendamentos" element={<Agendamentos />} />
            <Route path="/atendimentos" element={<Atendimentos />} />
            <Route path="/agendar" element={<AgendamentoPublico />} />
            <Route path="/caixa" element={<Caixa />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/install" element={<Install />} />
            
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/notificacoes" element={<Notificacoes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
