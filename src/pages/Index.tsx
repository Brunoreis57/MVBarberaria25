import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const bgUrl = 
    "url('/barbershop-bg.jpg'), url('/barbershop-bg.png'), url('/barbershop-bg.webp'), url('/barbershop-bg.svg')";

  return (
    <div className="min-h-screen relative">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: bgUrl }}
      />
      <div className="absolute inset-0 bg-black/50" />
      <nav className="relative border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">MV Barbearia</span>
          </div>
          <Button onClick={() => navigate("/auth")} className="gap-2">
            Acessar Sistema
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <main className="relative container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            <span className="text-primary">MV Barbearia</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Corte, barba e cuidados masculinos premium
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/agendar")} 
              className="text-lg bg-cyan-700 hover:bg-cyan-800 text-white"
            >
              Fazer Agendamento
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
