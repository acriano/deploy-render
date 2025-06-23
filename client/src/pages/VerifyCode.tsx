import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function VerifyCode() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];
  
  // Verifica se existe um email para resetar a senha
  useEffect(() => {
    const resetEmail = localStorage.getItem("recycleczs_reset_email");
    if (!resetEmail) {
      setLocation("/forgot-password");
    }
  }, [setLocation]);

  const handleInputChange = (index: number, value: string) => {
    // Permite apenas dígitos
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    // Atualiza o código
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Move para o próximo input se o valor tiver um dígito
    if (value.length === 1 && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    
    // Limpa erro quando o usuário começa a digitar
    if (error) {
      setError("");
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Se backspace for pressionado e o input estiver vazio, move para o anterior
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verifica se todos os dígitos foram preenchidos
    if (code.some(digit => !digit)) {
      setError("Por favor, insira o código completo");
      return;
    }
    
    // Obtém o código armazenado (em um app real, isso seria verificado no backend)
    const storedCode = localStorage.getItem("recycleczs_reset_code");
    
    // Verifica se o código está correto
    if (code.join("") !== storedCode) {
      setError("Código inválido");
      return;
    }
    
    // Redireciona para a tela de nova senha
    setLocation("/reset-password");
  };
  
  const handleResendCode = () => {
    // Em um app real, aqui enviaria um novo código por email
    // Para simulação, mantemos o mesmo código
    setError("");
    alert("Um novo código foi enviado para o seu email.");
  };
  
  return (
    <div className="font-sans bg-white min-h-screen flex flex-col">
      <header className="p-4">
        <button 
          onClick={() => setLocation("/forgot-password")} 
          className="text-[#6CB33F]"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
      </header>
      
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Verificação</h1>
          <p className="text-gray-600 mb-8">
            Insira abaixo o código de 4 dígitos que enviamos para o seu email
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-16 h-16 text-center text-xl font-bold border ${
                    error ? "border-red-500" : "border-[#6CB33F]"
                  } rounded-md mx-1`}
                />
              ))}
            </div>
            
            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#6CB33F] text-white rounded-md font-medium"
            >
              Verificar
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Não recebeu o código?{" "}
              <button
                onClick={handleResendCode}
                className="text-[#6CB33F] font-medium"
              >
                Reenviar
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}