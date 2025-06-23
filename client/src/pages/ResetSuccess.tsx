import { useLocation } from "wouter";
import { Check } from "lucide-react";

export default function ResetSuccess() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="font-sans bg-white min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-md w-full mx-auto flex flex-col items-center">
          {/* Ícone de sucesso */}
          <div className="w-20 h-20 rounded-full bg-[#29ABE2] flex items-center justify-center mb-6">
            <Check className="text-white" size={40} />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Tudo certo!</h1>
          <p className="text-center text-gray-600 mb-8">
            Sua senha foi alterada com sucesso!
          </p>
          
          <button
            onClick={() => setLocation("/login")}
            className="w-full max-w-xs py-3 px-4 bg-[#6CB33F] text-white rounded-md font-medium"
          >
            Fazer login
          </button>
        </div>
      </main>
    </div>
  );
}