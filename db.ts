// Camada de armazenamento em IndexedDB.
//
// Por que não usar localStorage?
// O localStorage tem um limite muito baixo (geralmente 5-10MB por site) e, pior,
// quando esse limite é excedido o erro geralmente é silencioso se não for tratado
// explicitamente. Como o app permite anexar comprovantes/fotos em transações
// (armazenados como base64, que é ~33% maior que o arquivo original), bastam
// algumas dezenas de anexos para estourar esse limite — e a partir daí, os dados
// mais recentes simplesmente param de ser salvos, embora a tela continue
// mostrando tudo normalmente até a próxima vez que a página for recarregada.
//
// O IndexedDB não tem esse problema: os navegadores modernos costumam liberar
// centenas de MB (às vezes GB) por origem, e é a forma correta de persistir
// grandes volumes de dados no navegador.

const DB_NAME = 'casa_finance_pro_db';
const DB_VERSION = 1;
const STORE_NAME = 'user_data';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB não é suportado neste navegador.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir o banco de dados local.'));
    // Se outra aba/versão tiver o banco aberto com uma versão diferente, o navegador
    // pode bloquear a abertura. Isso normalmente resolve sozinho, mas registramos
    // para não ficar "pendurado" silenciosamente para sempre.
    request.onblocked = () => {
      console.warn('Abertura do IndexedDB bloqueada por outra aba/instância ainda aberta.');
    };
  });

  return dbPromise;
};

export const idbGet = async <T = any>(key: string): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error || new Error('Falha ao ler dados locais.'));
  });
};

export const idbSet = async (key: string, value: unknown): Promise<void> => {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    // Não basta o put() dar sucesso: em alguns navegadores (Safari/iOS em modo privado,
    // ou com pouco espaço em disco) a transação pode ser abortada DEPOIS do put() já ter
    // "funcionado" a nível de request. Por isso escutamos a transação inteira, não só o request.
    req.onerror = () => reject(req.error || new Error('Falha ao salvar dados locais.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('A transação de salvamento falhou.'));
    tx.onabort = () => reject(tx.error || new Error('A transação de salvamento foi abortada (provavelmente falta de espaço).'));
  });

  // Verificação de gravação: relemos a chave e comparamos o tamanho serializado
  // com o que tentamos gravar. Isso pega casos raros (principalmente Safari/iOS
  // antigos) em que a transação reporta sucesso mas o dado persistido não bate
  // com o que foi enviado — o que no app se manifestava como "sumiu parte do backup".
  const readBack = await idbGet<unknown>(key);
  const expectedSize = JSON.stringify(value).length;
  const actualSize = readBack !== undefined ? JSON.stringify(readBack).length : -1;
  if (actualSize !== expectedSize) {
    throw new Error(
      `Verificação de gravação falhou: esperado ${expectedSize} bytes, encontrado ${actualSize} bytes. ` +
      `Os dados podem não ter sido salvos por completo (espaço em disco insuficiente ou navegador em modo privado).`
    );
  }
};

export const idbDelete = async (key: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Falha ao remover dados locais.'));
  });
};

// Pede ao navegador para tratar o armazenamento deste site como "persistente",
// reduzindo a chance de o navegador limpar o IndexedDB sozinho sob pressão de espaço
// (isso é comum em Safari/iOS depois de dias sem uso do site, e é uma causa conhecida
// de "os dados sumiram sozinhos" que não tem nada a ver com o código do app).
export const requestPersistentStorage = async (): Promise<boolean> => {
  try {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // Não suportado ou negado — não é crítico, apenas não temos a garantia extra.
  }
  return false;
};

// Retorna uma estimativa de quanto espaço já está em uso e quanto está disponível,
// para conseguirmos avisar o usuário ANTES de uma importação grande falhar por falta
// de espaço, em vez de descobrir isso só depois.
export const getStorageEstimate = async (): Promise<{ usage: number; quota: number } | null> => {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage: usage || 0, quota: quota || 0 };
    }
  } catch {
    // Não suportado neste navegador.
  }
  return null;
};