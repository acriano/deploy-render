import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { ArrowLeft } from "lucide-react";

// Interface para os dados de coleta agendada
interface ScheduledCollection {
  id: number;
  associationName: string;
  date: string;
  material: string;
  message: string;
}

export default function ScheduleList() {
  const [, setLocation] = useLocation();
  const [selectedCollection, setSelectedCollection] = useState<ScheduledCollection | null>(null);
  
  // Dados simulados de coleta agendada
  const scheduledCollections: ScheduledCollection[] = [
    {
      id: 1,
      associationName: "Associação dos Catadores de Material Reciclável . ASCAS",
      date: "01/04",
      material: "Vidro",
      message: "*Deixe seus resíduos recicláveis prontos para retirada e fique atento ao seu telefone."
    }
  ];
  
  // Função para lidar com o cancelamento
  const handleCancelRequest = (collection: ScheduledCollection) => {
    setSelectedCollection(collection);
    setLocation(`/schedule/cancel/${collection.id}`);
  };
  
  // Função para lidar com o reagendamento
  const handleRescheduleRequest = () => {
    setLocation("/schedule");
  };
  
  return (
    <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
      {/* Header */}
      <div className="relative">
        <Header />
        <button 
          onClick={() => setLocation('/')} 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F2994A]"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
      </div>
      
      <main className="flex-1 px-4 pt-6 pb-20">
        <h1 className="text-2xl font-bold mb-4">
          Você possui <span className="text-[#F2994A]">{scheduledCollections.length}</span> coleta agendada
        </h1>
        
        {scheduledCollections.map(collection => (
          <div key={collection.id} className="bg-gray-50 rounded-xl p-4 mb-6 shadow-sm">
            <h2 className="font-medium text-gray-800 mb-2">{collection.associationName}</h2>
            <p className="text-[#F2994A] font-medium mb-2">
              {collection.date} - {collection.material}
            </p>
            <p className="text-sm text-gray-600 mb-4">{collection.message}</p>
            
            <div className="flex gap-3">
              <button 
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md font-medium hover:bg-red-600 transition-colors"
                onClick={() => handleCancelRequest(collection)}
              >
                Cancelar coleta
              </button>
              <button 
                className="flex-1 border border-[#2D9CDB] text-[#2D9CDB] py-2 px-4 rounded-md font-medium hover:bg-blue-50 transition-colors"
                onClick={handleRescheduleRequest}
              >
                Reagendar
              </button>
            </div>
          </div>
        ))}
        
        <div className="mt-8">
          <p className="text-gray-700 font-medium mb-4">
            Acesse o mapa para agendar novas coletas a domicílio
          </p>
          <button 
            className="w-full border border-[#6FCF97] text-[#6FCF97] py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
            onClick={() => setLocation('/map')}
          >
            Ir para o mapa
          </button>
        </div>
      </main>
      
      {/* Rodapé de navegação */}
      <FooterNavigation activePage="schedule" />
    </div>
  );
}