import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { API_CONFIG } from "../config";

export default function Register2() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    phone: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    acceptNotifications: true
  });
  const [errors, setErrors] = useState<{
    phone?: string;
    cep?: string;
    address?: string;
    number?: string;
    general?: string;
  }>({});
  const [debugInfo, setDebugInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Verifica se existem dados temporários do passo 1
  useEffect(() => {
    const tempData = localStorage.getItem("recycleczs_register_temp");
    if (!tempData) {
      // Se não houver dados temporários, redireciona para o passo 1
      setLocation("/register");
    }
  }, [setLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // Para checkbox usamos o 'checked', para outros inputs usamos 'value'
    const inputValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: inputValue
    });

    // Limpar erros quando o usuário começa a digitar
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const validateForm = () => {
    const newErrors: {
      phone?: string;
      cep?: string;
      address?: string;
      number?: string;
    } = {};

    if (!formData.phone.trim()) {
      newErrors.phone = "Por favor, insira seu telefone";
    } else if (!/^\(\d{2}\) \d \d{4}-\d{4}$/.test(formData.phone) &&
      !/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Telefone inválido";
    }

    if (!formData.cep.trim()) {
      newErrors.cep = "Por favor, insira seu CEP";
    } else if (!/^\d{5}-\d{3}$/.test(formData.cep) &&
      !/^\d{8}$/.test(formData.cep.replace(/\D/g, ''))) {
      newErrors.cep = "CEP inválido";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Por favor, insira seu endereço";
    }

    if (!formData.number.trim()) {
      newErrors.number = "Por favor, insira o número";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não for dígito
    const digits = value.replace(/\D/g, '');

    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 3) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
    } else if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else {
      // Limita a 11 dígitos
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const formatCep = (value: string) => {
    // Remove tudo que não for dígito
    const digits = value.replace(/\D/g, '');

    if (digits.length <= 5) {
      return digits;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhone(e.target.value);
    setFormData({
      ...formData,
      phone: formattedValue
    });

    if (errors.phone) {
      setErrors({
        ...errors,
        phone: undefined
      });
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCep(e.target.value);
    setFormData({
      ...formData,
      cep: formattedValue
    });

    if (errors.cep) {
      setErrors({
        ...errors,
        cep: undefined
      });
    }

    // Buscar o endereço quando o CEP tiver 8 dígitos (9 com o hífen)
    if (formattedValue.length === 9) {
      fetchAddressByCep(formattedValue);
    }
  };

  // Função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    if (!cep || cep.length < 8) return;

    try {
      // Remover caracteres não numéricos
      const numericCep = cep.replace(/\D/g, '');

      // Verificar se tem 8 dígitos
      if (numericCep.length !== 8) return;

      // Buscar o endereço usando a API ViaCEP
      const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setErrors(prev => ({
          ...prev,
          cep: "CEP não encontrado"
        }));
        return;
      }

      // Atualizar o campo de endereço
      setFormData(prev => ({
        ...prev,
        address: data.logradouro ? `${data.logradouro}, ${data.bairro}, ${data.localidade}-${data.uf}` : ""
      }));

    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugInfo("");
    setLoading(true);

    if (validateForm()) {
      try {
        setDebugInfo("Processando dados do formulário...");
        // Obter dados do passo 1
        const tempData = JSON.parse(localStorage.getItem("recycleczs_register_temp") || "");
        setDebugInfo("Dados temporários recuperados do localStorage");

        // Combinar dados dos dois passos no formato correto para a API
        const userData = {
          username: tempData.email.split('@')[0], // Criar username a partir do email
          password: tempData.password,
          name: tempData.name,
          email: tempData.email,
          phone: formData.phone,
          role: "user"
        };

        console.log('Enviando dados do usuário para o servidor:', {
          ...userData,
          password: '***' // Ocultar senha no log
        });
        setDebugInfo("Enviando dados para o servidor...");

        // Enviar dados para a API (usar URL completa para garantir que vai para o endpoint correto)
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        console.log('Status da resposta:', response.status);
        setDebugInfo(`Resposta recebida: Status ${response.status}`);

        const responseData = await response.json();
        console.log('Resposta da API:', responseData);
        setDebugInfo(`Dados da resposta: ${JSON.stringify(responseData).substring(0, 100)}...`);

        if (!response.ok) {
          throw new Error(responseData.error || 'Erro ao criar usuário');
        }

        // Limpar dados temporários
        localStorage.removeItem("recycleczs_register_temp");
        setDebugInfo("Cadastro concluído com sucesso!");

        // Redirecionar para login
        setLocation("/register-success");
      } catch (error) {
        console.error("Erro ao salvar usuário:", error);
        setDebugInfo(`Erro: ${error instanceof Error ? error.message : String(error)}`);
        setErrors({
          ...errors,
          general: error instanceof Error ? error.message : "Erro ao salvar o cadastro. Tente novamente."
        });
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setDebugInfo("Formulário inválido. Verifique os campos destacados.");
    }
  };

  return (
    <div className="font-sans bg-white min-h-screen flex flex-col">
      <header className="p-4">
        <button
          onClick={() => setLocation("/register")}
          className="text-[#6CB33F]"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">Olá!</h1>
          <h2 className="text-2xl font-bold mb-8">Vamos começar?</h2>

          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.general}
            </div>
          )}

          {debugInfo && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-xs">
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="Telefone"
                className={`w-full px-4 py-3 rounded-md border ${errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleCepChange}
                placeholder="CEP"
                maxLength={9}
                className={`w-full px-4 py-3 rounded-md border ${errors.cep ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.cep && (
                <p className="text-red-500 text-sm mt-1">{errors.cep}</p>
              )}
            </div>

            {/* Campo de endereço */}
            <div>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Endereço"
                className={`w-full px-4 py-3 rounded-md border ${errors.address ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {formData.address && (
                <p className="text-gray-500 text-xs mt-1">
                  Endereço preenchido automaticamente. Você pode editar se necessário.
                </p>
              )}
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  placeholder="Número"
                  className={`w-full px-4 py-3 rounded-md border ${errors.number ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.number && (
                  <p className="text-red-500 text-sm mt-1">{errors.number}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  id="complement"
                  name="complement"
                  value={formData.complement}
                  onChange={handleInputChange}
                  placeholder="Complemento"
                  className="w-full px-4 py-3 rounded-md border border-gray-300"
                />
              </div>
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="acceptNotifications"
                name="acceptNotifications"
                checked={formData.acceptNotifications}
                onChange={handleInputChange}
                className="h-5 w-5 text-[#6CB33F] border-gray-300 rounded"
              />
              <label
                htmlFor="acceptNotifications"
                className="ml-2 block text-sm text-gray-700"
              >
                Aceito receber notificações do app
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#6CB33F] text-white rounded-md font-medium mt-6"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Finalizar Cadastro'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}