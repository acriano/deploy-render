import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { useToast } from "@/hooks/use-toast";

// Interface para os dados de coleta agendada
interface ScheduledCollection {
  id: number;
  associationName: string;
  date: string;
  material: string;
}

export default function ScheduleCancel() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [collection, setCollection] = useState<ScheduledCollection | null>(null);
  
  // Simular busca dos dados
  useEffect(() => {
    // Em uma aplicação real, teríamos uma chamada API aqui
    const collectionData: ScheduledCollection = {
      id: parseInt(id as string, 10),
      associationName: "Associação dos Catadores de Material Reciclável . ASCAS",
      date: "01/04",
      material: "Vidro"
    };
    
    setCollection(collectionData);
  }, [id]);
  
  // Função para lidar com o cancelamento
  const handleCancelCollection = () => {
    // Em uma aplicação real, teríamos uma chamada API aqui
    toast({
      title: "Processando...",
      description: "Cancelando seu agendamento.",
    });
    
    // Simular tempo de processamento
    setTimeout(() => {
      setLocation("/schedule/success");
    }, 1000);
  };
  
  // Função para lidar com o reagendamento
  const handleReschedule = () => {
    setLocation("/schedule");
  };
  
  if (!collection) {
    return (
      <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6FCF97]"></div>
        </main>
        <FooterNavigation activePage="schedule" />
      </div>
    );
  }
  
  return (
    <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      <main className="flex-1 px-4 pt-10 pb-20 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-center mb-8">
          Tem certeza que deseja cancelar este agendamento?
        </h1>
        
        <div className="bg-gray-50 rounded-xl p-4 w-full mb-8 shadow-sm">
          <h2 className="font-medium text-gray-800 mb-2">{collection.associationName}</h2>
          <p className="text-[#F2994A] font-medium">
            {collection.date} - {collection.material}
          </p>
        </div>
        
        <div className="w-full space-y-4">
          <button 
            className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
            onClick={handleCancelCollection}
          >
            Cancelar coleta
          </button>
          
          <button 
            className="w-full border border-[#2D9CDB] text-[#2D9CDB] py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            onClick={handleReschedule}
          >
            Reagendar
          </button>
        </div>
      </main>
      
      {/* Rodapé de navegação */}
      <FooterNavigation activePage="schedule" />
    </div>
  );
}