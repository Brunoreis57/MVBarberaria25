import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Chrome } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-24 h-24 bg-primary rounded-2xl flex items-center justify-center">
            <Smartphone className="w-12 h-12 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl">Instale o App MV Barbearia</CardTitle>
          <CardDescription className="text-lg mt-2">
            Tenha acesso rápido ao sistema direto do seu celular
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstallable ? (
            <div className="space-y-4">
              <Button 
                onClick={handleInstallClick} 
                className="w-full h-14 text-lg"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Instalar Agora
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Clique no botão acima para instalar o app no seu dispositivo
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <div className="flex items-start gap-3">
                  <Chrome className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">No Android (Chrome/Edge):</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Abra o menu do navegador (⋮)</li>
                      <li>Toque em "Adicionar à tela inicial" ou "Instalar app"</li>
                      <li>Confirme a instalação</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Smartphone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">No iPhone (Safari):</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Toque no botão de compartilhar (⎊)</li>
                      <li>Role e toque em "Adicionar à Tela de Início"</li>
                      <li>Toque em "Adicionar"</li>
                    </ol>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => navigate("/")} 
                variant="outline"
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>
          )}

          <div className="pt-6 border-t">
            <h4 className="font-semibold mb-3 text-center">Benefícios do App:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Acesso rápido direto da tela inicial
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Funciona mesmo sem internet (modo offline)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Carregamento mais rápido
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Experiência como um app nativo
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
