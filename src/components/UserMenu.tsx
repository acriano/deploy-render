import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { X, User, Bell, HelpCircle, LogOut, AlertCircle } from "lucide-react";

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const [, setLocation] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Estado para armazenar os dados do usuário
  const [userData, setUserData] = useState({
    name: "Nome Usuário",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
  });

  // Buscar dados do usuário do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("recycleczs_current_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          name: parsedUser.name || "Usuário",
          avatar: parsedUser.avatar || userData.avatar
        });
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    }
  }, [isOpen]); // Recarregar quando o menu for aberto

  // Fechar o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Impedir rolagem do body quando o menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Navegar para as páginas do usuário
  const navigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  // Função para sair (logout)
  const handleLogout = () => {
    // Em uma aplicação real, teríamos uma chamada para a API para fazer logout
    localStorage.removeItem("recycleczs_current_user");
    // Redirecionar para a tela de boas-vindas
    setLocation("/welcome");
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 flex ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-opacity duration-300`}>
      <div
        ref={menuRef}
        className={`bg-white w-4/5 max-w-sm h-full ml-auto flex flex-col shadow-xl transition-transform transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Cabeçalho com botão de fechar */}
        <div className="p-4 flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Nome do usuário */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#333333]">{userData.name}</h2>
        </div>

        {/* Opções do menu */}
        <nav className="flex-1">
          <ul className="divide-y divide-gray-200">
            <li>
              <button
                className="w-full px-6 py-4 flex items-center text-[#333333] hover:bg-gray-50"
                onClick={() => navigate("/user/profile")}
              >
                <User size={20} className="text-[#F2994A] mr-3" />
                <span>Meus dados</span>
              </button>
            </li>
            <li>
              <button
                className="w-full px-6 py-4 flex items-center text-[#333333] hover:bg-gray-50"
                onClick={() => navigate("/user/notifications")}
              >
                <Bell size={20} className="text-[#F2994A] mr-3" />
                <span>Notificações</span>
              </button>
            </li>
            <li>
              <button
                className="w-full px-6 py-4 flex items-center text-[#333333] hover:bg-gray-50"
                onClick={() => navigate("/user/help")}
              >
                <HelpCircle size={20} className="text-[#F2994A] mr-3" />
                <span>Ajuda</span>
              </button>
            </li>
            <li>
              <button
                className="w-full px-6 py-4 flex items-center text-[#333333] hover:bg-gray-50"
                onClick={handleLogout}
              >
                <LogOut size={20} className="text-[#F2994A] mr-3" />
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}