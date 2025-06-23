import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const materials = [
  { id: "metal", name: "Metal" },
  { id: "vidro", name: "Vidro" },
  { id: "metal_vidro", name: "Metal e Vidro" },
];

const weightOptions = [
  { value: "10_20", label: "10kg a 20kg" },
  { value: "20_50", label: "20kg a 50kg" },
  { value: "50_100", label: "50kg a 100kg" },
  { value: "100_plus", label: "Mais de 100kg" },
];

export default function Schedule() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados para o formulário de agendamento
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedMaterials, setSelectedMaterials] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [useRegisteredAddress, setUseRegisteredAddress] = useState<boolean>(true);
  const [observations, setObservations] = useState<string>("");
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  
  // Dados da associação (simulando vindo da API)
  const association = {
    id: 1,
    name: "Associação dos Catadores de Material Reciclável . ASCAS",
  };
  
  // Função para lidar com o agendamento
  const handleScheduleCollection = () => {
    // Validação do formulário
    if (!date) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data para a coleta.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedMaterials) {
      toast({
        title: "Erro",
        description: "Por favor, selecione quais materiais serão coletados.",
        variant: "destructive",
      });
      return;
    }
    
    if (!weight) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o peso aproximado da sua separação.",
        variant: "destructive",
      });
      return;
    }
    
    // Simular o envio para API e redirecionar para a tela de agendamentos
    // Em um caso real, enviaríamos para a API primeiro e só depois redirecionaríamos
    toast({
      title: "Sucesso!",
      description: "Sua coleta foi agendada com sucesso.",
    });
    
    // Redirecionar para a página de agendamentos
    setLocation("/schedule/list");
  };
  
  // Renderizar o componente de calendário
  const renderCalendar = () => {
    if (!showCalendar) return null;
    
    return (
      <div className="mt-2 bg-white rounded-lg shadow-md p-3">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            setDate(date);
            setShowCalendar(false);
          }}
          locale={ptBR}
          className="rounded-md border"
        />
      </div>
    );
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
      
      <main className="flex-1 px-4 pt-4 pb-20">
        {/* Associação selecionada */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 shadow-sm">
          <p className="font-medium text-gray-800">{association.name}</p>
        </div>
        
        {/* Data da coleta */}
        <div className="mb-4">
          <label className="block text-gray-800 font-medium mb-2">Quando será sua coleta?</label>
          <div className="flex flex-col">
            <div className="grid grid-cols-7 text-center text-xs mb-2 text-gray-500">
              <span>Dom</span>
              <span>Seg</span>
              <span>Ter</span>
              <span>Qua</span>
              <span>Qui</span>
              <span>Sex</span>
              <span>Sáb</span>
            </div>
            <div 
              className="bg-gray-50 rounded-lg p-3 flex justify-between items-center cursor-pointer"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <span className="text-gray-600">
                {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
              </span>
              {showCalendar ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            {renderCalendar()}
          </div>
        </div>
        
        {/* Materiais a serem coletados */}
        <div className="mb-4">
          <label className="block text-gray-800 font-medium mb-2">
            Quais materiais serão coletados?
            <p className="text-xs font-normal text-gray-500 mt-1">
              *Essa empresa só realiza coletas de Metal e/ou Vidro
            </p>
          </label>
          <Select
            value={selectedMaterials}
            onValueChange={setSelectedMaterials}
          >
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder="Selecione uma ou mais opções" />
            </SelectTrigger>
            <SelectContent>
              {materials.map(material => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Peso aproximado */}
        <div className="mb-4">
          <label className="block text-gray-800 font-medium mb-2">
            Qual o peso aproximado da sua separação?
            <p className="text-xs font-normal text-gray-500 mt-1">
              *Essa empresa só realiza coletas a partir de 10kg
            </p>
          </label>
          <Select
            value={weight}
            onValueChange={setWeight}
          >
            <SelectTrigger className="bg-gray-50">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {weightOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Switch para usar endereço cadastrado */}
        <div className="flex items-center justify-between mb-4">
          <label htmlFor="address-switch" className="text-gray-800 font-medium">
            Utilizar endereço e contatos do cadastro
          </label>
          <Switch
            id="address-switch"
            checked={useRegisteredAddress}
            onCheckedChange={setUseRegisteredAddress}
          />
        </div>
        
        {/* Campo de observações */}
        <div className="mb-6">
          <label className="block text-gray-800 font-medium mb-2">
            Tem alguma observação?
          </label>
          <Textarea 
            placeholder="Comente sobre seus itens, horários para recebimento, etc..." 
            className="bg-gray-50 resize-none"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>
        
        {/* Botão de agendar coleta */}
        <button 
          className="w-full bg-[#2D9CDB] text-white py-3 rounded-lg font-medium shadow-sm hover:bg-[#2487c0] transition-colors"
          onClick={handleScheduleCollection}
        >
          Agendar coleta
        </button>
      </main>
      
      {/* Rodapé de navegação */}
      <FooterNavigation activePage="schedule" />
    </div>
  );
}