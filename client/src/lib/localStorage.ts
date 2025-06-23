// Biblioteca para gerenciar dados de materiais recicláveis no localStorage

// Interface para materiais recicláveis
export interface RecycleMaterial {
  id: string;
  name: string;
  description: string;
  youtubeUrl: string;
  items: {
    recyclable: string[];
    nonRecyclable: string[];
    howToPrepare: string;
  }
  color: string;
}

// Chaves para armazenar materiais
export const RECYCLE_MATERIALS_KEY = 'recycleczs_materials';
export const RECYCLE_MATERIALS_SESSION_KEY = 'recycleczs_materials_session';
export const RECYCLE_MATERIALS_TIMESTAMP = 'recycleczs_materials_timestamp';
const DEBUG_ENABLED = true;

// Função de log para debug
function logDebug(...args: any[]) {
  if (DEBUG_ENABLED) {
    console.log('[RecycleCZS Storage]', ...args);
  }
}

// Verifica se o localStorage está disponível e funcionando
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test_key__';
    localStorage.setItem(testKey, testKey);
    const result = localStorage.getItem(testKey) === testKey;
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    logDebug('Erro ao verificar localStorage:', e);
    return false;
  }
}

// Verifica se o sessionStorage está disponível e funcionando
function isSessionStorageAvailable(): boolean {
  try {
    const testKey = '__test_key__';
    sessionStorage.setItem(testKey, testKey);
    const result = sessionStorage.getItem(testKey) === testKey;
    sessionStorage.removeItem(testKey);
    return result;
  } catch (e) {
    logDebug('Erro ao verificar sessionStorage:', e);
    return false;
  }
}

// Criar um backup de segurança em indexedDB para garantir persistência
let idbBackupAvailable = false;

// Tentar inicializar o banco de dados IndexedDB
try {
  if (typeof window !== 'undefined' && window.indexedDB) {
    const request = window.indexedDB.open("recycleczsBackup", 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar uma object store para materiais recicláveis
      if (!db.objectStoreNames.contains("materials")) {
        db.createObjectStore("materials", { keyPath: "timestamp" });
        logDebug("IndexedDB: Object store 'materials' criada");
      }
    };
    
    request.onsuccess = () => {
      idbBackupAvailable = true;
      logDebug("IndexedDB disponível para backup");
    };
    
    request.onerror = (event) => {
      logDebug("Erro ao inicializar IndexedDB:", (event.target as IDBOpenDBRequest).error);
      idbBackupAvailable = false;
    };
  } else {
    logDebug("IndexedDB não está disponível neste ambiente");
    idbBackupAvailable = false;
  }
} catch (e) {
  logDebug("Erro ao tentar inicializar IndexedDB:", e);
  idbBackupAvailable = false;
}

