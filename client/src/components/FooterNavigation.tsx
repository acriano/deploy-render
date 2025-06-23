import { Home, MapPin, Search, Recycle, Calendar } from "lucide-react";
import { useLocation } from "wouter";

interface FooterNavigationProps {
  activePage?: "home" | "map" | "search" | "recycle" | "schedule";
}

export function FooterNavigation({ activePage }: FooterNavigationProps = {}) {
  const [location, setLocation] = useLocation();
  
  const navItems = [
    { icon: <Home size={20} />, label: "Home", path: "/" },
    { icon: <MapPin size={20} />, label: "Mapa", path: "/map" },
    { icon: <Search size={20} />, label: "Busca", path: "/search" },
    { icon: <Recycle size={20} />, label: "Reciclagem", path: "/recycle" },
    { icon: <Calendar size={20} />, label: "Agenda", path: "/schedule" }
  ];
  
  return (
    <footer className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-2">
      <nav className="flex justify-between items-center px-8">
        {navItems.map((item, index) => (
          <a 
            key={index}
            href={item.path}
            onClick={(e) => {
              e.preventDefault();
              setLocation(item.path);
            }}
            className={`flex flex-col items-center ${
              activePage 
                ? (item.label.toLowerCase() === activePage.toLowerCase() ? 'text-[#6FCF97]' : 'text-gray-400') 
                : (location === item.path ? 'text-[#6FCF97]' : 'text-gray-400')
            }`}
          >
            <div className="text-xl">{item.icon}</div>
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        ))}
      </nav>
    </footer>
  );
}
