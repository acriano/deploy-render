import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { FileText, Droplet, Wine, Paperclip, Cpu, AlertTriangle } from "lucide-react";
import { getRecycleMaterials, saveRecycleMaterials } from "@/lib/localStorage";
import { RecycleMaterialsApi } from "@/lib/api";

// IMPORTANTE: Dados de fallback dos materiais recicláveis
// Usados apenas quando a API falha
const defaultRecyclingMaterials = [
  {
    id: "papel",
    name: "Papel",
    description: "Caixas ou pedaços de Papelão, Jornais, Revistas, Folhas, etc",
    icon: <FileText size={32} className="text-[#2D9CDB]" />,
    color: "#2D9CDB",
    items: {
      recyclable: [
        "Caixas de papelão (desmontadas e limpas)",
        "Jornais e revistas (sem plástico ou sujeira)",
        "Folhas de papel (impressas, rascunhos, cadernos sem espiral)",
        "Sacos de papel (limpos, sem gordura)",
        "Embalagens longa-vida (Tetrapak – se a sua cidade reciclar)"
      ],
      nonRecyclable: [
        "Papel higiênico, lenços e guardanapos usados",
        "Papéis engordurados ou muito sujos",
        "Papel carbono",
        "Papel térmico (de fax ou extrato bancário)",
        "Fotografias"
      ],
      howToPrepare: "✔️ Desmonte as caixas para economizar espaço\n✔️ Remova restos de comida\n✔️ Separe plásticos e metais (grampos)\n✔️ Guarde em local seco"
    }
  },
  {
    id: "plastico",
    name: "Plástico",
    description: "Embalagens, garrafas PET, potes, canudos, tampinhas, etc",
    icon: <Droplet size={32} className="text-[#EB5757]" />,
    color: "#EB5757",
    items: {
      recyclable: [
        "Garrafas PET (água, refrigerante)",
        "Embalagens de produtos de limpeza",
        "Potes de alimentos (margarina, iogurte)",
        "Sacos e sacolas plásticas limpas",
        "Tampas e tampinhas plásticas"
      ],
      nonRecyclable: [
        "Embalagens muito sujas ou contaminadas",
        "Fraldas descartáveis",
        "Canudos (dependendo da região)",
        "Escovas de dente",
        "Isopor (em algumas cidades)"
      ],
      howToPrepare: "✔️ Lave as embalagens para remover resíduos\n✔️ Separe tampas das garrafas\n✔️ Amasse garrafas PET para ocupar menos espaço\n✔️ Remova rótulos quando possível"
    }
  },
  {
    id: "vidro",
    name: "Vidro",
    description: "Garrafas, frascos e recipientes no geral",
    icon: <Wine size={32} className="text-[#6FCF97]" />,
    color: "#6FCF97",
    items: {
      recyclable: [
        "Garrafas (refrigerante, cerveja, vinho)",
        "Potes de conserva ou alimentos",
        "Frascos de perfumes",
        "Recipientes de remédios",
        "Copos de vidro"
      ],
      nonRecyclable: [
        "Vidros de janelas ou espelhos",
        "Lâmpadas (destinação específica)",
        "Louças, cerâmicas e porcelanas",
        "Vidros temperados (pirex)",
        "Tubos de TV e monitores"
      ],
      howToPrepare: "✔️ Retire tampas (elas normalmente são de metal ou plástico)\n✔️ Enxágue bem para remover resíduos\n✔️ Não é necessário remover rótulos\n✔️ Cuidado para não misturar com vidros não recicláveis"
    }
  },
  {
    id: "metal",
    name: "Metal",
    description: "Latas, arames, ferramentas e utensílios de cozinha",
    icon: <Paperclip size={32} className="text-[#F2994A]" />,
    color: "#F2994A",
    items: {
      recyclable: [
        "Latas de alumínio (refrigerante, cerveja)",
        "Latas de aço (conservas, leite em pó)",
        "Tampas metálicas",
        "Panelas e utensílios sem cabo",
        "Ferramentas pequenas de metal"
      ],
      nonRecyclable: [
        "Embalagens metalizadas (tipo salgadinhos)",
        "Clipes e grampos (muito pequenos)",
        "Esponjas de aço sujas",
        "Latas com restos de tinta ou produtos químicos",
        "Aerossóis"
      ],
      howToPrepare: "✔️ Lave as latas e embalagens\n✔️ Amasse-as para economizar espaço\n✔️ Separe tampas de metal dos vidros\n✔️ Remova restos de alimentos"
    }
  },
  {
    id: "eletronicos",
    name: "Eletrônicos",
    description: "Celulares, baterias, computadores, teclados, placas, etc",
    icon: <Cpu size={32} className="text-[#27AE60]" />,
    color: "#27AE60",
    items: {
      recyclable: [
        "Celulares e smartphones",
        "Computadores e laptops",
        "Monitores e televisores",
        "Teclados, mouses e periféricos",
        "Cabos, carregadores e baterias"
      ],
      nonRecyclable: [
        "Equipamentos quebrados com vazamento de líquidos",
        "Lixo comum misturado com eletrônicos",
        "Baterias perfuradas ou danificadas",
        "Lâmpadas quebradas"
      ],
      howToPrepare: "✔️ Faça backup e delete seus dados pessoais\n✔️ Remova baterias quando possível\n✔️ Procure pontos de coleta específicos\n✔️ Não desmonte equipamentos (especialmente monitores)"
    }
  },
  {
    id: "perigosos",
    name: "Resíduos Perigosos",
    description: "Medicamentos vencidos, produtos químicos, lixo hospitalar, etc",
    icon: <AlertTriangle size={32} className="text-[#EB5757]" />,
    color: "#EB5757",
    items: {
      recyclable: [
        "Medicamentos vencidos (em postos específicos)",
        "Pilhas e baterias (em postos específicos)",
        "Lâmpadas fluorescentes (inteiras)",
        "Resíduos de tintas e solventes (em embalagens fechadas)",
        "Óleos lubrificantes"
      ],
      nonRecyclable: [
        "Seringas e materiais perfurocortantes (precisam de descarte especial)",
        "Produtos químicos misturados",
        "Materiais radioativos",
        "Lixo hospitalar contaminado"
      ],
      howToPrepare: "✔️ Nunca misture com lixo comum\n✔️ Mantenha em embalagens originais quando possível\n✔️ Procure postos de coleta específicos (farmácias, ecopontos)\n✔️ Não despeje líquidos no ralo ou esgoto"
    }
  }
];

