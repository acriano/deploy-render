import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };
  
  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Por favor, insira seu email");
      return;
    }
    
    if (!validateEmail(email)) {
      setError("Email inválido");
      return;
    }
    
    // Verificar se o email existe
    const users = JSON.parse(localStorage.getItem("recycleczs_users") || "[]");
    const userExists = users.some((user: any) => user.email === email);
    
    if (!userExists) {
      setError("Email não cadastrado");
      return;
    }
    
    // Simular o envio do código (em um app real, isso seria feito pelo backend)
    localStorage.setItem("recycleczs_reset_email", email);
    
    // Em um app real, aqui enviaria o código por email
    // Para simulação, usaremos o código fixo "7401"
    localStorage.setItem("recycleczs_reset_code", "7401");
    
    // Indica que o formulário foi enviado com sucesso
    setIsSubmitted(true);
    
    // Redirecionar para a tela de inserção do código
    setLocation("/verify-code");
  };
  
  return (
    <div className="font-sans bg-white min-h-screen flex flex-col">
      <header className="p-4">
        <button 
          onClick={() => setLocation("/login")} 
          className="text-[#6CB33F]"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
      </header>
      
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Esqueceu sua senha?</h1>
          <p className="text-gray-600 mb-8">
            Por favor, insira o email vinculado a sua conta
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleInputChange}
                placeholder="Digite seu email"
                className={`w-full px-4 py-3 rounded-md border ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#6CB33F] text-white rounded-md font-medium"
            >
              Enviar código
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Lembrou da senha?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-[#6CB33F] font-medium"
              >
                Faça seu login
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}