import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { User } from "lucide-react";

interface HeaderProps {
  userAvatar?: string;
}

export function Header({ userAvatar }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState({
    name: ""
  });

  // Buscar dados do usuário do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("recycleczs_current_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          name: parsedUser.name || "Usuário"
        });
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    }
  }, []);

  const handleProfileClick = () => {
    setLocation("/user/profile");
  };

  return (
    <header className="bg-white p-5 flex justify-between items-center">
      {/* Logo com tamanho maior */}
      <div className="w-32 h-12 flex items-center">
        <Logo className="w-full h-auto object-contain" />
      </div>

      {/* User Avatar - Substituído por ícone genérico */}
      <div
        className="w-10 h-10 rounded-full overflow-hidden cursor-pointer bg-gray-200 flex items-center justify-center"
        onClick={handleProfileClick}
      >
        <User size={24} className="text-gray-600" />
      </div>
    </header>
  );
}
