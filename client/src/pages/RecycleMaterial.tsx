import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FooterNavigation } from "@/components/FooterNavigation";
import { FileText, Droplet, Wine, Paperclip, Cpu, AlertTriangle, ArrowLeft, Check, X } from "lucide-react";
import { getRecycleMaterials, getRecycleMaterialById, saveRecycleMaterials } from "@/lib/localStorage";
import { RecycleMaterialsApi } from "@/lib/api";

// IMPORTANTE: Dados dos materiais recicláveis - importamos os mesmos dados da página principal
// Estes dados são compartilhados com a página AdminDashboard.tsx
// Ao fazer alterações aqui, considere sincronizar com o painel de administração
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

export default function RecycleMaterial() {
  const { materialId } = useParams();
  const [, setLocation] = useLocation();
  const [recyclingMaterials, setRecyclingMaterials] = useState(defaultRecyclingMaterials);
  const [material, setMaterial] = useState<any>(null);
  const [youtubeId, setYoutubeId] = useState("dQw4w9WgXcQ"); // ID de exemplo
  
  // Função para extrair o ID do YouTube
  const extractYoutubeId = (url: string) => {
    if (!url) {
      console.log("[RecycleMaterial] URL do YouTube vazia");
      return "dQw4w9WgXcQ"; // ID padrão em caso de URL vazia
    }
    
    console.log("[RecycleMaterial] Extraindo ID do YouTube da URL:", url);
    
    try {
      // Verificar se já é uma URL de incorporação
      if (url.includes('youtube.com/embed/')) {
        const embedMatch = url.match(/youtube\.com\/embed\/([^/?&]+)/);
        if (embedMatch && embedMatch[1]) {
          console.log("[RecycleMaterial] ID extraído de URL de incorporação:", embedMatch[1]);
          return embedMatch[1];
        }
      }
      
      // Verificar outros formatos comuns
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/]+)/);
      if (match && match[1]) {
        console.log("[RecycleMaterial] ID extraído de URL padrão:", match[1]);
        return match[1];
      }
      
      console.warn("[RecycleMaterial] Não foi possível extrair ID do YouTube da URL:", url);
      return "dQw4w9WgXcQ"; // ID padrão caso não seja possível extrair
    } catch (error) {
      console.error("[RecycleMaterial] Erro ao extrair ID do YouTube:", error);
      return "dQw4w9WgXcQ"; // ID padrão em caso de erro
    }
  };
  
  // Função para carregar o material específico
  const loadMaterial = async () => {
    if (!materialId) return;
    
    console.log("[RecycleMaterial] Carregando material:", materialId);
    
    try {
      // Tentar carregar da API primeiro
      const materialFromApi = await RecycleMaterialsApi.getMaterialById(materialId);
      
      if (materialFromApi) {
        console.log("[RecycleMaterial] Material encontrado na API:", materialFromApi.name);
        // Adicionar ícone ao material
        const materialWithIcon = {
          ...materialFromApi,
          icon: getIconForMaterial(materialFromApi.id, materialFromApi.color)
        };
        
        setMaterial(materialWithIcon);
        
        // Extrair ID do YouTube se existir
        if (materialFromApi.youtubeUrl) {
          const youtubeIdExtracted = extractYoutubeId(materialFromApi.youtubeUrl);
          console.log("[RecycleMaterial] ID do YouTube extraído:", youtubeIdExtracted);
          if (youtubeIdExtracted) {
            setYoutubeId(youtubeIdExtracted);
          }
        }
        
        // Atualizar o localStorage com o material atualizado
        const storedMaterials = getRecycleMaterials();
        const updatedMaterials = storedMaterials.map(m => 
          m.id === materialId ? materialFromApi : m
        );
        saveRecycleMaterials(updatedMaterials);
        
        return;
      }
    } catch (error) {
      console.error("[RecycleMaterial] Erro ao carregar material da API:", error);
    }
    
    // Se não conseguir da API, tentar do localStorage
    const storedMaterial = getRecycleMaterialById(materialId);
    
    if (storedMaterial) {
      console.log("[RecycleMaterial] Material encontrado no localStorage:", storedMaterial.name);
      // Adicionar ícone ao material
      const materialWithIcon = {
        ...storedMaterial,
        icon: getIconForMaterial(storedMaterial.id, storedMaterial.color)
      };
      
      setMaterial(materialWithIcon);
      
      // Extrair ID do YouTube se existir
      if (storedMaterial.youtubeUrl) {
        const youtubeIdExtracted = extractYoutubeId(storedMaterial.youtubeUrl);
        console.log("[RecycleMaterial] ID do YouTube extraído:", youtubeIdExtracted);
        if (youtubeIdExtracted) {
          setYoutubeId(youtubeIdExtracted);
        }
      }
    } else {
      console.log("[RecycleMaterial] Material não encontrado no localStorage, buscando nos dados padrão");
      // Nenhum material no localStorage, ver se é um dos materiais padrão
      const defaultMaterial = defaultRecyclingMaterials.find(m => m.id === materialId);
      if (defaultMaterial) {
        console.log("[RecycleMaterial] Material encontrado nos dados padrão");
        setMaterial(defaultMaterial);
        
        // Extrair ID do YouTube se existir
        if (defaultMaterial.youtubeUrl) {
          const youtubeIdExtracted = extractYoutubeId(defaultMaterial.youtubeUrl);
          if (youtubeIdExtracted) {
            setYoutubeId(youtubeIdExtracted);
          }
        }
      } else {
        // Se nem mesmo nos dados padrão encontrar, voltar para a página principal
        console.log("[RecycleMaterial] Material não encontrado, redirecionando para a página principal");
        setLocation("/recycle");
      }
    }
  };
  
  // Carregar material quando a página for montada ou o materialId mudar
  useEffect(() => {
    // Limpar estado anterior para evitar problemas
    setMaterial(null);
    
    // Pequeno atraso para garantir a limpeza do estado
    setTimeout(() => {
      loadMaterial();
    }, 50);
    
    // Adicionar listener para atualizações nos materiais
    const handleMaterialsUpdated = (event: Event) => {
      console.log("[RecycleMaterial] Evento de atualização de materiais recebido", (event as CustomEvent).detail);
      
      // Pequeno atraso para garantir que os materiais foram salvos
      setTimeout(() => {
        loadMaterial();
      }, 100);
    };
    
    // Registrar listener para o evento
    window.addEventListener('recycleMaterialsUpdated', handleMaterialsUpdated);
    console.log("[RecycleMaterial] Listener de eventos registrado");
    
    // Limpar listener quando o componente for desmontado
    return () => {
      console.log("[RecycleMaterial] Removendo listener de eventos");
      window.removeEventListener('recycleMaterialsUpdated', handleMaterialsUpdated);
    };
  }, [materialId, setLocation]);
  
  // Se o material não existir, voltar para a página principal
  if (!material) {
    return null; // Aguardando carregamento
  }
  
  return (
    <div className="font-sans bg-white text-[#333333] min-h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      <main className="flex-1 px-4 pt-2 pb-20">
        {/* Botão voltar */}
        <button 
          onClick={() => setLocation("/recycle")} 
          className="text-[#F2994A] mb-4"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        
        {/* Título com ícone */}
        <div className="flex items-center mb-4">
          <div className="mr-3" style={{ color: material.color }}>
            {material.icon}
          </div>
          <h1 className="text-2xl font-bold">{material.name}</h1>
        </div>
        
        {/* Descrição */}
        <p className="text-gray-700 mb-6">
          Aprenda como separar e preparar seus resíduos de {material.name.toLowerCase()} como, {material.description.toLowerCase()}
        </p>
        
        {/* Player de vídeo do YouTube */}
        <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden mb-6 bg-black">
          <iframe 
            src={`https://www.youtube.com/embed/${youtubeId}`} 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
            title={`Como reciclar ${material.name}`}
          />
        </div>
        
        {/* Separação por tipo de material */}
        <h2 className="font-bold text-lg mb-3">1. Separação por Tipo de Material</h2>
        
        {/* Itens recicláveis */}
        <div className="mb-6">
          <h3 className="font-medium flex items-center mb-2">
            <Check size={20} className="text-green-500 mr-2" />
            <span>Recicláveis:</span>
          </h3>
          <ul className="pl-8 space-y-1">
            {material.items.recyclable.map((item, index) => (
              <li key={index} className="text-gray-700 text-sm list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Itens não recicláveis */}
        <div className="mb-6">
          <h3 className="font-medium flex items-center mb-2">
            <X size={20} className="text-red-500 mr-2" />
            <span>Não recicláveis (evite misturar):</span>
          </h3>
          <ul className="pl-8 space-y-1">
            {material.items.nonRecyclable.map((item, index) => (
              <li key={index} className="text-gray-700 text-sm list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Como preparar */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Como Preparar os Materiais:</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            {material.items.howToPrepare.split('\n').map((line, index) => (
              <p key={index} className="text-gray-700 text-sm mb-2">{line}</p>
            ))}
          </div>
        </div>
      </main>
      
      {/* Rodapé de navegação */}
      <FooterNavigation activePage="recycle" />
    </div>
  );
}