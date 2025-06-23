import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [formData, setFormData] = useState({
    email: "",
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
    setLoading(true);

    try {
      console.log('=== Iniciando processo de login ===');
      console.log('Email:', formData.email);
      console.log('É email de admin?', formData.email.endsWith('@recycleczs.com'));

      const isAdminEmail = formData.email.endsWith('@recycleczs.com');
      const response = isAdminEmail ? 
        await api.adminLogin(formData.email, formData.password) :
        await api.login(formData.email, formData.password);

      console.log('Resposta do login:', {
        id: response.id,
        email: response.email,
        role: response.role,
        token: response.token ? 'Token presente' : 'Token ausente'
      });

      // Salvar dados do usuário no localStorage
      localStorage.setItem("recycleczs_current_user", JSON.stringify(response));
      console.log('Dados do usuário salvos no localStorage');

      // Redirecionar baseado no tipo de usuário
      if (isAdminEmail) {
        console.log('Redirecionando para dashboard admin');
        setLocation("/admin");
      } else {
        console.log('Redirecionando para dashboard do usuário');
        setLocation("/home");
      }
    } catch (err) {
      console.error('Erro durante o login:', err);
      setDebugInfo(err instanceof Error ? err.message : 'Erro ao fazer login');
      setErrors({
        ...errors,
        general: "Email ou senha incorretos"
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold mb-1">Bem-vindo de volta!</h1>
          <h2 className="text-2xl font-bold mb-8">Faça seu login</h2>

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
                placeholder="Digite seu email"
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
              disabled={loading}
              className={`w-full py-3 px-4 bg-[#6CB33F] text-white rounded-md font-medium ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Ainda não tem uma conta?{" "}
              <button
                onClick={() => setLocation("/register")}
                className="text-[#6CB33F] font-medium"
              >
                Faça seu cadastro
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}