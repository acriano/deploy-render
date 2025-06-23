import { MapPin, Search, Recycle, Calendar } from "lucide-react";

interface ActionButtonProps {
  onCollectionPointsClick: () => void;
  onFindCollectorsClick: () => void;
  onRecyclableItemsClick: () => void;
  onScheduledCollectionsClick: () => void;
}

export function ActionButtons({ 
  onCollectionPointsClick, 
  onFindCollectorsClick, 
  onRecyclableItemsClick, 
  onScheduledCollectionsClick 
}: ActionButtonProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {/* Collection Points Button */}
      <button 
        className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center transition-transform hover:scale-105 h-32"
        onClick={onCollectionPointsClick}
      >
        <div className="text-[#6FCF97] mb-2">
          <MapPin size={32} />
        </div>
        <span className="text-center">Pontos de coleta</span>
      </button>
      
      {/* Find Collectors Button */}
      <button 
        className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center transition-transform hover:scale-105 h-32"
        onClick={onFindCollectorsClick}
      >
        <div className="text-[#6FCF97] mb-2">
          <Search size={32} />
        </div>
        <span className="text-center">Encontrar catadores</span>
      </button>
      
      {/* What Can I Recycle Button */}
      <button 
        className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center transition-transform hover:scale-105 h-32"
        onClick={onRecyclableItemsClick}
      >
        <div className="text-[#6FCF97] mb-2">
          <Recycle size={32} />
        </div>
        <span className="text-center">O que posso reciclar</span>
      </button>
      
      {/* Scheduled Collections Button */}
      <button 
        className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center transition-transform hover:scale-105 h-32"
        onClick={onScheduledCollectionsClick}
      >
        <div className="text-[#6FCF97] mb-2">
          <Calendar size={32} />
        </div>
        <span className="text-center">Coletas agendadas</span>
      </button>
    </div>
  );
}
