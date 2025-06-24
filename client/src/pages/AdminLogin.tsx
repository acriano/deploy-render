import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { API_CONFIG } from "../config";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [formData, setFormData] = useState({
    email: "", // Removido o preenchimento fixo para permitir qualquer email
    password: ""
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
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
      email?: string;
      password?: string;
    } = {};

    if (!formData.email) {
      newErrors.email = "Por favor, insira seu email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "Por favor, insira sua senha";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugInfo("");

    if (validateForm()) {
      try {
        setLoading(true);
        setDebugInfo("Tentando conectar ao servidor...");
        console.log('Tentando fazer login com:', { email: formData.email });

        // Usar a configuração centralizada
        const apiUrl = `${API_CONFIG.BASE_URL}/api/auth/admin-login`;
        setDebugInfo(`Conectando a ${apiUrl}...`);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        setDebugInfo(`Resposta recebida: Status ${response.status}`);
        console.log('Resposta do servidor:', {
          status: response.status,
          statusText: response.statusText
        });

        const data = await response.json();
        setDebugInfo(`Dados recebidos: ${JSON.stringify(data)}`);
        console.log('Dados da resposta:', data);

        if (response.ok) {
          // Verifica se o usuário é admin
          if (data.role !== 'admin') {
            setErrors({
              ...errors,
              general: "Acesso negado. Você não possui permissões de administrador."
            });
            return;
          }

          // Login bem-sucedido, salvar usuário logado em ambos os storages
          localStorage.setItem("recycleczs_admin_user", JSON.stringify(data));
          localStorage.setItem("recycleczs_current_user", JSON.stringify(data)); // Também salvar como usuário normal
          console.log('Login bem-sucedido:', data);
          setDebugInfo("Login bem-sucedido! Redirecionando para o painel administrativo...");

          // Redirecionar para o painel admin alternativo
          setLocation("/admin-dashboard");
        } else {
          console.error('Erro no login:', data);
          setDebugInfo(`Erro: ${data.error || "Erro desconhecido"}`);
          setErrors({
            ...errors,
            general: data.error || "Email ou senha incorretos"
          });
        }
      } catch (error) {
        console.error('Erro de conectividade:', error);
        setDebugInfo(`Erro de conexão: ${error instanceof Error ? error.message : String(error)}`);
        setErrors({
          ...errors,
          general: "Erro ao conectar com o servidor"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="font-sans bg-white min-h-screen flex flex-col">
      <header className="p-4">
        <button
          onClick={() => setLocation("/")}
          className="text-[#6CB33F]"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">Painel Administrativo</h1>
          <h2 className="text-2xl font-bold mb-8">Login de Administrador</h2>

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

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email de administrador"
                className={`w-full px-4 py-3 rounded-md border ${errors.email ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-4 relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Digite sua senha"
                className={`w-full px-4 py-3 rounded-md border ${errors.password ? "border-red-500" : "border-gray-300"}`}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-4 bg-[#6CB33F] text-white font-bold rounded-md"
              disabled={loading}
            >
              {loading ? "Processando..." : "Entrar"}
            </button>
          </form>

          <div className="text-center mt-4 text-sm text-gray-600">
            <p>Esta página é exclusiva para administradores do sistema.</p>
          </div>
        </div>
      </main>
    </div>
  );
} 