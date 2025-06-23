import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { Check } from "lucide-react";

export default function ScheduleSuccess() {
  const [, setLocation] = useLocation();
  
  // Função para retornar à home
  const handleGoHome = () => {
    setLocation("/");
  };
  
  return (
    <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      <main className="flex-1 px-4 pt-10 pb-20 flex flex-col items-center justify-center">
        <div className="mb-6 bg-green-100 p-4 rounded-full">
          <Check size={40} className="text-[#6FCF97]" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-10">
          Agendamento cancelado com sucesso!
        </h1>
        
        <button 
          className="w-full max-w-xs border border-[#6FCF97] text-[#6FCF97] py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
          onClick={handleGoHome}
        >
          Ir para a home
        </button>
      </main>
      
      {/* Rodapé de navegação */}
      <FooterNavigation activePage="schedule" />
    </div>
  );
}