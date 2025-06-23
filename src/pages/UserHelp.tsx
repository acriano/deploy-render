import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { ArrowLeft, HelpCircle, Mail, Phone, MessageSquare } from "lucide-react";

export default function UserHelp() {
  const [, setLocation] = useLocation();
  
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
          <HelpCircle size={24} className="text-[#333333] mr-3" />
          <h1 className="text-xl font-bold">Ajuda</h1>
        </div>
        
        {/* Conteúdo da página de ajuda */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Como podemos ajudar?</h2>
          <p className="text-gray-600 mb-6">
            Se você tiver alguma dúvida ou precisar de assistência, entre em contato conosco por um dos canais abaixo:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <Mail className="text-[#F2994A] mr-3" size={20} />
              <div>
                <p className="font-medium">E-mail</p>
                <p className="text-gray-600 text-sm">suporte@reciclagem.com</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <Phone className="text-[#F2994A] mr-3" size={20} />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-gray-600 text-sm">(11) 9999-8888</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <MessageSquare className="text-[#F2994A] mr-3" size={20} />
              <div>
                <p className="font-medium">Chat</p>
                <p className="text-gray-600 text-sm">Disponível das 9h às 18h</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* FAQ - Perguntas frequentes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Perguntas frequentes</h2>
          
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-medium mb-2">Como agendar uma coleta?</h3>
              <p className="text-gray-600 text-sm">
                Para agendar uma coleta, acesse a aba "Agenda" no menu inferior, escolha uma associação, selecione a data e materiais para coleta.
              </p>
            </div>
            
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-medium mb-2">Como encontrar pontos de coleta próximos?</h3>
              <p className="text-gray-600 text-sm">
                Acesse a aba "Mapa" para visualizar todos os pontos de coleta próximos da sua localização.
              </p>
            </div>
            
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-medium mb-2">O que posso reciclar?</h3>
              <p className="text-gray-600 text-sm">
                Acesse a aba "Reciclagem" para ver informações detalhadas sobre todos os materiais que podem ser reciclados.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Rodapé de navegação */}
      <FooterNavigation />
    </div>
  );
}