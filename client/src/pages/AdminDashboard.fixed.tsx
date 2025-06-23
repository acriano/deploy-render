// Versão corrigida do AdminDashboard
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  BarChart3,
  Users,
  Trash2,
  MapPin,
  Bell,
  Calendar,
  UserPlus,
  LogOut,
  Building,
  X,
  Plus,
  Leaf,
  FileImage,
  Youtube,
  Edit,
  Recycle,
  FileText, 
  Droplet, 
  Wine, 
  Paperclip, 
  Cpu, 
  AlertTriangle,
  Check,
  Save
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { 
  getRecycleMaterials, 
  saveRecycleMaterial, 
  deleteRecycleMaterial,
  saveRecycleMaterials,
  clearStorageLogs,
  RECYCLE_MATERIALS_KEY,
  RECYCLE_MATERIALS_SESSION_KEY,
  type RecycleMaterial as RecycleMaterialType 
} from "../lib/localStorage";
import { RecycleMaterialsApi } from "@/lib/api";

// Definição de interfaces
interface DashboardStats {
  totalCollections: number;
  totalUsers: number;
  activeCollectors: number;
  collectionPoints: number;
}

interface Schedule {
  id: number;
  userId: number;
  userName: string;
  status: string;
  scheduledDate: string;
  materials: string[];
}

interface CollectionPoint {
  id: number;
  name: string;
  shortName?: string;
  address: string;
  latitude: number;
  longitude: number;
  schedule?: string;
  phone?: string;
  website?: string;
  whatsapp?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  createdBy?: number;
  materials: string[];
  acceptedMaterials?: any[];
  imageUrl?: string;
}

interface RecycleCategory {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  youtubeUrl: string;
  tips: string[];
  color: string;
}

interface NotificationItem {
  id: number;
  message: string;
  time: string;
}

interface ScheduleFilters {
  status: string;
  date: string;
  material: string;
}

interface CollectorFilters {
  neighborhood: string;
  availability: string;
}

interface CollectionPointForm {
  name: string;
  shortName: string;
  address: string;
  latitude: string;
  longitude: string;
  schedule: string;
  phone: string;
  whatsapp: string;
  website: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  createdBy?: number;
  image: File | null;
  imagePreview: string;
  materials: {
    papel: boolean;
    plastico: boolean;
    vidro: boolean;
    metal: boolean;
    eletronicos: boolean;
    oleo: boolean;
    outros: boolean;
  };
}

interface RecycleCategoryForm {
  title: string;
  description: string;
  imageUrl: string;
  youtubeUrl: string;
  tips: string[];
  color: string;
}

// Interface RecycleMaterial removida para evitar duplica��o com o tipo importado
}

interface RecycleMaterialForm {
  id: string;
  name: string;
  description: string;
  youtubeUrl: string;
  recyclableItems: string;
  nonRecyclableItems: string;
  howToPrepare: string;
  color: string;
}

// Importar os dados dos materiais recicláveis da página de reciclagem do usuário
const recyclingMaterialsData = [
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
      howToPrepare: "✔️ Desmonte as caixas para economizar espaço\n✔️ Remova restos de comida\n✔️ Separe plásticos e metais (grampos)\n✔️ Guarde em local seco",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // URL de exemplo
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
      howToPrepare: "✔️ Lave as embalagens para remover resíduos\n✔️ Separe tampas das garrafas\n✔️ Amasse garrafas PET para ocupar menos espaço\n✔️ Remova rótulos quando possível",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // URL de exemplo
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
      howToPrepare: "✔️ Retire tampas (elas normalmente são de metal ou plástico)\n✔️ Enxágue bem para remover resíduos\n✔️ Não é necessário remover rótulos\n✔️ Cuidado para não misturar com vidros não recicláveis",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // URL de exemplo
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
      howToPrepare: "✔️ Lave as latas e embalagens\n✔️ Amasse-as para economizar espaço\n✔️ Separe tampas de metal dos vidros\n✔️ Remova restos de alimentos",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // URL de exemplo
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
      howToPrepare: "✔️ Faça backup e delete seus dados pessoais\n✔️ Remova baterias quando possível\n✔️ Procure pontos de coleta específicos\n✔️ Não desmonte equipamentos (especialmente monitores)",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // URL de exemplo
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
      howToPrepare: "✔️ Nunca misture com lixo comum\n✔️ Mantenha em embalagens originais quando possível\n✔️ Procure postos de coleta específicos (farmácias, ecopontos)\n✔️ Não despeje líquidos no ralo ou esgoto",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // URL de exemplo
    }
  }
];

// Dados de exemplo para os gráficos
const monthlyData = [
  { name: 'Jan', coletas: 45, materiais: 120 },
  { name: 'Fev', coletas: 52, materiais: 135 },
  { name: 'Mar', coletas: 48, materiais: 110 },
  { name: 'Abr', coletas: 60, materiais: 150 },
  { name: 'Mai', coletas: 55, materiais: 140 },
  { name: 'Jun', coletas: 65, materiais: 160 },
];

