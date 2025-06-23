// Service Worker para RecycleCZS app
const CACHE_NAME = 'recycleczs-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  // Adicionar mais recursos importantes para o aplicativo
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Instalação do service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: Cache First, depois Network
self.addEventListener('fetch', event => {
  // Ignora requisições de API ou outro domínio
  if (!event.request.url.startsWith(self.location.origin) || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Se o recurso está no cache, retorna-o
          return cachedResponse;
        }

        // Se não está no cache, busca na rede
        return fetch(event.request)
          .then(response => {
            // Verificar se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar a resposta
            const responseToCache = response.clone();

            // Adicionar ao cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Se não conseguir buscar da rede, tenta retornar a página principal (index.html)
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Retorna resposta vazia para outros recursos
            return new Response('', { status: 408, statusText: 'Request timed out' });
          });
    })
  );
});

// Sincronização em segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'syncData') {
    event.waitUntil(syncData());
  }
});

// Função para sincronizar dados quando estiver online
async function syncData() {
  // Implementar sincronização de dados quando necessário
  console.log('Sincronizando dados...');
}

// Notificações push
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const title = data.title || 'RecycleCZS';
  const options = {
    body: data.body || 'Novidade na RecycleCZS!',
    icon: '/favicon.svg',
    badge: '/favicon.svg'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
