export interface Tracker {
  id: string;
  name: string;
  createdAt: number;
}

export interface Task {
  id: string;
  trackerId: string;
  title: string;
  createdAt: number; // Tasks will only show for days >= this date
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  trackerId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  rating: number; // 0-5 with 0.5 increments
}

const DB_NAME = 'TaskTrackerDB';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create trackers store
      if (!database.objectStoreNames.contains('trackers')) {
        database.createObjectStore('trackers', { keyPath: 'id' });
      }

      // Create tasks store
      if (!database.objectStoreNames.contains('tasks')) {
        const taskStore = database.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('trackerId', 'trackerId', { unique: false });
      }

      // Create task completions store
      if (!database.objectStoreNames.contains('completions')) {
        const completionStore = database.createObjectStore('completions', { keyPath: 'id' });
        completionStore.createIndex('taskId', 'taskId', { unique: false });
        completionStore.createIndex('trackerId', 'trackerId', { unique: false });
        completionStore.createIndex('date', 'date', { unique: false });
        completionStore.createIndex('trackerDate', ['trackerId', 'date'], { unique: false });
      }
    };
  });
}

// Tracker operations
export async function getAllTrackers(): Promise<Tracker[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['trackers'], 'readonly');
    const store = transaction.objectStore('trackers');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getTracker(id: string): Promise<Tracker | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['trackers'], 'readonly');
    const store = transaction.objectStore('trackers');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addTracker(tracker: Tracker): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['trackers'], 'readwrite');
    const store = transaction.objectStore('trackers');
    const request = store.add(tracker);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateTracker(tracker: Tracker): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['trackers'], 'readwrite');
    const store = transaction.objectStore('trackers');
    const request = store.put(tracker);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTracker(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['trackers', 'tasks', 'completions'], 'readwrite');
    
    // Delete tracker
    const trackerStore = transaction.objectStore('trackers');
    trackerStore.delete(id);

    // Delete all tasks for this tracker
    const taskStore = transaction.objectStore('tasks');
    const taskIndex = taskStore.index('trackerId');
    const taskRequest = taskIndex.openCursor(IDBKeyRange.only(id));

    taskRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Delete all completions for this tracker
    const completionStore = transaction.objectStore('completions');
    const completionIndex = completionStore.index('trackerId');
    const completionRequest = completionIndex.openCursor(IDBKeyRange.only(id));

    completionRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Task operations
export async function getTasksByTracker(trackerId: string): Promise<Task[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const index = store.index('trackerId');
    const request = index.getAll(IDBKeyRange.only(trackerId));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addTask(task: Task): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    const request = store.add(task);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateTask(task: Task): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    const request = store.put(task);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTask(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['tasks', 'completions'], 'readwrite');
    
    // Delete task
    const taskStore = transaction.objectStore('tasks');
    taskStore.delete(id);

    // Delete all completions for this task
    const completionStore = transaction.objectStore('completions');
    const completionIndex = completionStore.index('taskId');
    const completionRequest = completionIndex.openCursor(IDBKeyRange.only(id));

    completionRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Task completion operations
export async function getCompletionsByTrackerAndDate(
  trackerId: string,
  date: string
): Promise<TaskCompletion[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['completions'], 'readonly');
    const store = transaction.objectStore('completions');
    const index = store.index('trackerDate');
    const request = index.getAll(IDBKeyRange.only([trackerId, date]));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCompletionsByTracker(trackerId: string): Promise<TaskCompletion[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['completions'], 'readonly');
    const store = transaction.objectStore('completions');
    const index = store.index('trackerId');
    const request = index.getAll(IDBKeyRange.only(trackerId));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setTaskCompletion(completion: TaskCompletion): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['completions'], 'readwrite');
    const store = transaction.objectStore('completions');
    const request = store.put(completion);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCompletion(
  taskId: string,
  date: string
): Promise<TaskCompletion | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['completions'], 'readonly');
    const store = transaction.objectStore('completions');
    const index = store.index('taskId');
    const request = index.getAll(IDBKeyRange.only(taskId));

    request.onsuccess = () => {
      const completions = request.result;
      const completion = completions.find((c) => c.date === date);
      resolve(completion);
    };
    request.onerror = () => reject(request.error);
  });
}

// Helper function to generate date string
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to get today's date string
export function getTodayDateString(): string {
  return formatDate(new Date());
}
