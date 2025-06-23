import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Armazenar o evento beforeinstallprompt para uso posterior
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setShowBanner(true);
    };

    // Verificar se o app já está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(false);
      }
    };

    // Verificar se há o evento em sessões anteriores salvo no localStorage
    const checkStoredInstallEvent = () => {
      const installBannerShown = localStorage.getItem('installBannerDismissed');
      if (installBannerShown) {
        const dismissedTime = parseInt(installBannerShown, 10);
        // Mostrar banner novamente após 7 dias
        if (Date.now() - dismissedTime > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem('installBannerDismissed');
        } else {
          setShowBanner(false);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setShowBanner(false));
    
    checkIfInstalled();
    checkStoredInstallEvent();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => setShowBanner(false));
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    // Mostrar o prompt de instalação nativo
    await installPrompt.prompt();
    
    // Aguardar a escolha do usuário
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou instalar o app');
      setShowBanner(false);
    } else {
      console.log('Usuário recusou instalar o app');
    }
    
    // Limpar o prompt para não mostrar novamente
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Salvar timestamp de quando o banner foi fechado
    localStorage.setItem('installBannerDismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-3">
          <img src="/favicon.svg" alt="RecycleCZS Logo" className="w-8 h-8" />
        </div>
        <div>
          <p className="font-medium">Instalar aplicativo</p>
          <p className="text-sm text-gray-600">Adicione na tela inicial para acesso rápido</p>
        </div>
      </div>
      <div className="flex items-center">
        <button 
          onClick={handleInstall}
          className="bg-[#6CB33F] text-white px-4 py-2 rounded-md mr-2 flex items-center"
        >
          <Download size={18} className="mr-1" />
          Instalar
        </button>
        <button 
          onClick={handleDismiss} 
          className="text-gray-500 p-2"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt; 