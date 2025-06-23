import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { ArrowLeft, Bell } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface NotificationOptionProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// Componente de opção de notificação
function NotificationOption({ label, checked, onChange }: NotificationOptionProps) {
  return (
    <div className="flex items-center space-x-3 py-3 border-b border-gray-100">
      <div className="flex items-center flex-1">
        <label className="text-gray-700 cursor-pointer flex-1">{label}</label>
      </div>
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className="h-5 w-5 border-gray-300 text-[#F2994A]"
      />
    </div>
  );
}

export default function UserNotifications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados para as opções de notificação
  const [notifications, setNotifications] = useState({
    municipalCollections: true,
    scheduledCollections: true,
    platformUpdates: true,
    generalNotices: true
  });
  
  // Função para atualizar uma opção de notificação
  const updateNotification = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: "Configuração salva",
      description: `Suas preferências de notificação foram atualizadas.`,
    });
  };
  
  return (
    <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      <main className="flex-1 px-4 pt-4 pb-20">
        {/* Botão voltar */}
        <button 
          onClick={() => setLocation('/')} 
          className="text-[#F2994A] mb-6"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        
        {/* Título da página */}
        <div className="flex items-center mb-6">
          <Bell size={24} className="text-[#333333] mr-3" />
          <h1 className="text-xl font-bold">Notificações</h1>
        </div>
        
        {/* Configurações de notificações */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">Permitir que o app envie notificações como:</p>
          
          <div className="space-y-1">
            <NotificationOption
              label="Lembretes para coletas municipais"
              checked={notifications.municipalCollections}
              onChange={(checked) => updateNotification("municipalCollections", checked)}
            />
            
            <NotificationOption
              label="Lembretes para coletas agendadas"
              checked={notifications.scheduledCollections}
              onChange={(checked) => updateNotification("scheduledCollections", checked)}
            />
            
            <NotificationOption
              label="Alterações e/ou atualizações da plataforma"
              checked={notifications.platformUpdates}
              onChange={(checked) => updateNotification("platformUpdates", checked)}
            />
            
            <NotificationOption
              label="Avisos gerais"
              checked={notifications.generalNotices}
              onChange={(checked) => updateNotification("generalNotices", checked)}
            />
          </div>
        </div>
      </main>
      
      {/* Rodapé de navegação */}
      <FooterNavigation />
    </div>
  );
}