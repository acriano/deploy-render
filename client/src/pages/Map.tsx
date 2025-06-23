import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { Search, Mic, MapPin, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression, Map as LeafletMap } from 'leaflet';
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getFullImageUrl, handleImageError } from '@/utils/imageUtils';
import 'leaflet/dist/leaflet.css';

// Definindo o tipo para os pontos de coleta
interface CollectionPoint {
  id: number;
  name: string;
  shortName: string | null;
  address: string;
  latitude: number;
  longitude: number;
  schedule: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: number | null;
  acceptedMaterials?: AcceptedMaterial[];
  imageUrl?: string;
}

interface AcceptedMaterial {
  id: number;
  collectionPointId: number;
  materialType: string;
  description: string | null;
}

// Estrutura para uso no frontend
interface MappedCollectionPoint {
  id: number;
  name: string;
  shortName: string;
  address: string;
  schedule: string | null;
  phone: string | null;
  coords: {
    lat: number;
    lng: number;
  };
  materials?: string[];
  imageUrl?: string;
}

// Mapper para converter da API para formato de uso no front
const mapCollectionPoint = (point: CollectionPoint): MappedCollectionPoint => {
  return {
    id: point.id,
    name: point.name,
    shortName: point.shortName || point.name.split(' ').slice(0, 3).join(' '),
    address: point.address,
    phone: point.phone,
    schedule: point.schedule,
    coords: {
      lat: Number(point.latitude),
      lng: Number(point.longitude)
    },
    materials: point.acceptedMaterials?.map(m => m.materialType),
    imageUrl: point.imageUrl
  };
};

// Função para calcular o centro do mapa baseado nos pontos
const getMapCenter = (points: MappedCollectionPoint[]) => {
  if (!points.length) {
    return { lat: -21.129, lng: -44.459 }; // Centro padrão
  }
  
  const lats = points.map(p => p.coords.lat);
  const lngs = points.map(p => p.coords.lng);
  return {
    lat: lats.reduce((a, b) => a + b, 0) / lats.length,
    lng: lngs.reduce((a, b) => a + b, 0) / lngs.length
  };
};

