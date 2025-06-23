import { useState } from "react";

interface MapCallToActionProps {
  onMapButtonClick: () => void;
}

export function MapCallToAction({ onMapButtonClick }: MapCallToActionProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="mb-6">
      <p className="text-lg font-medium mb-3">Veja os pontos de coleta próximo a sua residência:</p>
      <button 
        className={`border-2 border-[#6FCF97] text-[#6FCF97] font-medium py-2 px-6 rounded-lg transition-transform ${isHovered ? 'scale-105' : ''} w-full`}
        onClick={onMapButtonClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        Ir para o mapa
      </button>
    </div>
  );
}
