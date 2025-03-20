// Nome do cache e versão para facilitar atualizações
const CACHE_NAME = 'image-editor-v1';
const OFFLINE_URL = '/offline.html'; // Página offline (crie essa página no seu projeto)
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css', // Substitua pelo seu arquivo CSS
    '/script.js',
    '/fabric.min.js',
    '/jszip.min.js',
    '/FileSaver.min.js',
    '/assets/templates/', // Cache dinâmico de templates será tratado separadamente
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cache aberto, armazenando assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Força ativação imediata
            .catch(err => console.error('[Service Worker] Erro na instalação:', err))
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Ativando...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('[Service Worker] Removendo cache antigo:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim()) // Assume controle imediato das páginas
            .catch(err => console.error('[Service Worker] Erro na ativação:', err))
    );
});

// Estratégia de Fetch com cache-first e fallback para network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignorar requisições não-GET e de outras origens
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Estratégia para templates
    if (url.pathname.startsWith('/assets/templates/')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request)
                        .then(fetchResponse => {
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
                .catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    // Estratégia Cache-First com fallback para network
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                const networkFetch = fetch(event.request)
                    .then(response => {
                        // Atualiza o cache com a nova resposta
                        if (response.ok) {
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, response.clone());
                                    return response;
                                });
                        }
                        return response;
                    })
                    .catch(() => caches.match(OFFLINE_URL));

                return cachedResponse || networkFetch;
            })
            .catch(() => caches.match(OFFLINE_URL))
    );
});

// Sincronização de dados offline (ex.: salvar projetos pendentes)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-projects') {
        console.log('[Service Worker] Sincronizando projetos offline...');
        event.waitUntil(syncProjects());
    }
});

const syncProjects = async () => {
    const db = await openDB();
    const projects = await db.getAll('pendingProjects');
    const clients = await self.clients.matchAll();

    for (const project of projects) {
        try {
            // Simula envio para um servidor (substitua pela sua API)
            const response = await fetch('/api/save-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project.data),
            });

            if (response.ok) {
                await db.delete('pendingProjects', project.id);
                clients.forEach(client => client.postMessage({
                    type: 'SYNC_SUCCESS',
                    id: project.id,
                }));
            }
        } catch (error) {
            console.error('[Service Worker] Erro ao sincronizar projeto:', error);
            break; // Para a sincronização se houver erro
        }
    }
};

// Banco de dados IndexedDB para armazenar projetos offline
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ImageEditorDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('pendingProjects', { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

// Mensagens do cliente (ex.: salvar projeto offline)
self.addEventListener('message', (event) => {
    if (event.data.type === 'SAVE_OFFLINE_PROJECT') {
        const projectData = event.data.project;
        event.waitUntil(
            openDB()
                .then(db => {
                    const tx = db.transaction('pendingProjects', 'readwrite');
                    const store = tx.objectStore('pendingProjects');
                    return store.add({ data: projectData, timestamp: Date.now() });
                })
                .then(() => {
                    event.source.postMessage({ type: 'PROJECT_SAVED_OFFLINE', success: true });
                    return self.registration.sync.register('sync-projects');
                })
                .catch(err => {
                    console.error('[Service Worker] Erro ao salvar offline:', err);
                    event.source.postMessage({ type: 'PROJECT_SAVED_OFFLINE', success: false });
                })
        );
    }
});

// Atualização dinâmica do cache
self.addEventListener('message', (event) => {
    if (event.data.type === 'UPDATE_CACHE') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => cache.addAll(event.data.urls))
                .then(() => {
                    console.log('[Service Worker] Cache atualizado dinamicamente');
                    event.source.postMessage({ type: 'CACHE_UPDATED', success: true });
                })
                .catch(err => console.error('[Service Worker] Erro ao atualizar cache:', err))
        );
    }
});

// Notificações (exemplo: notificar usuário sobre sincronização)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Notificação', body: 'Algo aconteceu!' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon.png', // Adicione um ícone ao seu projeto
        })
    );
});