// Ícone personalizado para os marcadores
const customIcon = new Icon({
  iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#F2994A" stroke-width="1.5"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Componente de erro para o mapa
function MapError({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Erro no mapa</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function Map() {
  // Estados para o componente
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [expandedPoint, setExpandedPoint] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  // Buscar pontos de coleta da API
  const { data: collectionPointsData, isLoading, error } = useQuery({
    queryKey: ['collection-points'],
    queryFn: async () => {
      try {
        console.log('Iniciando busca de pontos de coleta...');
        const response = await fetch('http://127.0.0.1:5000/api/collection-points', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        console.log('Resposta recebida:', response.status);
        
      if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          throw new Error(`Erro ao buscar pontos de coleta: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        return data as CollectionPoint[];
      } catch (err) {
        console.error('Erro ao buscar pontos de coleta:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false
  });
  
  // Mapear os pontos de coleta para o formato usado no frontend
  const collectionPoints: MappedCollectionPoint[] = useMemo(() => {
    if (!collectionPointsData) return [];
    return collectionPointsData.map(mapCollectionPoint);
  }, [collectionPointsData]);
  
  // Calcular o centro do mapa com base nos pontos
  const defaultCenter = useMemo(() => getMapCenter(collectionPoints), [collectionPoints]);

  // Função para lidar com clique no marcador
  const handleMarkerClick = (id: number) => {
    setSelectedMarker(id);
    setExpandedPoint(id);
    setIsExpanded(false);
    
    // Encontrar o ponto clicado
    const clickedPoint = collectionPoints.find(point => point.id === id);
    if (clickedPoint && mapRef.current) {
      // Fazer zoom e centralizar no ponto
      mapRef.current.setView([clickedPoint.coords.lat, clickedPoint.coords.lng], 18, {
        animate: true,
        duration: 1
      });
    }
  };

  // Função para lidar com clique no ponto na lista
  const handlePointClick = (id: number) => {
    setExpandedPoint(id === expandedPoint ? null : id);
    setSelectedMarker(id);
    
    // Encontrar o ponto clicado
    const clickedPoint = collectionPoints.find(point => point.id === id);
    if (clickedPoint && mapRef.current) {
      // Fazer zoom e centralizar no ponto
      mapRef.current.setView([clickedPoint.coords.lat, clickedPoint.coords.lng], 18, {
        animate: true,
        duration: 1
      });
    }
  };

  // Função para filtrar pontos com base na busca
  const filteredPoints = useMemo(() => {
    return collectionPoints.filter(point => 
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (searchTerm.length >= 5 && point.address.includes(searchTerm.substring(0, 5)))
    );
  }, [collectionPoints, searchTerm]);

  // Funções para gerenciar o arrastar do bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY.current) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = startY.current - currentY.current;
    
    if (diff > 50) {
      setIsExpanded(true);
    } else if (diff < -50) {
      setIsExpanded(false);
    }
  };

  const handleTouchEnd = () => {
    startY.current = null;
    currentY.current = null;
  };

  // Renderiza erro se houver problemas com busca de pontos
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao buscar dados</h2>
          <p className="text-gray-600">Não foi possível carregar os pontos de coleta</p>
          <button 
            className="mt-4 px-4 py-2 bg-[#6FCF97] text-white rounded-md"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['collection-points'] })}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans bg-white text-[#333333] h-screen flex flex-col relative overflow-hidden">
      {/* Mapa do Leaflet */}
      <div className="absolute inset-0 z-0">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#6FCF97] mx-auto mb-2" />
              <p className="text-gray-600">Carregando mapa...</p>
            </div>
          </div>
        ) : collectionPoints.length === 0 ? (
          <MapError message="Nenhum ponto de coleta encontrado" />
        ) : (
          <MapContainer
            center={[defaultCenter.lat, defaultCenter.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {collectionPoints.map(point => (
              <Marker
                key={point.id}
                position={[point.coords.lat, point.coords.lng]}
                icon={customIcon}
                eventHandlers={{
                  click: () => handleMarkerClick(point.id)
                }}
              >
                {selectedMarker === point.id && (
                  <Popup>
                    <div className="min-w-[200px] max-w-[300px]">
                      {point.imageUrl && (
                        <div className="h-32 w-full mb-2 rounded-md overflow-hidden">
                          <img 
                            src={getFullImageUrl(point.imageUrl)} 
                            alt={point.name}
                            className="h-full w-full object-cover"
                            onError={(e) => handleImageError(e, point.id)}
                          />
                        </div>
                      )}
                      <h3 className="font-bold text-lg mb-2">{point.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{point.address}</p>
                      {point.schedule && (
                        <p className="text-sm mb-2">
                          <span className="font-semibold">Horário:</span> {point.schedule}
                        </p>
                      )}
                      {point.materials && point.materials.length > 0 && (
                        <div className="mb-2">
                          <p className="font-semibold text-sm mb-1">Materiais aceitos:</p>
                          <div className="flex flex-wrap gap-1">
                            {point.materials.map((material, idx) => (
                              <span
                                key={idx}
                                className="bg-[#6FCF97] text-white text-xs px-2 py-1 rounded-full"
                              >
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Popup>
                )}
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
      
      {/* Cabeçalho */}
      <div className="relative z-10">
        <Header />
      </div>
      
      {/* Painel inferior arrastável */}
      <div 
        ref={bottomSheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-md z-20 transition-transform duration-300 ease-in-out ${
          isExpanded ? 'h-[80%]' : 'h-[50%]'
        }`}
        style={{
          transform: isExpanded ? 'translateY(0)' : 'translateY(65%)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Alça para arrastar */}
        <div className="w-full flex justify-center py-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Texto para arrastar - Apenas visível quando minimizado */}
        <div className={`text-center text-gray-500 text-sm mb-2 ${isExpanded ? 'hidden' : 'block'}`}>
          Arraste para cima
          <div className="flex justify-center mt-1">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Conteúdo do painel */}
        <div className="px-4 pb-20 overflow-y-auto max-h-full">
          <h1 className="text-xl font-bold mb-4">Encontre pontos de coleta e organizações perto de você</h1>
          
          {/* Barra de busca */}
          <div className="flex items-center border border-gray-300 rounded-lg mb-6 px-4 py-2">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Digite seu CEP" 
              className="flex-1 outline-none text-gray-700" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Mic size={18} className="text-gray-400 ml-2" />
          </div>
          
          {/* Lista de pontos de coleta */}
          <div className="space-y-4">
            {isLoading ? (
              // Estado de carregamento
              <div className="py-8">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#6FCF97]" />
                  <p className="text-sm text-gray-500">Carregando pontos de coleta...</p>
                </div>
              </div>
            ) : filteredPoints.length === 0 ? (
              // Sem resultados
              <div className="py-8 text-center">
                <p className="text-gray-500">
                  {searchTerm.length > 0
                    ? "Nenhum ponto de coleta encontrado para sua busca."
                    : "Nenhum ponto de coleta cadastrado."}
                </p>
              </div>
            ) : (
              // Lista de pontos
              filteredPoints.map(point => (
                <div 
                  key={point.id} 
                  className={`bg-white p-4 rounded-lg shadow-sm border ${expandedPoint === point.id ? 'border-[#F2994A]' : 'border-gray-100'} transition-all duration-200 active:scale-98`}
                  onClick={() => handlePointClick(point.id)}
                >
                  <div className="flex items-start">
                    {/* Exibir imagem do ponto se disponível */}
                    {point.imageUrl ? (
                      <div className="mr-3 h-14 w-14 rounded-md overflow-hidden">
                        <img 
                          src={getFullImageUrl(point.imageUrl)}
                          alt={point.name}
                          className="h-full w-full object-cover"
                          onError={(e) => handleImageError(e, point.id)}
                        />
                      </div>
                    ) : (
                      <div className="mr-3 mt-1">
                        <div className="text-yellow-500">
                          <MapPin size={22} />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">
                        {expandedPoint === point.id ? point.name : point.shortName}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {point.address}
                      </p>
                      {point.schedule && (
                        <p className="text-amber-500 text-sm mt-1">
                          {point.schedule}
                        </p>
                      )}
                      {point.phone && (
                        <p className="text-gray-500 text-sm mt-1">
                          {point.phone}
                        </p>
                      )}
                      {expandedPoint === point.id && point.materials && point.materials.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {point.materials.map(material => (
                            <span key={material} className="inline-block text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                              {material}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Rodapé de navegação */}
      <div className="relative z-30">
        <FooterNavigation />
      </div>
    </div>
  );
}