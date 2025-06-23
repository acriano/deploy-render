import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Search as SearchIcon, Mic, Star, Trash2, Droplet, Clock, Smartphone, Wine, Recycle, FileText, Cpu } from "lucide-react";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { getFullImageUrl, handleImageError } from "@/utils/imageUtils";

// Modelo simples para o catador/empresa
interface CollectorProfile {
  id: number;
  name: string;
  address: string;
  avatar: string;
  materials: string[];
  completedCollections?: number;
  phone?: string;
  whatsapp?: string;
  website?: string;
  description?: string;
  schedule?: string;
}

// Função de diagnóstico para examinar URLs de imagem
function debugImageUrl(url: string | undefined, id: number): void {
  console.log(`[DEBUG][ID: ${id}] Analisando URL de imagem:`, url);
  
  if (!url) {
    console.log(`[DEBUG][ID: ${id}] URL vazia ou indefinida`);
    return;
  }
  
  // Verificar formato da URL - padrão esperado: número-timestamp.extensão
  const filePattern = /^(\d+)-(\d+)\.(jpg|jpeg|png|gif|svg|webp)$/i;
  const fileMatch = url.split('/').pop()?.match(filePattern);
  
  if (fileMatch) {
    console.log(`[DEBUG][ID: ${id}] URL parece ser um arquivo de imagem válido no formato ID-TIMESTAMP.EXT:`, fileMatch[0]);
  } else if (url.includes('collection-points')) {
    console.log(`[DEBUG][ID: ${id}] URL contém 'collection-points' mas não está no formato esperado:`, url);
  } else if (url.startsWith('/uploads')) {
    console.log(`[DEBUG][ID: ${id}] URL começa com '/uploads' mas não contém 'collection-points':`, url);
  } else {
    console.log(`[DEBUG][ID: ${id}] URL não segue nenhum padrão esperado:`, url);
  }
}

