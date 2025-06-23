import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { ArrowLeft, Pencil, CheckCircle, User, Phone, Mail, Lock, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface EditableFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  type?: string;
  onSave: (newValue: string) => void;
  autoCompleteField?: string;
}

// Componente de campo editável
function EditableField({ 
  label, 
  value, 
  icon, 
  type = "text", 
  onSave,
  autoCompleteField = "off"
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const { toast } = useToast();
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Salvar
      onSave(inputValue);
      toast({
        title: "Campo atualizado",
        description: `${label} atualizado com sucesso.`,
      });
    }
    setIsEditing(!isEditing);
  };
  
  return (
    <div className="mb-6">
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <div className="relative">
        <Input
          type={type}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!isEditing}
          className="pr-10 bg-gray-100 border-gray-200"
          autoComplete={autoCompleteField}
        />
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F2994A]"
          onClick={handleEditToggle}
          aria-label={isEditing ? "Salvar" : "Editar"}
        >
          {isEditing ? <CheckCircle size={18} /> : <Pencil size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Dados do usuário simulados
  const [userData, setUserData] = useState({
    phone: "+55 (11) 9 4896-8416",
    email: "maria.gomes@gmail.com",
    password: "••••••••••",
    cep: "08331-100",
    address: "Rua Osvaldo Camargo Gartner",
    number: "200",
    complement: "Apto 101"
  });
  
  // Função para atualizar os dados do usuário
  const updateUserData = (field: keyof typeof userData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
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
          <User size={24} className="text-[#333333] mr-3" />
          <h1 className="text-xl font-bold">Meus dados</h1>
        </div>
        
        {/* Formulário de dados */}
        <form className="space-y-2">
          <EditableField
            label="Telefone"
            value={userData.phone}
            icon={<Phone size={18} />}
            onSave={(value) => updateUserData("phone", value)}
            autoCompleteField="tel"
          />
          
          <EditableField
            label="E-mail"
            value={userData.email}
            icon={<Mail size={18} />}
            type="email"
            onSave={(value) => updateUserData("email", value)}
            autoCompleteField="email"
          />
          
          <EditableField
            label="Senha"
            value={userData.password}
            icon={<Lock size={18} />}
            type="password"
            onSave={(value) => updateUserData("password", value)}
            autoCompleteField="new-password"
          />
          
          <EditableField
            label="CEP"
            value={userData.cep}
            icon={<MapPin size={18} />}
            onSave={(value) => updateUserData("cep", value)}
          />
          
          <div className="py-2">
            <p className="text-gray-600">{userData.address}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <EditableField
              label="Número"
              value={userData.number}
              onSave={(value) => updateUserData("number", value)}
            />
            
            <EditableField
              label="Complemento"
              value={userData.complement}
              onSave={(value) => updateUserData("complement", value)}
            />
          </div>
        </form>
      </main>
      
      {/* Rodapé de navegação */}
      <FooterNavigation />
    </div>
  );
}