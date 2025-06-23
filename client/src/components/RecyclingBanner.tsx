interface RecyclingBannerProps {
  onRecyclingGuideClick: () => void;
}

export function RecyclingBanner({ onRecyclingGuideClick }: RecyclingBannerProps) {
  return (
    <div className="relative w-full mb-6 rounded-lg overflow-hidden shadow-md">
      <div className="h-36 bg-[#1AB5C1] flex items-end">
        <img 
          src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" 
          alt="Mãos segurando itens recicláveis" 
          className="w-full h-full object-cover absolute top-0 left-0 opacity-80"
        />
        
        <button 
          className="bg-[#F2994A] text-white font-bold py-2 px-4 m-4 rounded-md relative z-10 shadow-lg"
          onClick={onRecyclingGuideClick}
        >
          COMO RECICLAR
        </button>
      </div>
    </div>
  );
}