// Componente principal da página de busca
export default function Search() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollector, setSelectedCollector] = useState<CollectorProfile | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Interface para os pontos de coleta da API
  interface CollectionPointFromApi {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    shortName: string | null;
    schedule: string | null;
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    description: string | null;
    isActive: boolean;
    imageUrl?: string;
    acceptedMaterials?: {
      id: number;
      collectionPointId: number;
      materialType: string;
      description: string | null;
    }[];
  }

  // Buscar coletores da API
  const { data: collectionPoints, isLoading, error, refetch } = useQuery({
    queryKey: ['http://localhost:5000/api/collection-points'],
    queryFn: async ({ queryKey }) => {
      try {
        console.log('[Search] Iniciando requisição para API:', queryKey[0]);
        
        // Log detalhado do processo de busca
        const startTime = new Date().getTime();
        const response = await fetch(queryKey[0] as string);
        const endTime = new Date().getTime();
        
        console.log(`[Search] Resposta recebida em ${endTime - startTime}ms, status:`, response.status);
        
        if (!response.ok) {
          console.error('[Search] Resposta da API não ok:', response.status, response.statusText);
          throw new Error('Erro ao buscar pontos de coleta');
        }
        
        const data = await response.json() as CollectionPointFromApi[];
        
        // Log detalhado dos dados recebidos da API 
        console.log('[Search] Total de pontos recebidos:', data.length);
        
        // Examinar especificamente o campo imageUrl de cada ponto
        if (data && data.length > 0) {
          console.log('[Search] Detalhes das imagens recebidas:');
          data.forEach(point => {
            console.log(`[Search] Ponto ID ${point.id} - '${point.name}' - URL da imagem:`, 
              point.imageUrl || 'sem imagem');
          });
        } else {
          console.log('[Search] Nenhum ponto de coleta retornado pela API');
        }
        
        return data;
      } catch (error) {
        console.error('[Search] Erro na requisição da API:', error);
        throw error;
      }
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Simplificar o efeito de visibilidade para evitar chamadas redundantes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !collectionPoints) {
        // Só recarrega se não tiver dados
        console.log('Página Search visível novamente e sem dados, atualizando...');
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch, collectionPoints]);

  // Mapeamento de pontos de coleta para o formato de catadores/empresas
  const collectors: CollectorProfile[] = useMemo(() => {
    if (!collectionPoints) return [];
    
    console.log('[DEBUG] Processando dados de pontos de coleta recebidos da API:', collectionPoints.length);
    
    return (collectionPoints as CollectionPointFromApi[]).map((point: CollectionPointFromApi) => {
      // Depurar URL de imagem
      debugImageUrl(point.imageUrl, point.id);
      
      // Processamento especial para o caminho da imagem
      let avatarUrl = point.imageUrl;
      
      // Garantir que temos uma URL de imagem válida e bem formatada
      const avatar = getFullImageUrl(avatarUrl, `Ponto_${point.id}`);
      
      console.log(`[DEBUG][ID: ${point.id}] URL final processada:`, avatar);
      
      return {
        id: point.id,
        name: point.name,
        address: point.address.split(',')[0],
        // Usar a URL formatada da imagem
        avatar: avatar,
        materials: point.acceptedMaterials 
          ? point.acceptedMaterials.map((m) => m.materialType)
          : ['Papel/Papelão', 'Plásticos'],
        completedCollections: Math.floor(Math.random() * 100), // Simular número de coletas
        phone: point.phone || undefined,
        whatsapp: point.whatsapp || undefined,
        website: point.website || undefined,
        description: point.description || undefined,
        schedule: point.schedule || undefined
      };
    });
  }, [collectionPoints]);

  // Lista de materiais disponíveis para filtro
  const availableMaterials = useMemo(() => {
    if (!collectionPoints) return [];
    const materials = new Set<string>();
    (collectionPoints as CollectionPointFromApi[]).forEach((point: CollectionPointFromApi) => {
      point.acceptedMaterials?.forEach((material) => {
        materials.add(material.materialType);
      });
    });
    return Array.from(materials);
  }, [collectionPoints]);

  // Filtrar catadores baseados na busca e material selecionado
  const filteredCollectors = useMemo(() => {
    if (!collectors) return [];
    
    return collectors.filter(collector => {
      const matchesSearch = !searchTerm || 
        collector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collector.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMaterial = !selectedMaterial ||
        collector.materials.some(m => m.toLowerCase() === selectedMaterial.toLowerCase());
      
      return matchesSearch && matchesMaterial;
    });
  }, [collectors, searchTerm, selectedMaterial]);

  // Função para abrir um perfil de catador
  const handleOpenProfile = (collector: CollectorProfile) => {
    setSelectedCollector(collector);
  };

  // Função para voltar para a lista
  const handleBackToList = () => {
    setSelectedCollector(null);
  };

  // Mapeamento de ícones para tipos de materiais
  const getMaterialIcon = (materialType: string) => {
    switch (materialType.toLowerCase()) {
      case 'papel':
      case 'papelão':
      case 'papel/papelão':
        return <FileText size={16} />;
      case 'plástico':
      case 'plásticos':
        return <Droplet size={16} />;
      case 'vidro':
      case 'vidros':
        return <Wine size={16} />;
      case 'eletrônicos':
      case 'eletrônico':
        return <Cpu size={16} />;
      default:
        return <Recycle size={16} />;
    }
  };

  // Função para formatar número do WhatsApp
  const formatWhatsAppNumber = (whatsapp: string): string => {
    // Remove todos os caracteres não numéricos
    let cleanNumber = whatsapp.replace(/\D/g, '');
    
    // Se o número começa com 0, remove o 0
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // Se o número não tem código do país (55 para Brasil), adiciona
    if (!cleanNumber.startsWith('55')) {
      cleanNumber = '55' + cleanNumber;
    }
    
    return cleanNumber;
  };

  return (
    <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
      {/* Header */}
      <div className="relative">
        <Header />
        <button 
          onClick={() => setLocation('/')} 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F2994A]"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <main className="flex-1 px-4 pt-4 pb-20">
        {!selectedCollector ? (
          <>
            <h1 className="text-2xl font-bold mb-4">Encontre e converse com um ponto de coleta</h1>
            
            {/* Campo de busca com botão de atualização */}
            <div className="flex items-center mb-4">
              <div className="flex-1 border border-gray-200 rounded-full px-4 py-2 bg-gray-50 flex items-center">
                <SearchIcon size={18} className="text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Digite seu CEP ou endereço" 
                  className="flex-1 outline-none bg-transparent text-gray-700" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Mic size={18} className="text-gray-400 ml-2" />
              </div>
              <button 
                onClick={() => {
                  console.log("Atualizando dados manualmente...");
                  refetch();
                }}
                disabled={isLoading}
                className={`ml-2 p-2 rounded-full ${
                  isLoading 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-[#6FCF97] hover:bg-[#5BB485]'
                } text-white transition-colors`}
                title="Atualizar dados"
                aria-label="Atualizar dados"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Filtros de material */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex space-x-2 pb-2">
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${
                    !selectedMaterial
                      ? 'bg-[#6FCF97] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Todos
                </button>
                {availableMaterials.map((material) => (
                  <button
                    key={material}
                    onClick={() => setSelectedMaterial(material)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-sm ${
                      selectedMaterial === material
                        ? 'bg-[#6FCF97] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Lista de catadores */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6FCF97]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCollectors.map(collector => (
                  <div 
                    key={collector.id} 
                    className="bg-white rounded-xl shadow-sm p-4 flex items-start cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOpenProfile(collector)}
                  >
                    <img 
                      src={collector.avatar} 
                      alt={collector.name} 
                      className="w-16 h-16 rounded-full object-cover mr-4"
                      onError={(e) => handleImageError(e, collector.id)}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-[#333333] mb-1">{collector.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{collector.address}</p>
                      {collector.description && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{collector.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {collector.materials.map((material, idx) => (
                          <span
                            key={idx}
                            className="bg-[#6FCF97] bg-opacity-10 text-[#6FCF97] text-xs px-2 py-1 rounded-full"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                      {collector.completedCollections && (
                        <p className="text-gray-500 text-xs mt-2">
                          {collector.completedCollections} coletas realizadas
                        </p>
                      )}
                      {collector.schedule && (
                        <p className="text-gray-500 text-xs mt-1 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {collector.schedule}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-400 self-center" />
                  </div>
                ))}
                
                {filteredCollectors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || selectedMaterial
                      ? "Nenhum resultado encontrado para sua busca"
                      : "Não há pontos de coleta disponíveis"}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Tela de perfil do ponto de coleta
          <div className="pt-2">
            <button 
              onClick={handleBackToList} 
              className="text-[#F2994A] mb-4 flex items-center"
              aria-label="Voltar para lista"
            >
              <ArrowLeft size={24} className="mr-2" />
              <span>Voltar para lista</span>
            </button>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col items-center mb-6">
                <img 
                  src={selectedCollector.avatar} 
                  alt={selectedCollector.name} 
                  className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-[#6FCF97]"
                  onError={(e) => {
                    // Log detalhado para diagnóstico
                    console.error(
                      'Erro ao carregar imagem no perfil ID:', 
                      selectedCollector.id, 
                      'URL tentada:', 
                      e.currentTarget.src
                    );
                    // Usar imagem padrão em caso de erro
                    e.currentTarget.src = `${window.location.origin}/assets/sem-imagem.svg`;
                    e.currentTarget.onerror = null; // Prevenir loop infinito
                  }}
                />
                <h2 className="text-2xl font-bold text-center mb-2">{selectedCollector.name}</h2>
                <div className="bg-[#6FCF97] bg-opacity-10 rounded-full px-4 py-1 text-sm text-[#6FCF97]">
                  {selectedCollector.completedCollections} coletas realizadas
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Endereço */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Endereço</h3>
                  <p className="text-gray-600">{selectedCollector.address}</p>
                </div>

                {/* Descrição */}
                {selectedCollector.description && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Descrição</h3>
                    <p className="text-gray-600">{selectedCollector.description}</p>
                  </div>
                )}

                {/* Horário de Funcionamento */}
                {selectedCollector.schedule && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Horário de Funcionamento</h3>
                    <p className="text-gray-600">{selectedCollector.schedule}</p>
                  </div>
                )}

                {/* Materiais aceitos */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Materiais aceitos</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCollector.materials.map((material, index) => (
                      <div 
                        key={index}
                        className="flex items-center bg-[#6FCF97] bg-opacity-10 text-[#6FCF97] px-3 py-1.5 rounded-full"
                      >
                        {getMaterialIcon(material)}
                        <span className="ml-2">{material}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Entre em contato</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedCollector.phone && (
                      <a
                        href={`tel:${selectedCollector.phone}`}
                        className="flex items-center justify-center bg-[#6FCF97] text-white py-3 px-4 rounded-xl hover:bg-[#5AA832] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Ligar
                      </a>
                    )}
                    {selectedCollector.whatsapp && (
                      <a
                        href={`https://wa.me/${formatWhatsAppNumber(selectedCollector.whatsapp)}?text=Olá! Vi seu ponto de coleta no RecycleCZS e gostaria de saber mais sobre os materiais que vocês aceitam.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-[#25D366] text-white py-3 px-4 rounded-xl hover:bg-[#128C7E] transition-colors"
                        onClick={(e) => {
                          // Log para debug
                          console.log('[Search] WhatsApp clicado para:', selectedCollector.name, 'Número:', selectedCollector.whatsapp);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        WhatsApp
                      </a>
                    )}
                  </div>
                  
                  {/* Website */}
                  {selectedCollector.website && (
                    <div className="mt-3">
                      <a 
                        href={selectedCollector.website.startsWith('http') ? selectedCollector.website : `https://${selectedCollector.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                        </svg>
                        Visitar Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Rodapé de navegação */}
      <FooterNavigation activePage="search" />
    </div>
  );
}