import { Calendar, DollarSign, Home, Scissors, Bell, Menu, Settings, LogOut, FileText, Moon, Sun, ShoppingBag, Package, Users, ClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const adminMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar },
  { title: "Atendimentos", url: "/atendimentos", icon: ClipboardList },
  { title: "Caixa", url: "/caixa", icon: DollarSign },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Produtos", url: "/produtos", icon: ShoppingBag },
  { title: "Planos", url: "/planos", icon: Package },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Notificações", url: "/notificacoes", icon: Bell },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

const barberMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar },
  { title: "Atendimentos", url: "/atendimentos", icon: ClipboardList },
  { title: "Caixa", url: "/caixa", icon: DollarSign },
  { title: "Meus Resultados", url: "/relatorios", icon: FileText },
  { title: "Notificações", url: "/notificacoes", icon: Bell },
];

export function MobileSidebar() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const menuItems = user?.role === "admin" ? adminMenuItems : barberMenuItems;

  const handleLogout = async () => {
    await signOut();
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-2">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">MV Barbearia</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-accent"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </NavLink>
          ))}
          
          <div className="mt-4 pt-4 border-t border-border space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-3 text-foreground hover:bg-accent"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-3 text-foreground hover:bg-accent"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
