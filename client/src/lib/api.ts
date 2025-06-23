// API Service - Comunicação com o servidor
import { RecycleMaterial } from './localStorage';

// Função para obter o token do usuário atual
const getAuthToken = () => {
  console.log('=== Obtendo token de autenticação ===');
  const userStr = localStorage.getItem("recycleczs_current_user");
  console.log('Dados do usuário no localStorage:', userStr);
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('Usuário parseado:', {
        id: user.id,
        email: user.email,
        role: user.role,
        token: user.token ? 'Token presente' : 'Token ausente'
      });
      return user.token;
    } catch (e) {
      console.error('Erro ao parsear usuário:', e);
      return null;
    }
  }
  console.log('Nenhum usuário encontrado no localStorage');
  return null;
};

// Função para tratar erros de API
const handleApiError = (error: any, defaultMessage: string) => {
  console.error(defaultMessage, error);
  if (error.message) return error.message;
  return defaultMessage;
};

// Função base para fazer requisições à API
async function fetchFromApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  // Usar URL padrão se VITE_API_URL não estiver definida
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const url = `${baseUrl}/api/${endpoint}`;
  
  console.log(`[API] Fazendo requisição para: ${url}`);
  console.log(`[API] Base URL: ${baseUrl}, Endpoint: ${endpoint}`);
  
  // Obter token de autenticação se não estiver sendo fornecido explicitamente
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Adicionar token de autenticação se disponível e se não for uma requisição de login
  if (token && !endpoint.includes('auth/')) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[API] Token de autenticação incluído na requisição');
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    // Se a resposta for 204 (No Content) ou não tiver corpo, não tente fazer .json()
    if (response.status === 204) {
      return null;
    }
    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.error(`[API] Erro ao acessar ${endpoint}:`, error);
    throw error;
  }
}

// API de Materiais Recicláveis
export class RecycleMaterialsApi {
  static async getAllMaterials() {
    try {
      const response = await fetchFromApi('recycle-materials');
      return response;
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      throw error;
    }
  }

  static async getMaterialById(id: string) {
    try {
      const response = await fetchFromApi(`recycle-materials/${id}`);
      return response;
    } catch (error) {
      console.error(`Erro ao buscar material ${id}:`, error);
      throw error;
    }
  }

  static async updateMaterial(id: string, data: any) {
    try {
      const response = await fetchFromApi(`recycle-materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error(`Erro ao atualizar material ${id}:`, error);
      throw error;
    }
  }

  // Criar um novo material
  async createMaterial(material: RecycleMaterial): Promise<RecycleMaterial> {
    try {
      console.log('[API] Criando novo material:', material);
      return await fetchFromApi('recycle-materials', {
        method: 'POST',
        body: JSON.stringify(material)
      });
    } catch (error) {
      throw new Error(handleApiError(error, 'Erro ao criar material'));
    }
  }

  // Excluir um material
  async deleteMaterial(id: string): Promise<void> {
    try {
      console.log(`[API] Excluindo material ${id}`);
      await fetchFromApi(`recycle-materials/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      throw new Error(handleApiError(error, `Erro ao excluir material ${id}`));
    }
  }
}

// API de Pontos de Coleta
export const CollectionPointsApi = {
  // Listar todos os pontos
  async getAllPoints() {
    return fetchFromApi('collection-points');
  },

  // Obter um ponto específico
  async getPointById(id: number) {
    return fetchFromApi(`collection-points/${id}`);
  },

  // Criar um novo ponto
  async createPoint(pointData: any) {
    return fetchFromApi('collection-points', {
      method: 'POST',
      body: JSON.stringify(pointData)
    });
  },

  // Atualizar um ponto existente
  async updatePoint(id: number, pointData: any) {
    return fetchFromApi(`collection-points/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pointData)
    });
  },

  // Excluir um ponto
  async deletePoint(id: number) {
    return fetchFromApi(`collection-points/${id}`, {
      method: 'DELETE'
    });
  }
};

// Funções específicas da API
export const api = {
  // Autenticação
  login: async (email: string, password: string) => {
    return fetchFromApi('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  adminLogin: async (email: string, password: string) => {
    return fetchFromApi('auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  // Usuários
  createUser: async (userData: any) => {
    return fetchFromApi('users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Pontos de Coleta
  createCollectionPoint: async (pointData: any) => {
    return CollectionPointsApi.createPoint(pointData);
  },

  updateCollectionPoint: async (id: number, pointData: any) => {
    return CollectionPointsApi.updatePoint(id, pointData);
  },

  deleteCollectionPoint: async (id: number) => {
    return CollectionPointsApi.deletePoint(id);
  },

  getCollectionPoint: async (id: number) => {
    return CollectionPointsApi.getPointById(id);
  },

  getAllCollectionPoints: async () => {
    return CollectionPointsApi.getAllPoints();
  }
};

// Exportar outras APIs aqui
export default {
  RecycleMaterials: RecycleMaterialsApi,
  CollectionPoints: CollectionPointsApi
}; 