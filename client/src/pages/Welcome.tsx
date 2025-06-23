import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

// Importação dos assets
import logoPath from "../assets/recycleczs-logo-new.svg";
import illustrationPath from "../assets/recycling-illustration.svg";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="font-sans bg-white min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-between px-4 py-8">
        <div className="w-full">
          {/* Esta div está vazia mas mantida para layout */}
        </div>

        <div className="w-full max-w-md flex flex-col items-center">
          {/* Ilustração */}
          <div className="mb-6 w-full max-w-xs">
            <img
              src={illustrationPath}
              alt="Ilustração de pessoas reciclando"
              className="w-full"
            />
          </div>

          {/* Logo */}
          <div className="mb-8 w-32 h-32">
            <img
              src={logoPath}
              alt="Logo do Recycleczs"
              className="w-full object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Bem-Vindo</h1>

          {/* Botões */}
          <div className="w-full space-y-4 mt-6">
            <button
              onClick={() => setLocation("/login")}
              className="w-full py-3 px-4 bg-[#6CB33F] text-white rounded-md font-medium"
            >
              Entrar
            </button>

            <button
              onClick={() => setLocation("/register")}
              className="w-full py-3 px-4 border border-[#6CB33F] text-[#6CB33F] rounded-md font-medium"
            >
              Quero me cadastrar
            </button>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => setLocation("/admin-login")}
              className="text-sm text-gray-500 hover:text-[#6CB33F]"
            >
              Acesso Administrativo
            </button>
          </div>
        </div>

        <div className="h-8">
          {/* Esta div está vazia mas mantida para espaçamento */}
        </div>
      </main>
    </div>
  );
}