const materialData = [
  { name: 'Papel', value: 35 },
  { name: 'Plástico', value: 25 },
  { name: 'Vidro', value: 20 },
  { name: 'Metal', value: 15 },
  { name: 'Outros', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Modificando a interface RecycleMaterial para usar o tipo importado
type RecycleMaterial = RecycleMaterialType;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para o modal de materiais recicláveis
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [recycleMaterials, setRecycleMaterials] = useState<RecycleMaterial[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState<RecycleMaterialForm>({
    id: '',
    name: '',
    description: '',
    youtubeUrl: '',
    recyclableItems: '',
    nonRecyclableItems: '',
    howToPrepare: '',
    color: '#6CB33F'
  });
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  
  // Estado para debug da API
  const [showDebug, setShowDebug] = useState(false);
  const [apiResponse, setApiResponse] = useState<{url: string; status: number; data: any} | null>(null);
  
  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem("recycleczs_current_user");
    setLocation("/login");
  };

  // Carrega dados específicos quando a aba ativa muda
  useEffect(() => {
    if (activeTab === 'dashboard') {
      // loadDashboardData();
    } else if (activeTab === 'schedules') {
      // loadSchedules();
    } else if (activeTab === 'collection-points') {
      fetchCollectionPoints();
    } else if (activeTab === 'recycle-materials') {
      fetchRecycleMaterials();
    }
  }, [activeTab]);

  const fetchCollectionPoints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/collection-points');

      if (!response.ok) {
        throw new Error(`Erro ao carregar pontos de coleta: ${response.status}`);
      }

      const data = await response.json();
      setCollectionPoints(data);
    } catch (err) {
      console.error('Erro ao buscar pontos de coleta:', err);
      setError('Não foi possível carregar os pontos de coleta. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar os materiais recicláveis
  const fetchRecycleMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("[AdminDashboard] Carregando materiais recicláveis da API");
      
      const apiMaterials = await RecycleMaterialsApi.getAllMaterials();
      
      if (apiMaterials && apiMaterials.length > 0) {
        console.log("[AdminDashboard] Encontrados materiais na API:", apiMaterials.length);
        setRecycleMaterials(apiMaterials);
      } else {
        console.log("[AdminDashboard] Nenhum material encontrado na API, carregando dados padrão");
        loadDefaultMaterials();
      }
    } catch (err) {
      console.error('[AdminDashboard] Erro ao buscar materiais recicláveis da API:', err);
      setError('Não foi possível carregar os materiais recicláveis. Tentando carregar do localStorage...');
      
      // Tentar obter materiais do localStorage como fallback
      const storedMaterials = getRecycleMaterials();
      if (storedMaterials && storedMaterials.length > 0) {
        console.log("[AdminDashboard] Encontrados materiais no localStorage:", storedMaterials.length);
        setRecycleMaterials(storedMaterials);
      } else {
        // Em caso de erro completo, carregar dados padrão
        loadDefaultMaterials();
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Função para carregar os materiais padrão
  const loadDefaultMaterials = () => {
    try {
      console.log("[AdminDashboard] Carregando dados padrão dos materiais");
      
      // Converter os dados de materiais recicláveis do usuário para o formato esperado pelo admin
      const mappedMaterials = recyclingMaterialsData.map(material => ({
        id: material.id,
        name: material.name,
        description: material.description,
        youtubeUrl: material.youtubeUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        items: {
          recyclable: material.items.recyclable,
          nonRecyclable: material.items.nonRecyclable,
          howToPrepare: material.items.howToPrepare
        },
        color: material.color
      }));
      
      // Salvar no localStorage para uso futuro
      console.log("[AdminDashboard] Salvando dados padrão no localStorage:", mappedMaterials.length, "materiais");
      const saveResult = saveRecycleMaterials(mappedMaterials);
      
      if (!saveResult) {
        console.error("[AdminDashboard] Erro ao salvar dados padrão no localStorage");
      } else {
        console.log("[AdminDashboard] Dados padrão salvos com sucesso no localStorage");
      }
      
      // Atualizar o estado
      setRecycleMaterials(mappedMaterials);
      
      // Verificar se os dados foram realmente salvos
      setTimeout(() => {
        const verifyMaterials = getRecycleMaterials();
        console.log("[AdminDashboard] Verificação após salvamento de dados padrão:", 
          verifyMaterials.length, "materiais encontrados");
      }, 100);
    } catch (error) {
      console.error("[AdminDashboard] Erro ao carregar dados padrão:", error);
    }
  };

  // Função para testar a conexão com a API
  const testApiConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recycle-materials', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const contentType = response.headers.get('content-type');
      let responseData;
      
      try {
        responseData = await response.json();
      } catch (error) {
        const text = await response.text();
        responseData = { text: text.substring(0, 500) + (text.length > 500 ? '...' : '') };
      }
      
      setApiResponse({
        url: '/api/recycle-materials',
        status: response.status,
        data: responseData
      });
      
    } catch (error) {
      console.error('Erro ao testar API:', error);
      setApiResponse({
        url: '/api/recycle-materials',
        status: 0,
        data: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para testar o endpoint de debug
  const testDebugEndpoint = async () => {
    try {
      setLoading(true);
      console.log("Testando endpoint /api/debug...");
      
      // Tentar com modo raw (usando XMLHttpRequest)
      console.log("Tentando com XMLHttpRequest...");
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/debug", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Accept", "application/json");
      
      xhr.onload = async () => {
        try {
          console.log("XMLHttpRequest status:", xhr.status);
          console.log("XMLHttpRequest resposta:", xhr.responseText);
          
          // Agora tentando com fetch
          console.log("\nAgora tentando com fetch...");
          
          const fetchResponse = await fetch('/api/debug', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          console.log("Fetch status:", fetchResponse.status);
          console.log("Fetch headers:", fetchResponse.headers);
          
          const contentType = fetchResponse.headers.get('content-type');
          console.log("Content-Type:", contentType);
          
          try {
            const responseData = await fetchResponse.json();
            console.log("Dados JSON do fetch:", responseData);
            
            setApiResponse({
              url: '/api/debug',
              status: fetchResponse.status,
              data: responseData
            });
          } catch (jsonError) {
            console.error("Erro ao parsear JSON do fetch:", jsonError);
            const text = await fetchResponse.text();
            setApiResponse({
              url: '/api/debug',
              status: fetchResponse.status,
              data: { 
                parseError: jsonError instanceof Error ? jsonError.message : 'Erro ao parsear JSON',
                text: text.substring(0, 500) + (text.length > 500 ? '...' : '') 
              }
            });
          }
        } catch (innerError) {
          console.error("Erro durante o teste:", innerError);
          setApiResponse({
            url: '/api/debug',
            status: xhr.status,
            data: { error: innerError instanceof Error ? innerError.message : 'Erro desconhecido durante teste' }
          });
        } finally {
          setLoading(false);
        }
      };
      
      xhr.onerror = () => {
        console.error("XMLHttpRequest falhou completamente");
        setApiResponse({
          url: '/api/debug',
          status: 0,
          data: { error: "Falha completa na requisição XMLHttpRequest" }
        });
        setLoading(false);
      };
      
      xhr.send();
    } catch (error) {
      console.error('Erro ao testar endpoint de debug:', error);
      setApiResponse({
        url: '/api/debug',
        status: 0,
        data: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
      });
      setLoading(false);
    }
  };

  // Renderiza o componente de pontos de coleta
  const renderCollectionPoints = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Pontos de Coleta</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#6CB33F] text-white px-4 py-2 rounded-md flex items-center hover:bg-[#5AA32E]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Ponto
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6CB33F]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p>{error}</p>
            <button 
              onClick={fetchRecycleMaterials}
              className="mt-2 text-sm text-red-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collectionPoints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhum ponto de coleta cadastrado.
                    </td>
                  </tr>
                ) : (
                  collectionPoints.map((point) => (
                    <tr key={point.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{point.name}</div>
                        {point.shortName && (
                          <div className="text-xs text-gray-500">{point.shortName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{point.address}</div>
                        <div className="text-xs text-gray-500">
                          Lat: {point.latitude.toFixed(6)}, Long: {point.longitude.toFixed(6)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {point.phone && (
                          <div className="text-sm text-gray-900">📞 {point.phone}</div>
                        )}
                        {point.whatsapp && (
                          <div className="text-sm text-gray-900">📱 {point.whatsapp}</div>
                        )}
                        {point.website && (
                          <div className="text-xs text-blue-500 underline">
                            <a href={point.website} target="_blank" rel="noopener noreferrer">
                              Website
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          point.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {point.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditPoint(point)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeletePoint(point.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Funções para gerenciar os pontos de coleta
  const handleEditPoint = (point: CollectionPoint) => {
    // Preencher o formulário com os dados do ponto
    setFormData({
          name: point.name,
      shortName: point.shortName || '',
          address: point.address,
      latitude: point.latitude.toString(),
      longitude: point.longitude.toString(),
      schedule: point.schedule || '',
      phone: point.phone || '',
      whatsapp: point.whatsapp || '',
      website: point.website || '',
      description: point.description || '',
      isActive: point.isActive,
      image: null,
      imagePreview: point.imageUrl || '',
      materials: {
        papel: point.acceptedMaterials?.some(m => m.materialType === 'papel') || false,
        plastico: point.acceptedMaterials?.some(m => m.materialType === 'plastico') || false,
        vidro: point.acceptedMaterials?.some(m => m.materialType === 'vidro') || false,
        metal: point.acceptedMaterials?.some(m => m.materialType === 'metal') || false,
        eletronicos: point.acceptedMaterials?.some(m => m.materialType === 'eletronicos') || false,
        oleo: point.acceptedMaterials?.some(m => m.materialType === 'oleo') || false,
        outros: point.acceptedMaterials?.some(m => m.materialType === 'outros') || false
      }
    });
    
    // Define o ponto selecionado e o modo de edição
    setSelectedPoint(point);
    setIsEditing(true);
    setShowModal(true);
    
    console.log("Editando ponto:", point);
  };

  const handleDeletePoint = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este ponto de coleta?')) {
      return;
    }

    try {
      const response = await fetch(`/api/collection-points/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir ponto de coleta: ${response.status}`);
      }

      // Atualizar a lista removendo o ponto excluído
      setCollectionPoints(collectionPoints.filter(point => point.id !== id));
      alert('Ponto de coleta excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir ponto de coleta:', err);
      alert('Erro ao excluir o ponto de coleta. Tente novamente.');
    }
  };

  // Estados para o formulário de ponto de coleta
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CollectionPointForm>({
    name: '',
    shortName: '',
    address: '',
    latitude: '',
    longitude: '',
    schedule: '',
    phone: '',
    whatsapp: '',
    website: '',
    description: '',
    isActive: true,
    image: null,
    imagePreview: '',
    materials: {
      papel: false,
      plastico: false,
      vidro: false,
      metal: false,
      eletronicos: false,
      oleo: false,
      outros: false
    }
  });

  // Funções para manipular o formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name.startsWith('material-')) {
        const material = name.replace('material-', '');
        setFormData({
          ...formData,
          materials: {
            ...formData.materials,
            [material]: checked
          }
        });
      } else {
        setFormData({
          ...formData,
          [name]: checked
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      shortName: '',
      address: '',
      latitude: '',
      longitude: '',
      schedule: '',
      phone: '',
      whatsapp: '',
      website: '',
      description: '',
      isActive: true,
      image: null,
      imagePreview: '',
      materials: {
        papel: false,
        plastico: false,
        vidro: false,
        metal: false,
        eletronicos: false,
        oleo: false,
        outros: false
      }
    });
    setSelectedPoint(null);
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const pointData = {
        name: formData.name,
        shortName: formData.shortName || null,
        address: formData.address,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        schedule: formData.schedule || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        website: formData.website || null,
        description: formData.description || null,
        isActive: formData.isActive
      };

      let response;
      let savedPoint;
      
      try {
        if (isEditing && selectedPoint) {
          // Atualizar ponto existente
          console.log('Enviando requisição PATCH para atualizar ponto:', selectedPoint.id);
          console.log('Dados de atualização:', pointData);
          
          response = await fetch(`/api/collection-points/${selectedPoint.id}`, {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pointData)
          });
        } else {
          // Criar novo ponto
          console.log('Enviando requisição POST para criar novo ponto');
          console.log('Dados do novo ponto:', pointData);
          
          response = await fetch('/api/collection-points', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pointData)
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Erro na resposta (${response.status}):`, errorData);
          throw new Error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} ponto de coleta: ${response.status} - ${errorData.error || errorData.message || 'Erro desconhecido'}`);
        }

        savedPoint = await response.json();
        console.log('Ponto salvo com sucesso:', savedPoint);
      } catch (fetchError) {
        console.error('Erro ao fazer requisição para ponto de coleta:', fetchError);
        throw fetchError;
      }
      
      // Upload da imagem se existir
      if (formData.image) {
        try {
          console.log('Iniciando upload de imagem...');
          const formDataImg = new FormData();
          formDataImg.append('image', formData.image);
          
          const imageResponse = await fetch(`/api/collection-points/${savedPoint.id}/image`, {
        method: 'POST',
            body: formDataImg
          });
          
          if (!imageResponse.ok) {
            const errorData = await imageResponse.text();
            console.warn('Alerta: Falha ao enviar imagem do ponto de coleta:', errorData);
      } else {
            const imageResult = await imageResponse.json();
            console.log('Imagem enviada com sucesso!', imageResult);
          }
        } catch (imageError) {
          console.error('Erro ao fazer upload de imagem:', imageError);
          // Continuar mesmo com erro na imagem
        }
      }
      
      // Recarregar a lista de pontos
      await fetchCollectionPoints();
      
      // Fechar o modal e resetar o formulário
      setShowModal(false);
      resetForm();
      
      alert(`Ponto de coleta ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
    } catch (err: unknown) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} ponto de coleta:`, err);
      alert(`Erro ao ${isEditing ? 'atualizar' : 'criar'} o ponto de coleta: ${err instanceof Error ? err.message : 'Erro desconhecido'}. Tente novamente.`);
    }
  };

  // Funções para gerenciar o modal de materiais recicláveis
  const handleEditMaterial = (material: RecycleMaterial) => {
    console.log("[AdminDashboard] Iniciando edição de material:", material.id);
    console.log("[AdminDashboard] Dados completos do material:", JSON.stringify(material, null, 2));
    
    // Preparar os dados para edição
    const recyclableItemsStr = Array.isArray(material.items.recyclable) 
      ? material.items.recyclable.join('\n') 
      : '';
    
    const nonRecyclableItemsStr = Array.isArray(material.items.nonRecyclable) 
      ? material.items.nonRecyclable.join('\n') 
      : '';
    
    // Garantir que a URL do YouTube esteja presente
    const youtubeUrl = material.youtubeUrl || '';
    console.log("[AdminDashboard] URL do YouTube a ser editada:", youtubeUrl);
    
    const materialForm: RecycleMaterialForm = {
      id: material.id,
      name: material.name,
      description: material.description,
      youtubeUrl: youtubeUrl,
      recyclableItems: recyclableItemsStr,
      nonRecyclableItems: nonRecyclableItemsStr,
      howToPrepare: material.items.howToPrepare || '',
      color: material.color || '#6CB33F'
    };
    
    console.log("[AdminDashboard] Formulário preparado para edição:", materialForm);
    
    setCurrentMaterial(materialForm);
    setIsEditingMaterial(true);
    setShowMaterialModal(true);
  };
  
  const handleNewMaterial = () => {
    setIsEditingMaterial(false);
    setCurrentMaterial({
      id: '',
      name: '',
      description: '',
      youtubeUrl: '',
      recyclableItems: '',
      nonRecyclableItems: '',
      howToPrepare: '',
      color: '#6CB33F'
    });
    setShowMaterialModal(true);
  };
  
  const handleMaterialFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentMaterial({
      ...currentMaterial,
      [name]: value
    });
  };
  
  const handleCloseMaterialModal = () => {
    setShowMaterialModal(false);
  };
  
  // Função para excluir um material reciclável
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm(`Tem certeza que deseja excluir o material '${materialId}'?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Excluir material via API
      console.log("[AdminDashboard] Excluindo material via API:", materialId);
      await RecycleMaterialsApi.deleteMaterial(materialId);
      
      // Recarregar lista de materiais da API
      await fetchRecycleMaterials();
      
      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent('recycleMaterialsUpdated', {
        detail: { action: 'delete', materialId }
      }));
      
      // Exibir mensagem de sucesso
      setApiResponse({
        url: `/api/recycle-materials/${materialId}`,
        status: 200,
        data: { message: "Material excluído com sucesso" }
      });
      
    } catch (error: any) {
      console.error('[AdminDashboard] Erro ao excluir material:', error);
      alert(`Erro ao excluir material: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Função para enviar o formulário de material reciclável
  const handleSubmitMaterialForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar campos obrigatórios
      if (!currentMaterial.name || !currentMaterial.description) {
        alert('Preencha todos os campos obrigatórios.');
        return;
      }
      
      // Gerar ID se for um novo material
      const materialId = currentMaterial.id || currentMaterial.name.toLowerCase().replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') // Remover caracteres especiais
        .replace(/-+/g, '-'); // Evitar múltiplos hífens
      
      console.log("[AdminDashboard] Dados do formulário:", currentMaterial);
      
      // Tratar a URL do YouTube
      let youtubeUrl = currentMaterial.youtubeUrl || '';
      
      // Tentar normalizar a URL do YouTube
      if (youtubeUrl && !youtubeUrl.includes('youtube.com/embed/')) {
        // Extrair o ID do vídeo de diferentes formatos de URL
        const youtubeIdMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        if (youtubeIdMatch && youtubeIdMatch[1]) {
          const videoId = youtubeIdMatch[1];
          youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
          console.log("[AdminDashboard] URL do YouTube normalizada:", youtubeUrl);
        }
      }
      
      // Preparar dados para a API
      const materialData: RecycleMaterial = {
        id: materialId,
        name: currentMaterial.name,
        description: currentMaterial.description,
        youtubeUrl: youtubeUrl,
        color: currentMaterial.color || '#6CB33F',
        items: {
          recyclable: currentMaterial.recyclableItems.split('\n').filter(item => item.trim() !== ''),
          nonRecyclable: currentMaterial.nonRecyclableItems.split('\n').filter(item => item.trim() !== ''),
          howToPrepare: currentMaterial.howToPrepare || ''
        }
      };
      
      setLoading(true);
      
      let updatedMaterial;
      
      if (isEditingMaterial) {
        // Atualizar material existente via API
        console.log("[AdminDashboard] Atualizando material existente via API:", materialId);
        updatedMaterial = await RecycleMaterialsApi.updateMaterial(materialId, materialData);
        console.log("[AdminDashboard] Material atualizado com sucesso:", updatedMaterial);
      } else {
        // Criar novo material via API
        console.log("[AdminDashboard] Criando novo material via API");
        updatedMaterial = await RecycleMaterialsApi.createMaterial(materialData);
        console.log("[AdminDashboard] Material criado com sucesso:", updatedMaterial);
      }
      
      // Recarregar lista de materiais da API
      await fetchRecycleMaterials();
      
      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent('recycleMaterialsUpdated', {
        detail: { action: isEditingMaterial ? 'update' : 'create', materialId }
      }));
      
      // Fechar o modal
      handleCloseMaterialModal();
      
      // Exibir mensagem de sucesso
      setApiResponse({
        url: isEditingMaterial ? `/api/recycle-materials/${materialId}` : `/api/recycle-materials`,
        status: 200,
        data: updatedMaterial
      });
      
    } catch (error: any) {
      console.error('[AdminDashboard] Erro ao salvar material:', error);
      alert(`Erro ao salvar material: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Função auxiliar para obter mensagem de erro
  const getErrorMessage = () => {
    try {
      // Tentar acessar a API apenas para teste de conectividade
      fetch('/api/ping', { method: 'GET' })
        .catch(e => console.log('Erro de conectividade:', e));
      
      return "Servidor indisponível ou problemas de rede";
    } catch (e) {
      return "Erro de conectividade";
    }
  };
  
  // Função para forçar sincronização de materiais
  const forceSyncMaterials = async () => {
    try {
      console.log("[AdminDashboard] Forçando sincronização de materiais com a API");
      setLoading(true);
      
      // Buscar materiais da API
      const apiMaterials = await RecycleMaterialsApi.getAllMaterials();
      
      if (apiMaterials && apiMaterials.length > 0) {
        console.log("[AdminDashboard] Materiais sincronizados com sucesso da API:", apiMaterials.length);
        setRecycleMaterials(apiMaterials);
        
        // Disparar evento de atualização
        window.dispatchEvent(new CustomEvent('recycleMaterialsUpdated', {
          detail: { action: 'sync', count: apiMaterials.length }
        }));
        
        alert(`Sincronização concluída! ${apiMaterials.length} materiais carregados da API.`);
      } else {
        console.warn("[AdminDashboard] Nenhum material encontrado na API durante a sincronização");
        alert("Nenhum material encontrado na API. A sincronização não foi necessária.");
      }
    } catch (error: any) {
      console.error('[AdminDashboard] Erro ao sincronizar materiais:', error);
      alert(`Erro ao sincronizar materiais: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Renderiza o componente de materiais recicláveis
  const renderRecycleMaterials = () => {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Materiais Recicláveis</h2>
          <div className="flex space-x-2">
            <button
              onClick={forceSyncMaterials}
              className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
              title="Força a sincronização dos materiais entre localStorage, sessionStorage e páginas"
            >
              <Save size={18} className="mr-1" /> Sincronizar
            </button>
            <button
              onClick={handleNewMaterial}
              className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Plus size={18} className="mr-1" /> Novo Material
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Carregando materiais...</div>
        ) : error ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recycleMaterials.map((material) => (
              <div
                key={material.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border ${
                  material.id === 'perigosos' 
                    ? 'border-red-300 ring-2 ring-red-200' 
                    : 'border-gray-200'
                }`}
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${material.color}20` }}
                    >
                      {material.id === 'perigosos' ? (
                        <AlertTriangle
                          size={24}
                          style={{ color: material.color }}
                        />
                      ) : (
                        <Recycle
                          size={24}
                          style={{ color: material.color }}
                        />
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditMaterial(material)}
                        className="p-1 rounded-full hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit size={18} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-1 rounded-full hover:bg-gray-100"
                        title="Excluir"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{material.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {material.description}
                  </p>
                </div>
                
                {/* Exibir itens recicláveis e não recicláveis */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold flex items-center mb-1">
                      <Check size={16} className="text-green-500 mr-1" />
                      Recicláveis:
                    </h4>
                    <ul className="text-xs text-gray-600 pl-5 list-disc">
                      {material.items.recyclable && Array.isArray(material.items.recyclable) && 
                        material.items.recyclable.slice(0, 3).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))
                      }
                      {material.items.recyclable && Array.isArray(material.items.recyclable) && 
                        material.items.recyclable.length > 3 && (
                          <li className="text-blue-500">+ {material.items.recyclable.length - 3} mais</li>
                        )
                      }
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold flex items-center mb-1">
                      <X size={16} className="text-red-500 mr-1" />
                      Não recicláveis:
                    </h4>
                    <ul className="text-xs text-gray-600 pl-5 list-disc">
                      {material.items.nonRecyclable && Array.isArray(material.items.nonRecyclable) && 
                        material.items.nonRecyclable.slice(0, 3).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))
                      }
                      {material.items.nonRecyclable && Array.isArray(material.items.nonRecyclable) && 
                        material.items.nonRecyclable.length > 3 && (
                          <li className="text-blue-500">+ {material.items.nonRecyclable.length - 3} mais</li>
                        )
                      }
                    </ul>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Youtube size={14} className="mr-1" />
                      {material.youtubeUrl ? "Tem vídeo" : "Sem vídeo"}
                    </span>
                    <span className="flex items-center">
                      <FileText size={14} className="mr-1" />
                      {material.items.howToPrepare ? "Instruções disponíveis" : "Sem instruções"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {recycleMaterials.length === 0 && !loading && !error && (
          <div className="text-center py-8 text-gray-500">
            Nenhum material reciclável cadastrado. Clique em "Novo Material" para adicionar.
          </div>
        )}
      </div>
    );
  };

  // Renderiza o componente de debug
  const renderDebug = () => {
    return (
      <div className="mb-6">
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="mb-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          {showDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
        </button>
        
        {showDebug && (
          <div className="bg-gray-100 border rounded p-4">
            <h3 className="font-bold mb-2">Debug de API</h3>
            <div className="flex space-x-2 mb-3">
              <button 
                onClick={testApiConnection} 
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                disabled={loading}
              >
                Testar API
              </button>
              <button 
                onClick={fetchRecycleMaterials} 
                className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                disabled={loading}
              >
                Carregar Materiais
              </button>
              <button 
                onClick={testDebugEndpoint} 
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
                disabled={loading}
              >
                Testar Debug
              </button>
            </div>
            
            {loading && <p>Carregando...</p>}
            
            {apiResponse && (
              <div className="overflow-x-auto">
                <h4 className="font-semibold">Última resposta da API:</h4>
                <p>URL: {apiResponse.url}</p>
                <p>Status: {apiResponse.status}</p>
                <div className="mt-2">
                  <p className="font-semibold">Dados:</p>
                  <pre className="bg-gray-700 text-white p-2 rounded text-xs max-h-40 overflow-y-auto">
                    {JSON.stringify(apiResponse.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Nova seção de debug do localStorage */}
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2">Debug de Armazenamento</h4>
              <div className="flex space-x-2 mb-3">
                <button 
                  onClick={checkStorage} 
                  className="px-3 py-1 bg-indigo-500 text-white rounded text-sm"
                >
                  Verificar Storage
                </button>
                <button 
                  onClick={exportStorageData} 
                  className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
                >
                  Exportar Dados
                </button>
                <button 
                  onClick={() => clearStorageLogs()} 
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                >
                  Limpar Logs
                </button>
              </div>
              <div className="overflow-x-auto mb-2">
                <h4 className="text-sm font-semibold">Status:</h4>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${checkLocalStorage() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs">localStorage</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${checkSessionStorage() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs">sessionStorage</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Materiais: {recycleMaterials.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Funções auxiliares para debug de storage
  const checkLocalStorage = () => {
    try {
      localStorage.setItem('__test__', 'test');
      const result = localStorage.getItem('__test__') === 'test';
      localStorage.removeItem('__test__');
      return result;
    } catch (e) {
      return false;
    }
  };
  
  const checkSessionStorage = () => {
    try {
      sessionStorage.setItem('__test__', 'test');
      const result = sessionStorage.getItem('__test__') === 'test';
      sessionStorage.removeItem('__test__');
      return result;
    } catch (e) {
      return false;
    }
  };
  
  const checkStorage = () => {
    try {
      console.log('--- Verificação de Armazenamento ---');
      console.log('localStorage disponível:', checkLocalStorage());
      console.log('sessionStorage disponível:', checkSessionStorage());
      
      // Verificar dados no localStorage
      const lsData = localStorage.getItem(RECYCLE_MATERIALS_KEY);
      console.log('localStorage - materiais:', lsData ? JSON.parse(lsData).length : 'nenhum');
      
      // Verificar dados no sessionStorage
      const ssData = sessionStorage.getItem('recycleczs_materials_session');
      console.log('sessionStorage - materiais:', ssData ? JSON.parse(ssData).length : 'nenhum');
      
      // Verificar consistência
      if (lsData && ssData) {
        console.log('Dados consistentes entre storages:', lsData === ssData);
      }
      
      alert('Verificação de armazenamento concluída. Veja o console para detalhes.');
    } catch (e) {
      console.error('Erro ao verificar armazenamento:', e);
      alert('Erro ao verificar armazenamento: ' + (e instanceof Error ? e.message : String(e)));
    }
  };
  
  const exportStorageData = () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        localStorage: null as any,
        sessionStorage: null as any,
        stateData: recycleMaterials
      };
      
      try {
        const lsData = localStorage.getItem(RECYCLE_MATERIALS_KEY);
        exportData.localStorage = lsData ? JSON.parse(lsData) : null;
      } catch (e) {
        exportData.localStorage = { error: String(e) };
      }
      
      try {
        const ssData = sessionStorage.getItem('recycleczs_materials_session');
        exportData.sessionStorage = ssData ? JSON.parse(ssData) : null;
      } catch (e) {
        exportData.sessionStorage = { error: String(e) };
      }
      
      console.log('Dados exportados:', exportData);
      
      // Criar um elemento para download
      const element = document.createElement('a');
      const file = new Blob(
        [JSON.stringify(exportData, null, 2)], 
        {type: 'application/json'}
      );
      element.href = URL.createObjectURL(file);
      element.download = `recycleczs-storage-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      console.error('Erro ao exportar dados:', e);
      alert('Erro ao exportar dados: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-[#6CB33F]">Painel Administrativo - RecycleCZS</h1>
            <p className="text-sm text-gray-600">Versão 1.0.1</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center w-full p-2 rounded-lg ${
                activeTab === 'dashboard' 
                  ? 'bg-[#6CB33F] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('collection-points')}
              className={`flex items-center w-full p-2 rounded-lg ${
                activeTab === 'collection-points' 
                  ? 'bg-[#6CB33F] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Building className="w-5 h-5 mr-2" />
              Pontos de Coleta
            </button>

            <button
              onClick={() => setActiveTab('schedules')}
              className={`flex items-center w-full p-2 rounded-lg ${
                activeTab === 'schedules' 
                  ? 'bg-[#6CB33F] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendamentos
            </button>
            
            <button
              onClick={() => setActiveTab('recycle-materials')}
              className={`flex items-center w-full p-2 rounded-lg ${
                activeTab === 'recycle-materials' 
                  ? 'bg-[#6CB33F] text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Recycle className="w-5 h-5 mr-2" />
              Materiais Recicláveis
            </button>
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-2 text-red-600 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="ml-64 p-8">
        {renderDebug()}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
            
            {/* Cards Estatísticos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Trash2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500">Total de Coletas</p>
                    <p className="text-2xl font-bold">325</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500">Usuários Cadastrados</p>
                    <p className="text-2xl font-bold">1234</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <UserPlus className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500">Catadores Ativos</p>
                    <p className="text-2xl font-bold">45</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500">Pontos de Coleta</p>
                    <p className="text-2xl font-bold">28</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
              <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 border rounded-lg">
                  <Bell className="w-5 h-5 text-yellow-500 mr-4" />
                  <div className="flex-1">
                    <p className="text-gray-800">Novo agendamento pendente de confirmação</p>
                    <p className="text-sm text-gray-500">10 min atrás</p>
                </div>
                  <button className="text-[#6CB33F] hover:text-[#5AA32E]">
                    Ver detalhes
                  </button>
              </div>
                <div className="flex items-center p-4 border rounded-lg">
                  <Bell className="w-5 h-5 text-yellow-500 mr-4" />
                  <div className="flex-1">
                    <p className="text-gray-800">Coleta não realizada no ponto X</p>
                    <p className="text-sm text-gray-500">1 hora atrás</p>
                  </div>
                  <button className="text-[#6CB33F] hover:text-[#5AA32E]">
                    Ver detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collection-points' && renderCollectionPoints()}
        
        {activeTab === 'recycle-materials' && renderRecycleMaterials()}

        {activeTab === 'schedules' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Agendamentos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full h-16 border-b border-gray-200">
                    <th className="text-left pl-4">ID</th>
                    <th className="text-left">Usuário</th>
                    <th className="text-left">Data</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Materiais</th>
                    <th className="text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-20 border-b border-gray-200">
                    <td className="pl-4">1</td>
                    <td>João Silva</td>
                    <td>15/11/2023</td>
                    <td>
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        pendente
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Papel
                            </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Plástico
                        </span>
                        </div>
                      </td>
                      <td>
                          <button className="p-1 text-blue-600 hover:text-blue-800">
                            Ver Detalhes
                          </button>
                      </td>
                    </tr>
                  <tr className="h-20 border-b border-gray-200">
                    <td className="pl-4">2</td>
                    <td>Maria Souza</td>
                    <td>10/11/2023</td>
                    <td>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        concluído
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Vidro
                            </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Metal
                        </span>
                        </div>
                      </td>
                      <td>
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        Ver Detalhes
                          </button>
                      </td>
                    </tr>
                </tbody>
              </table>
                  </div>
                </div>
              )}
            </div>

      {/* Modal para adicionar/editar ponto de coleta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {isEditing ? 'Editar Ponto de Coleta' : 'Novo Ponto de Coleta'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                        required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                      />
                    </div>

                    <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome Curto
                      </label>
                      <input
                        type="text"
                        name="shortName"
                    value={formData.shortName}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                  />
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Endereço <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                      required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                  <label className="block text-sm font-medium text-gray-700">
                        Latitude
                      </label>
                      <input
                        type="text"
                        name="latitude"
                    value={formData.latitude}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                      />
                    </div>

                    <div>
                  <label className="block text-sm font-medium text-gray-700">
                        Longitude
                      </label>
                      <input
                        type="text"
                        name="longitude"
                    value={formData.longitude}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                  />
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                      Horário de Funcionamento
                    </label>
                    <input
                      type="text"
                      name="schedule"
                  value={formData.schedule}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                  placeholder="Ex: Segunda a Sexta: 8h às 18h"
                    />
                  </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                  <label className="block text-sm font-medium text-gray-700">
                        Telefone
                      </label>
                      <input
                        type="text"
                        name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                      />
                    </div>

                    <div>
                  <label className="block text-sm font-medium text-gray-700">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                  />
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                    </label>
                    <input
                    type="text"
                      name="website"
                    value={formData.website}
                    onChange={handleFormChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                    />
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                      rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                    />
                  </div>

              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagem do Local
                    </label>
                <div className="mt-1 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {formData.imagePreview ? (
                      <div className="relative h-32 w-32 overflow-hidden rounded-md border border-gray-300">
                        <img
                          src={formData.imagePreview}
                            alt="Preview"
                          className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                          onClick={() => setFormData({...formData, image: null, imagePreview: ''})}
                          className="absolute top-1 right-1 rounded-full bg-gray-800 bg-opacity-75 p-1 text-white hover:bg-opacity-100"
                        >
                          <X className="h-4 w-4" />
                          </button>
                        </div>
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-md border border-gray-300 bg-gray-50">
                        <FileImage className="h-12 w-12 text-gray-400" />
                      </div>
                      )}
                    </div>
                  <div className="flex-grow">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-medium text-[#6CB33F] shadow-sm border border-[#6CB33F] hover:bg-[#f5fbf5]"
                    >
                      {isEditing && formData.imagePreview ? 'Alterar imagem' : 'Escolher imagem'}
                        </label>
                        <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      PNG, JPG, GIF até 10MB
                    </p>
                      </div>
                </div>
              </div>
              
                      <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materiais Aceitos
                        </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="flex items-center">
                        <input
                      type="checkbox"
                      name="material-papel"
                      checked={formData.materials.papel}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-[#6CB33F] rounded border-gray-300 focus:ring-[#6CB33F]"
                    />
                    <label className="ml-2 text-sm text-gray-700">Papel</label>
                      </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                      name="material-plastico"
                      checked={formData.materials.plastico}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-[#6CB33F] rounded border-gray-300 focus:ring-[#6CB33F]"
                    />
                    <label className="ml-2 text-sm text-gray-700">Plástico</label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                      name="material-vidro"
                      checked={formData.materials.vidro}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-[#6CB33F] rounded border-gray-300 focus:ring-[#6CB33F]"
                    />
                    <label className="ml-2 text-sm text-gray-700">Vidro</label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                      name="material-metal"
                      checked={formData.materials.metal}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-[#6CB33F] rounded border-gray-300 focus:ring-[#6CB33F]"
                    />
                    <label className="ml-2 text-sm text-gray-700">Metal</label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                      name="material-eletronicos"
                      checked={formData.materials.eletronicos}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-[#6CB33F] rounded border-gray-300 focus:ring-[#6CB33F]"
                    />
                    <label className="ml-2 text-sm text-gray-700">Eletrônicos</label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                      name="material-oleo"
                      checked={formData.materials.oleo}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-[#6CB33F] rounded border-gray-300 focus:ring-[#6CB33F]"
                    />
                    <label className="ml-2 text-sm text-gray-700">Óleo</label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                      name="material-outros"
                      checked={formData.materials.outros}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-[#6CB33F] rounded border-gray-300 focus:ring-[#6CB33F]"
                    />
                    <label className="ml-2 text-sm text-gray-700">Outros</label>
                  </div>
                </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-[#6CB33F] rounded border-gray-300 focus:ring-[#6CB33F]"
                />
                <label className="ml-2 text-sm text-gray-700">Ativo</label>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-md flex items-center ${
                    isEditing
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-[#6CB33F] hover:bg-[#5AA32E]'
                    }`}
                >
                  {isEditing ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Atualizar
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
                </div>
      )}
      
      {/* Modal para adicionar/editar material reciclável */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {isEditingMaterial ? 'Editar Material Reciclável' : 'Novo Material Reciclável'}
              </h3>
              <button
                onClick={handleCloseMaterialModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitMaterialForm} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome do Material <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentMaterial.name}
                    onChange={handleMaterialFormChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                    placeholder="Ex: Papel, Plástico, Vidro, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição Breve <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={currentMaterial.description}
                    onChange={handleMaterialFormChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                    placeholder="Breve descrição do material"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Link de Vídeo do YouTube
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      name="youtubeUrl"
                      value={currentMaterial.youtubeUrl}
                      onChange={handleMaterialFormChange}
                      className={`block w-full rounded-md border-gray-300 pr-36 focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm ${
                        currentMaterial.youtubeUrl ? 'border-green-300 bg-green-50' : 'border-gray-300'
                      }`}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {currentMaterial.youtubeUrl && (
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                          URL definida
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex flex-col">
                    <p>Cole o link completo do YouTube. Qualquer formato é aceito:</p>
                    <code className="bg-gray-100 p-1 rounded text-xs mt-1">https://www.youtube.com/watch?v=dQw4w9WgXcQ</code>
                    <code className="bg-gray-100 p-1 rounded text-xs mt-1">https://youtu.be/dQw4w9WgXcQ</code>
                    <code className="bg-gray-100 p-1 rounded text-xs mt-1">https://www.youtube.com/embed/dQw4w9WgXcQ</code>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cor do Material
                  </label>
                  <input
                    type="color"
                    name="color"
                    value={currentMaterial.color}
                    onChange={handleMaterialFormChange}
                    className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm h-10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Itens Recicláveis <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="recyclableItems"
                    value={currentMaterial.recyclableItems}
                    onChange={handleMaterialFormChange}
                    required
                    rows={5}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                    placeholder="Adicione um item por linha"
                  />
                  <p className="text-xs text-gray-500 mt-1">Adicione um item por linha</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Itens Não Recicláveis <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="nonRecyclableItems"
                    value={currentMaterial.nonRecyclableItems}
                    onChange={handleMaterialFormChange}
                    required
                    rows={5}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                    placeholder="Adicione um item por linha"
                  />
                  <p className="text-xs text-gray-500 mt-1">Adicione um item por linha</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Como Preparar os Materiais <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="howToPrepare"
                    value={currentMaterial.howToPrepare}
                    onChange={handleMaterialFormChange}
                    required
                    rows={5}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6CB33F] focus:ring-[#6CB33F] sm:text-sm"
                    placeholder="✔️ Dica 1
✔️ Dica 2
✔️ Dica 3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Adicione uma dica por linha. Use ✔️ para marcar dicas.</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseMaterialModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6CB33F] hover:bg-[#5AA32E]"
                >
                  {isEditingMaterial ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
                </div>
      )}
    </div>
  );
}
