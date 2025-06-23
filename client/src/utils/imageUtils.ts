export const getFullImageUrl = (imageUrl?: string, debugInfo?: string): string => {
  const logPrefix = debugInfo ? `[${debugInfo}]` : '[ImageUtils]';
  
  if (!imageUrl) {
    console.log(`${logPrefix} URL de imagem vazia, usando imagem padrão`);
    return `${window.location.origin}/assets/sem-imagem.svg`;
  }
  
  console.log(`${logPrefix} Processando URL de imagem:`, imageUrl);
  const normalizedUrl = imageUrl.trim();
  
  // URLs completas (http/https)
  if (normalizedUrl.match(/^https?:\/\//)) {
    console.log(`${logPrefix} Usando URL externa diretamente:`, normalizedUrl);
    return normalizedUrl;
  }
  
  // Caminho relativo começando com /uploads
  if (normalizedUrl.startsWith('/uploads')) {
    // Em desenvolvimento, usar o proxy do Vite
    if (import.meta.env.DEV) {
      const fullUrl = `${window.location.origin}${normalizedUrl}`;
      console.log(`${logPrefix} URL para desenvolvimento (proxy):`, fullUrl);
      return fullUrl;
    } else {
      // Em produção, usar o servidor backend diretamente
      const fullUrl = `${window.location.origin}${normalizedUrl}`;
      console.log(`${logPrefix} URL para produção:`, fullUrl);
      return fullUrl;
    }
  }
  
  // Apenas nome do arquivo
  const fullUrl = `${window.location.origin}/uploads/collection-points/${normalizedUrl}`;
  console.log(`${logPrefix} URL formatada para nome de arquivo:`, fullUrl);
  return fullUrl;
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  console.log('[ImageUtils] Erro ao carregar imagem:', e);
  // Substituir por imagem padrão em caso de erro
  e.currentTarget.src = `${window.location.origin}/assets/sem-imagem.svg`;
};