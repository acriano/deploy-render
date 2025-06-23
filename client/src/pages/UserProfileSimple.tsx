import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { ArrowLeft, User, Phone, Mail, Lock, MapPin, Pencil, CheckCircle, Bell, HelpCircle, LogOut } from "lucide-react";

export default function UserProfileSimple() {
  const [, setLocation] = useLocation();

  // Interface para dados do usuário
  interface UserData {
    name: string;
    phone: string;
    email: string;
    password: string;
    cep: string;
    address: string;
    number: string;
    complement: string;
  }

  // Inicializa com valores padrão
  const [userData, setUserData] = useState<UserData>({
    name: "",
    phone: "",
    email: "",
    password: "••••••••••", // Sempre exibir como mascarado
    cep: "",
    address: "",
    number: "",
    complement: ""
  });

  // Estado para controle de erros
  const [errors, setErrors] = useState<Partial<Record<keyof UserData, string>>>({});

  // Carregar dados do usuário atual do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("recycleczs_current_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          name: parsedUser.name || "",
          phone: parsedUser.phone || "",
          email: parsedUser.email || "",
          password: "••••••••••", // Sempre exibir como mascarado
          cep: parsedUser.cep || "",
          address: parsedUser.address || "",
          number: parsedUser.number || "",
          complement: parsedUser.complement || ""
        });
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    }
  }, []);

  // Estado para controlar quais campos estão sendo editados
  const [editing, setEditing] = useState({
    name: false,
    phone: false,
    email: false,
    password: false,
    cep: false,
    number: false,
    complement: false
  });

  // Valores temporários durante a edição
  const [tempValues, setTempValues] = useState({ ...userData });

  // Atualizar os valores temporários quando userData mudar
  useEffect(() => {
    setTempValues({ ...userData });
  }, [userData]);

  // Função para validar campos
  const validateField = (field: keyof UserData, value: string): string => {
    switch (field) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'E-mail inválido';
        }
        break;
      case 'phone':
        if (!/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(value)) {
          return 'Telefone inválido';
        }
        break;
      case 'cep':
        if (!/^\d{5}-?\d{3}$/.test(value)) {
          return 'CEP inválido';
        }
        break;
    }
    return '';
  };

  // Função para alternar modo de edição
  const toggleEdit = (field: keyof typeof editing) => {
    if (editing[field]) {
      // Validar campo antes de salvar
      const error = validateField(field as keyof UserData, tempValues[field as keyof typeof tempValues]);
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }));
        return;
      }

      // Se estiver salvando e validação passou, atualiza os dados
      const updatedUserData = {
        ...userData,
        [field]: tempValues[field as keyof typeof tempValues]
      };

      setUserData(updatedUserData);
      setErrors(prev => ({ ...prev, [field]: '' }));

      // Atualizar localStorage com os novos dados
      try {
        const storedUser = localStorage.getItem("recycleczs_current_user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const updatedUser = {
            ...parsedUser,
            [field]: field === 'password' ? tempValues.password : tempValues[field as keyof typeof tempValues]
          };
          localStorage.setItem("recycleczs_current_user", JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error("Erro ao atualizar dados do usuário:", error);
        setErrors(prev => ({ ...prev, [field]: 'Erro ao salvar dados' }));
      }
    } else {
      // Se estiver começando a editar, reinicia o valor temporário
      setTempValues(prev => ({
        ...prev,
        [field]: userData[field as keyof typeof userData]
      }));
    }

    setEditing(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Função para atualizar valores temporários
  const updateTempValue = (field: keyof typeof tempValues, value: string) => {
    setTempValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para renderizar um campo editável
  const renderEditableField = (
    label: string,
    field: keyof typeof editing,
    type: string = "text",
    icon?: React.ReactNode
  ) => {
    return (
      <div className="mb-5">
        <label className="block text-gray-700 font-medium mb-2">{label}</label>
        <div className="relative">
          <div className="relative">
            <input
              type={type}
              value={editing[field] ? tempValues[field as keyof typeof tempValues] : userData[field as keyof typeof userData]}
              onChange={(e) => updateTempValue(field as keyof typeof tempValues, e.target.value)}
              disabled={!editing[field]}
              className={`w-full px-4 py-2 rounded-md ${editing[field] ? 'border-[#F2994A]' : 'bg-gray-100 border-gray-200'} border ${errors[field] ? 'border-red-500' : ''}`}
            />
            {errors[field] && (
              <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
            )}
          </div>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F2994A]"
            onClick={() => toggleEdit(field)}
            aria-label={editing[field] ? "Salvar" : "Editar"}
          >
            {editing[field] ? <CheckCircle size={18} /> : <Pencil size={18} />}
          </button>
        </div>
      </div>
    );
  };

  // Função para fazer logout
  const handleLogout = () => {
    localStorage.removeItem("recycleczs_current_user");
    setLocation('/welcome');
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
        <div className="space-y-2">
          {renderEditableField("Nome", "name")}
          {renderEditableField("Telefone", "phone", "tel")}
          {renderEditableField("E-mail", "email", "email")}
          {renderEditableField("Senha", "password", "password")}
          {renderEditableField("CEP", "cep")}

          <div className="py-2">
            <label className="block text-gray-700 font-medium mb-2">Endereço</label>
            <p className="text-gray-600 p-2 bg-gray-100 rounded-md">
              {userData.address ?
                `${userData.address}${userData.number ? `, ${userData.number}` : ''}${userData.complement ? ` - ${userData.complement}` : ''}` :
                'Endereço não informado'
              }
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderEditableField("Número", "number")}
            {renderEditableField("Complemento", "complement")}
          </div>
        </div>

        {/* Navegação para outras páginas */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => setLocation('/user/notifications')}
            className="w-full py-3 px-4 flex items-center text-[#333333] bg-gray-100 rounded-md"
          >
            <Bell size={20} className="text-[#F2994A] mr-3" />
            <span>Notificações</span>
          </button>

          <button
            onClick={() => setLocation('/user/help')}
            className="w-full py-3 px-4 flex items-center text-[#333333] bg-gray-100 rounded-md"
          >
            <HelpCircle size={20} className="text-[#F2994A] mr-3" />
            <span>Ajuda</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 flex items-center text-[#333333] bg-gray-100 rounded-md"
          >
            <LogOut size={20} className="text-[#F2994A] mr-3" />
            <span>Sair</span>
          </button>
        </div>
      </main>

      {/* Rodapé de navegação */}
      <FooterNavigation />
    </div>
  );
}