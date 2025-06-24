// Configuração da API
export const API_CONFIG = {
  // URL base da API - usar a URL do Render em produção
  BASE_URL: import.meta.env.VITE_API_URL || 'https://deploy-render.onrender.com',
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      ADMIN_LOGIN: '/api/auth/admin-login',
    },
    USERS: '/api/users',
    COLLECTION_POINTS: '/api/collection-points',
    RECYCLE_MATERIALS: '/api/recycle-materials',
  }
}; 