const dataset = new URLSearchParams(window.location.search).get('dataset') === 'demo' ? 'demo' : 'uat';
export const DB_NAME = `finance-tracker-${dataset}`;

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAll(storeName) {
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains(storeName)) return [];
    return await requestToPromise(db.transaction(storeName, 'readonly').objectStore(storeName).getAll());
  } finally {
    db.close();
  }
}

export async function getRecord(storeName, key) {
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains(storeName)) return undefined;
    return await requestToPromise(db.transaction(storeName, 'readonly').objectStore(storeName).get(key));
  } finally {
    db.close();
  }
}

export async function putRecord(storeName, value) {
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains(storeName)) return;
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function getMeta(key) {
  const record = await getRecord('meta', key);
  return record?.value;
}

export async function getTransactionCount() {
  const db = await openDb();
  try {
    if (!db.objectStoreNames.contains('transactions')) return 0;
    return await requestToPromise(db.transaction('transactions', 'readonly').objectStore('transactions').count());
  } finally {
    db.close();
  }
}

export function formatDateTime(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
