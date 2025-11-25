import { Calendar, DollarSign, Home, Scissors, Bell, Settings, FileText, LogOut, ShoppingBag, Package, Moon, Sun, Users, ClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

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

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isCollapsed = state === "collapsed";
  
  const menuItems = user?.role === "admin" ? adminMenuItems : barberMenuItems;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Scissors className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-sidebar-foreground">MV Barbearia</span>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!isCollapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </Sidebar>
  );
}