// Função para salvar backup no IndexedDB
function saveBackupToIndexedDB(materials: RecycleMaterial[]): void {
  if (!idbBackupAvailable) return;
  
  try {
    const request = window.indexedDB.open("recycleczsBackup", 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar uma object store para materiais recicláveis se não existir
      if (!db.objectStoreNames.contains("materials")) {
        db.createObjectStore("materials", { keyPath: "timestamp" });
        logDebug("IndexedDB: Object store 'materials' criada durante backup");
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Verificar se a object store existe
      if (!db.objectStoreNames.contains("materials")) {
        logDebug("Object store 'materials' não existe no IndexedDB, pulando backup");
        db.close();
        return;
      }
      
      const transaction = db.transaction(["materials"], "readwrite");
      const objectStore = transaction.objectStore("materials");
      
      // Limitar a 5 backups
      const getAllRequest = objectStore.getAll();
      
      getAllRequest.onsuccess = () => {
        const allBackups = getAllRequest.result;
        
        // Se já existem mais de 4 backups, excluir os mais antigos
        if (allBackups.length >= 4) {
          // Ordenar por timestamp (mais antigo primeiro)
          allBackups.sort((a, b) => a.timestamp - b.timestamp);
          
          // Excluir os backups mais antigos, mantendo apenas os 3 mais recentes
          for (let i = 0; i < allBackups.length - 3; i++) {
            objectStore.delete(allBackups[i].timestamp);
          }
        }
        
        // Adicionar o novo backup
        const backup = {
          timestamp: Date.now(),
          materials: materials
        };
        
        objectStore.add(backup);
        logDebug("Backup salvo no IndexedDB, timestamp:", backup.timestamp);
      };
      
      getAllRequest.onerror = (e) => {
        logDebug("Erro ao obter backups existentes do IndexedDB:", e);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
      
      transaction.onerror = (e) => {
        logDebug("Erro na transação IndexedDB:", e);
      };
    };
    
    request.onerror = (event) => {
      logDebug("Erro ao abrir IndexedDB para backup:", (event.target as IDBOpenDBRequest).error);
    };
  } catch (e) {
    logDebug("Erro ao salvar backup no IndexedDB:", e);
  }
}

// Função para restaurar backup do IndexedDB (chamada quando localStorage falha)
export function restoreFromBackup(): Promise<RecycleMaterial[]> {
  return new Promise((resolve, reject) => {
    if (!idbBackupAvailable) {
      return reject("IndexedDB não está disponível para restauração");
    }
    
    try {
      const request = window.indexedDB.open("recycleczsBackup", 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar uma object store para materiais recicláveis se não existir
        if (!db.objectStoreNames.contains("materials")) {
          db.createObjectStore("materials", { keyPath: "timestamp" });
          logDebug("IndexedDB: Object store 'materials' criada durante restauração");
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Verificar se a object store existe
        if (!db.objectStoreNames.contains("materials")) {
          logDebug("Object store 'materials' não existe no IndexedDB");
          resolve([]);
          db.close();
          return;
        }
        
        const transaction = db.transaction(["materials"], "readonly");
        const objectStore = transaction.objectStore("materials");
        
        // Obter todos os backups
        const getAllRequest = objectStore.getAll();
        
        getAllRequest.onsuccess = () => {
          const allBackups = getAllRequest.result;
          
          if (allBackups.length === 0) {
            logDebug("Nenhum backup encontrado no IndexedDB");
            resolve([]);
            return;
          }
          
          // Ordenar por timestamp (mais recente primeiro)
          allBackups.sort((a, b) => b.timestamp - a.timestamp);
          
          // Usar o backup mais recente
          const latestBackup = allBackups[0];
          logDebug(`Restaurando backup do IndexedDB, timestamp: ${latestBackup.timestamp}, ${latestBackup.materials.length} materiais`);
          
          resolve(latestBackup.materials);
        };
        
        getAllRequest.onerror = (e) => {
          logDebug("Erro ao obter backups do IndexedDB:", e);
          resolve([]);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
        
        transaction.onerror = (e) => {
          logDebug("Erro na transação IndexedDB:", e);
          resolve([]);
        };
      };
      
      request.onerror = (event) => {
        logDebug("Erro ao abrir IndexedDB para restauração:", (event.target as IDBOpenDBRequest).error);
        resolve([]);
      };
    } catch (e) {
      logDebug("Erro ao restaurar backup do IndexedDB:", e);
      resolve([]);
    }
  });
}

// Obter todos os materiais do armazenamento
export function getRecycleMaterials(): RecycleMaterial[] {
  try {
    // Verificar se há dados no localStorage
    if (isLocalStorageAvailable()) {
      const materials = localStorage.getItem(RECYCLE_MATERIALS_KEY);
      if (materials) {
        const lsTimestamp = localStorage.getItem(RECYCLE_MATERIALS_TIMESTAMP) || '0';
        logDebug(`Dados encontrados no localStorage, timestamp: ${lsTimestamp}`);
        
        try {
          const parsedMaterials = JSON.parse(materials);
          
          // Verificar se os dados são válidos
          if (Array.isArray(parsedMaterials) && parsedMaterials.length > 0) {
            // Sincronizar com sessionStorage como backup
            if (isSessionStorageAvailable()) {
              sessionStorage.setItem(RECYCLE_MATERIALS_SESSION_KEY, materials);
              sessionStorage.setItem(RECYCLE_MATERIALS_TIMESTAMP, lsTimestamp);
              logDebug('Dados do localStorage sincronizados com sessionStorage');
            }
            
            logDebug(`${parsedMaterials.length} materiais carregados do localStorage`);
            return parsedMaterials;
          } else {
            console.error("Dados no localStorage não são um array válido:", parsedMaterials);
          }
        } catch (parseError) {
          console.error("Erro ao analisar dados do localStorage:", parseError);
        }
      }
    }
    
    // Se não há dados no localStorage ou ele não está disponível, tentar sessionStorage
    if (isSessionStorageAvailable()) {
      const sessionMaterials = sessionStorage.getItem(RECYCLE_MATERIALS_SESSION_KEY);
      if (sessionMaterials) {
        logDebug('Recuperando dados do sessionStorage como fallback');
        
        try {
          const sessionParsed = JSON.parse(sessionMaterials);
          
          // Verificar se os dados são válidos
          if (Array.isArray(sessionParsed) && sessionParsed.length > 0) {
            // Tentar restaurar para localStorage se possível
            if (isLocalStorageAvailable()) {
              localStorage.setItem(RECYCLE_MATERIALS_KEY, sessionMaterials);
              const timestamp = sessionStorage.getItem(RECYCLE_MATERIALS_TIMESTAMP) || String(Date.now());
              localStorage.setItem(RECYCLE_MATERIALS_TIMESTAMP, timestamp);
              logDebug('Dados restaurados do sessionStorage para localStorage');
            }
            
            return sessionParsed;
          } else {
            console.error("Dados no sessionStorage não são um array válido:", sessionParsed);
          }
        } catch (parseError) {
          console.error("Erro ao analisar dados do sessionStorage:", parseError);
        }
      }
    }
    
    // Tentar restaurar do IndexedDB como último recurso
    if (idbBackupAvailable) {
      logDebug("Tentando restaurar backup do IndexedDB");
      
      // Não podemos usar async/await aqui, então alertamos sobre o processo de restauração
      restoreFromBackup()
        .then(materials => {
          if (materials && materials.length > 0) {
            logDebug(`Restaurados ${materials.length} materiais do IndexedDB`);
            // Salvar de volta nos storages
            if (isLocalStorageAvailable()) {
              localStorage.setItem(RECYCLE_MATERIALS_KEY, JSON.stringify(materials));
              localStorage.setItem(RECYCLE_MATERIALS_TIMESTAMP, String(Date.now()));
            }
            if (isSessionStorageAvailable()) {
              sessionStorage.setItem(RECYCLE_MATERIALS_SESSION_KEY, JSON.stringify(materials));
              sessionStorage.setItem(RECYCLE_MATERIALS_TIMESTAMP, String(Date.now()));
            }
            
            // Disparar evento para atualizar as páginas
            dispatchUpdateEvent(materials.length, 'restoreFromBackup');
            
            console.log("DADOS RESTAURADOS DO BACKUP. Por favor, recarregue a página para ver os dados restaurados.");
          }
        })
        .catch(err => {
          logDebug("Erro ao restaurar do backup:", err);
        });
    }
    
    // Nenhum dado encontrado
    logDebug('Nenhum material encontrado em localStorage ou sessionStorage');
    return [];
  } catch (error) {
    console.error('Erro ao obter materiais do armazenamento:', error);
    return [];
  }
}

// Disparar um evento para notificar os ouvintes sobre a atualização dos materiais
function dispatchUpdateEvent(count: number, source: string) {
  try {
    const eventDetail = {
      timestamp: Date.now(),
      count: count,
      source: source
    };
    
    logDebug(`Disparando evento recycleMaterialsUpdated com detalhes:`, eventDetail);
    
    // Criar e disparar o evento usando ambos os métodos para maior compatibilidade
    // Método 1: CustomEvent
    try {
      const customEvent = new CustomEvent('recycleMaterialsUpdated', {
        detail: eventDetail,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(customEvent);
    } catch (e) {
      console.error('Erro ao disparar CustomEvent:', e);
    }
    
    // Método 2: Event (fallback)
    try {
      // Criar evento usando a API antiga para maior compatibilidade
      const fallbackEvent = document.createEvent('Event');
      fallbackEvent.initEvent('recycleMaterialsUpdated', true, true);
      (fallbackEvent as any).detail = eventDetail;
      window.dispatchEvent(fallbackEvent);
    } catch (e) {
      console.error('Erro ao disparar fallbackEvent:', e);
    }
    
    // Método 3: Disparar evento para document também (alguns listeners podem estar ligados a document)
    try {
      const docEvent = new CustomEvent('recycleMaterialsUpdated', {
        detail: eventDetail,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(docEvent);
    } catch (e) {
      console.error('Erro ao disparar evento para document:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao disparar evento de atualização:', error);
    return false;
  }
}

// Salvar todos os materiais no armazenamento
export function saveRecycleMaterials(materials: RecycleMaterial[]): boolean {
  try {
    if (!Array.isArray(materials)) {
      console.error('Erro ao salvar: materials não é um array', materials);
      return false;
    }
    
    // Verificar se há material duplicado por ID
    const uniqueMaterials = removeDuplicates(materials);
    if (uniqueMaterials.length !== materials.length) {
      logDebug(`Removidos ${materials.length - uniqueMaterials.length} materiais duplicados`);
    }
    
    const materialsString = JSON.stringify(uniqueMaterials);
    const timestamp = String(Date.now());
    let savedSuccessfully = false;
    
    // Tentar salvar no localStorage
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem(RECYCLE_MATERIALS_KEY, materialsString);
        localStorage.setItem(RECYCLE_MATERIALS_TIMESTAMP, timestamp);
        const savedData = localStorage.getItem(RECYCLE_MATERIALS_KEY);
        if (savedData && savedData === materialsString) {
          logDebug(`${uniqueMaterials.length} materiais salvos com sucesso no localStorage`);
          savedSuccessfully = true;
        } else {
          logDebug('Falha ao verificar dados salvos no localStorage');
        }
      } catch (lsError) {
        console.error('Erro ao salvar no localStorage:', lsError);
      }
    }
    
    // Tentar salvar no sessionStorage como backup
    if (isSessionStorageAvailable()) {
      try {
        sessionStorage.setItem(RECYCLE_MATERIALS_SESSION_KEY, materialsString);
        sessionStorage.setItem(RECYCLE_MATERIALS_TIMESTAMP, timestamp);
        const sessionData = sessionStorage.getItem(RECYCLE_MATERIALS_SESSION_KEY);
        if (sessionData && sessionData === materialsString) {
          logDebug(`${uniqueMaterials.length} materiais salvos como backup no sessionStorage`);
          savedSuccessfully = true;
        }
      } catch (ssError) {
        console.error('Erro ao salvar no sessionStorage:', ssError);
      }
    }
    
    // Salvar backup no IndexedDB (de forma assíncrona, não afeta o resultado)
    if (uniqueMaterials.length > 0) {
      saveBackupToIndexedDB(uniqueMaterials);
    }
    
    if (!savedSuccessfully) {
      console.error('Não foi possível salvar os dados em nenhum armazenamento');
      return false;
    }
    
    // Disparar evento de atualização
    dispatchUpdateEvent(uniqueMaterials.length, 'saveRecycleMaterials');
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar materiais:', error);
    return false;
  }
}

// Remove duplicatas por ID
function removeDuplicates(materials: RecycleMaterial[]): RecycleMaterial[] {
  const uniqueIds = new Set<string>();
  return materials.filter(material => {
    if (uniqueIds.has(material.id)) {
      return false;
    }
    uniqueIds.add(material.id);
    return true;
  });
}

// Adicionar ou atualizar um material
export function saveRecycleMaterial(material: RecycleMaterial): boolean {
  try {
    if (!material || !material.id) {
      console.error('Erro: Tentativa de salvar material inválido', material);
      return false;
    }
    
    logDebug(`Salvando/atualizando material: ${material.id} - ${material.name}`);
    logDebug(`Dados completos do material:`, material);
    
    const materials = getRecycleMaterials();
    const index = materials.findIndex(m => m.id === material.id);
    
    if (index >= 0) {
      // Atualizar material existente
      logDebug(`Atualizando material existente na posição ${index}`);
      
      // Garantir que todas as propriedades sejam preservadas
      const existingMaterial = materials[index];
      logDebug(`Material existente antes da atualização:`, existingMaterial);
      
      // Criar um novo objeto combinando as propriedades existentes com as novas
      const updatedMaterial: RecycleMaterial = {
        ...existingMaterial,  // Mantém as propriedades existentes
        ...material,          // Sobrescreve com as novas propriedades
        items: {
          // Garantir que os arrays sejam válidos
          recyclable: Array.isArray(material.items?.recyclable) ? material.items.recyclable : 
                     (existingMaterial.items?.recyclable || []),
          nonRecyclable: Array.isArray(material.items?.nonRecyclable) ? material.items.nonRecyclable : 
                        (existingMaterial.items?.nonRecyclable || []),
          howToPrepare: material.items?.howToPrepare || existingMaterial.items?.howToPrepare || '',
        }
      };
      
      // Verificar se a URL do YouTube é válida e preservá-la
      if (material.youtubeUrl !== undefined) {
        updatedMaterial.youtubeUrl = material.youtubeUrl;
        logDebug(`URL do YouTube atualizada para: ${material.youtubeUrl}`);
      } else if (existingMaterial.youtubeUrl) {
        updatedMaterial.youtubeUrl = existingMaterial.youtubeUrl;
        logDebug(`Mantendo URL do YouTube existente: ${existingMaterial.youtubeUrl}`);
      }
      
      logDebug(`Material após combinação:`, updatedMaterial);
      materials[index] = updatedMaterial;
    } else {
      // Adicionar novo material
      logDebug('Adicionando novo material');
      
      // Garantir que o objeto tenha a estrutura correta
      const newMaterial: RecycleMaterial = {
        id: material.id,
        name: material.name || '',
        description: material.description || '',
        youtubeUrl: material.youtubeUrl || '',
        color: material.color || '#6CB33F',
        items: {
          recyclable: Array.isArray(material.items?.recyclable) ? material.items.recyclable : [],
          nonRecyclable: Array.isArray(material.items?.nonRecyclable) ? material.items.nonRecyclable : [],
          howToPrepare: material.items?.howToPrepare || ''
        }
      };
      
      materials.push(newMaterial);
    }
    
    // Salvar os materiais atualizados
    const result = saveRecycleMaterials(materials);
    
    // Disparar evento adicional específico para este material
    if (result) {
      dispatchUpdateEvent(materials.length, `saveRecycleMaterial_${material.id}`);
    }
    
    return result;
  } catch (error) {
    console.error('Erro ao salvar material individual:', error);
    return false;
  }
}

// Remover um material
export function deleteRecycleMaterial(materialId: string): boolean {
  try {
    if (!materialId) {
      console.error('ID de material inválido para exclusão');
      return false;
    }
    
    logDebug(`Removendo material: ${materialId}`);
    const materials = getRecycleMaterials();
    const filtered = materials.filter(m => m.id !== materialId);
    
    if (filtered.length === materials.length) {
      logDebug(`Material com ID ${materialId} não encontrado para exclusão`);
    }
    
    // Salvar os materiais atualizados
    const result = saveRecycleMaterials(filtered);
    
    // Disparar evento adicional específico para a exclusão
    if (result) {
      dispatchUpdateEvent(filtered.length, `deleteRecycleMaterial_${materialId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    return false;
  }
}

// Obter um material específico por ID
export function getRecycleMaterialById(materialId: string): RecycleMaterial | undefined {
  try {
    if (!materialId) {
      logDebug('ID de material inválido para busca');
      return undefined;
    }
    
    const materials = getRecycleMaterials();
    const material = materials.find(m => m.id === materialId);
    logDebug(`Buscando material por ID: ${materialId} - ${material ? 'Encontrado' : 'Não encontrado'}`);
    return material;
  } catch (error) {
    console.error('Erro ao buscar material por ID:', error);
    return undefined;
  }
}

// Limpar dados de diagnóstico no console
export function clearStorageLogs(): void {
  console.clear();
  logDebug('Logs limpos');
}

// Exportar dados para um formato que possa ser salvo em um arquivo
export function exportMaterials(): string {
  const materials = getRecycleMaterials();
  return JSON.stringify(materials, null, 2);
}

// Importar dados de um arquivo
export function importMaterials(jsonData: string): boolean {
  try {
    const materials = JSON.parse(jsonData) as RecycleMaterial[];
    if (!Array.isArray(materials)) {
      throw new Error('Dados importados não são um array válido');
    }
    return saveRecycleMaterials(materials);
  } catch (error) {
    console.error('Erro ao importar materiais:', error);
    return false;
  }
} 