// Helper para obter o ícone correto para cada material
const getIconForMaterial = (id: string, color: string) => {
  switch (id) {
    case 'papel':
      return <FileText size={32} style={{ color }} />;
    case 'plastico':
      return <Droplet size={32} style={{ color }} />;
    case 'vidro':
      return <Wine size={32} style={{ color }} />;
    case 'metal':
      return <Paperclip size={32} style={{ color }} />;
    case 'eletronicos':
      return <Cpu size={32} style={{ color }} />;
    case 'perigosos':
      return <AlertTriangle size={32} style={{ color }} />;
    default:
      return <Droplet size={32} style={{ color }} />;
  }
};

export default function Recycle() {
  const [, setLocation] = useLocation();
  const [recyclingMaterials, setRecyclingMaterials] = useState(defaultRecyclingMaterials);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Função para carregar materiais da API
  const loadMaterialsFromApi = async () => {
    console.log("[Recycle] Carregando materiais da API");
    setLoading(true);
    setError(null);
    
    try {
      const materials = await RecycleMaterialsApi.getAllMaterials();
      console.log("[Recycle] Materiais encontrados na API:", materials?.length || 0);
      
      if (materials && materials.length > 0) {
        // Converter materiais da API para o formato com ícones
        const materialsWithIcons = materials.map(material => ({
          ...material,
          icon: getIconForMaterial(material.id, material.color)
        }));
        console.log("[Recycle] Atualizando estado com materiais da API:", materialsWithIcons.length);
        
        // Atualizar o localStorage com os novos dados
        saveRecycleMaterials(materials);
        
        setRecyclingMaterials(materialsWithIcons);
      } else {
        console.log("[Recycle] Nenhum material encontrado na API, usando localStorage como fallback");
        loadMaterialsFromStorage();
      }
    } catch (error) {
      console.error("[Recycle] Erro ao carregar materiais da API:", error);
      setError("Não foi possível carregar os materiais. Tentando alternativa...");
      // Em caso de falha, usar localStorage como fallback
      loadMaterialsFromStorage();
    } finally {
      setLoading(false);
    }
  };
  
  // Função para carregar materiais do localStorage (como fallback)
  const loadMaterialsFromStorage = () => {
    console.log("[Recycle] Carregando materiais do localStorage (fallback)");
    const storedMaterials = getRecycleMaterials();
    console.log("[Recycle] Materiais encontrados no localStorage:", storedMaterials?.length || 0);
    
    if (storedMaterials && storedMaterials.length > 0) {
      // Converter materiais do localStorage para o formato com ícones
      const materialsWithIcons = storedMaterials.map(material => ({
        ...material,
        icon: getIconForMaterial(material.id, material.color)
      }));
      console.log("[Recycle] Atualizando estado com materiais do localStorage:", materialsWithIcons.length);
      setRecyclingMaterials(materialsWithIcons);
    } else {
      console.log("[Recycle] Nenhum material encontrado no localStorage, usando dados padrão");
      // Se não houver materiais no localStorage, usar os dados padrão
      setRecyclingMaterials(defaultRecyclingMaterials);
    }
  };
  
  // Carregar materiais quando a página for montada
  useEffect(() => {
    setRecyclingMaterials([]);
    loadMaterialsFromApi(); // Chama só uma vez ao montar

    // Listener para atualizações reais (ex: cadastro/edição)
    const handleMaterialsUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      // Só recarrega da API se a origem não for fallback nem saveRecycleMaterials
      if (
        detail &&
        detail.source &&
        detail.source !== 'restoreFromBackup' &&
        detail.source !== 'fallback' &&
        detail.source !== 'saveRecycleMaterials'
      ) {
        console.log("[Recycle] Evento de atualização de materiais recebido", detail);
        loadMaterialsFromApi();
      }
    };

    window.addEventListener('recycleMaterialsUpdated', handleMaterialsUpdated);
    console.log("[Recycle] Listener de eventos registrado");

    return () => {
      console.log("[Recycle] Removendo listener de eventos");
      window.removeEventListener('recycleMaterialsUpdated', handleMaterialsUpdated);
    };
  }, []);
  
  // Função para navegar para a página de detalhes
  const handleMaterialClick = (materialId: string) => {
    setLocation(`/recycle/${materialId}`);
  };
  
  return (
    <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      <main className="flex-1 px-4 pt-4 pb-20">
        <h1 className="text-2xl font-bold mb-6">Resíduos que você pode separar para coleta:</h1>
        
        {loading && (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700">{error}</p>
          </div>
        )}
        
        {/* Grid de materiais recicláveis */}
        <div className="grid grid-cols-2 gap-4">
          {recyclingMaterials.map(material => (
            <div 
              key={material.id}
              className="bg-gray-100 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMaterialClick(material.id)}
            >
              <div className="flex flex-col items-center mb-2">
                {material.icon}
                <h3 className="font-bold mt-2">{material.name}</h3>
              </div>
              <p className="text-gray-600 text-sm text-center">
                {material.description}
              </p>
            </div>
          ))}
        </div>
      </main>
      
      {/* Footer navigation */}
      <FooterNavigation />
    </div>
  );
}