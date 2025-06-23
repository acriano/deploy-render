import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  
  // Verifica se existe um email para resetar a senha
  useEffect(() => {
    const resetEmail = localStorage.getItem("recycleczs_reset_email");
    if (!resetEmail) {
      setLocation("/forgot-password");
    }
  }, [setLocation]);

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
      password?: string;
      confirmPassword?: string;
    } = {};
    
    if (!formData.password) {
      newErrors.password = "Por favor, insira uma nova senha";
    } else if (formData.password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Por favor, confirme sua nova senha";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Obter o email de reset
        const resetEmail = localStorage.getItem("recycleczs_reset_email");
        
        if (!resetEmail) {
          setErrors({
            ...errors,
            general: "Sessão expirada. Por favor, reinicie o processo."
          });
          return;
        }
        
        // Obter usuários cadastrados
        const users = JSON.parse(localStorage.getItem("recycleczs_users") || "[]");
        
        // Atualizar a senha do usuário
        const updatedUsers = users.map((user: any) => {
          if (user.email === resetEmail) {
            return {
              ...user,
              password: formData.password
            };
          }
          return user;
        });
        
        // Salvar os usuários atualizados
        localStorage.setItem("recycleczs_users", JSON.stringify(updatedUsers));
        
        // Limpar dados temporários
        localStorage.removeItem("recycleczs_reset_email");
        localStorage.removeItem("recycleczs_reset_code");
        
        // Redirecionar para a tela de sucesso
        setLocation("/reset-success");
      } catch (error) {
        console.error("Erro ao resetar senha:", error);
        setErrors({
          ...errors,
          general: "Erro ao resetar senha. Tente novamente."
        });
      }
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  return (
    <div className="font-sans bg-white min-h-screen flex flex-col">
      <header className="p-4">
        <button 
          onClick={() => setLocation("/verify-code")} 
          className="text-[#6CB33F]"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
      </header>
      
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-1">Pronto!</h1>
          <h2 className="text-2xl font-bold mb-8">Crie uma nova senha</h2>
          
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Digite uma nova senha"
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
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
            
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirmar nova senha"
                className={`w-full px-4 py-3 rounded-md border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#6CB33F] text-white rounded-md font-medium mt-6"
            >
              Confirmar
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}