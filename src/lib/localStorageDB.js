// LocalStorage Database Service
// This service emulates the base44 API using localStorage

const STORAGE_KEYS = {
  USER: 'keeping_user',
  FOLDERS: 'keeping_folders',
  FILES: 'keeping_files',
  TEAMS: 'keeping_teams',
  TEAM_ACTIVITIES: 'keeping_team_activities',
};

// Default admin user
const DEFAULT_USERS = [
  {
    id: '1',
    email: 'admin',
    password: '123456',
    name: 'Administrador',
    created_at: new Date().toISOString(),
    desktop_shortcuts: [],
    auto_refresh_interval: 120,
  }
];

// Initialize localStorage with default data if empty
const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    if (!localStorage.getItem(STORAGE_KEYS.FOLDERS)) {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FILES)) {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEAM_ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.TEAM_ACTIVITIES, JSON.stringify([]));
    }
    
    // Initialize users with default admin
    const users = JSON.parse(localStorage.getItem('keeping_users') || '[]');
    if (users.length === 0) {
      localStorage.setItem('keeping_users', JSON.stringify(DEFAULT_USERS));
    }
  } catch (error) {
    console.error('Storage init error:', error);
  }
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generic CRUD operations
const createEntity = (storageKey, data) => {
  const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const newItem = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  items.push(newItem);
  localStorage.setItem(storageKey, JSON.stringify(items));
  return newItem;
};

const listEntities = (storageKey) => {
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
};

const getEntity = (storageKey, id) => {
  const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
  return items.find(item => item.id === id);
};

const updateEntity = (storageKey, id, data) => {
  const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const index = items.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Item not found');
  
  items[index] = {
    ...items[index],
    ...data,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(storageKey, JSON.stringify(items));
  return items[index];
};

const deleteEntity = (storageKey, id) => {
  const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const filtered = items.filter(item => item.id !== id);
  localStorage.setItem(storageKey, JSON.stringify(filtered));
  return { success: true };
};

// Auth service
const authService = {
  login: (email, password) => {
    const users = JSON.parse(localStorage.getItem('keeping_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  me: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    if (!user) return null;
    return JSON.parse(user);
  },
  
  updateMe: (data) => {
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
    if (!currentUser) throw new Error('Not authenticated');
    
    const users = JSON.parse(localStorage.getItem('keeping_users') || '[]');
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem('keeping_users', JSON.stringify(users));
    }
    
    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.USER);
  },
  
  redirectToLogin: () => {
    // No-op for local auth
  },
};

// File upload using base64 in localStorage
const uploadFile = async ({ file }) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      const fileId = generateId();
      const fileKey = `keeping_file_data_${fileId}`;
      localStorage.setItem(fileKey, base64);
      // Return a pseudo-URL that we can use to retrieve the file later
      resolve({ file_url: `local://${fileKey}` });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Get file data from local storage
const getFileData = (localUrl) => {
  if (!localUrl || !localUrl.startsWith('local://')) return null;
  const key = localUrl.replace('local://', '');
  return localStorage.getItem(key);
};

// Entities service that mimics base44
export const localDB = {
  auth: authService,
  
  // Integration for file uploads and other features
  integrations: {
    Core: {
      UploadFile: uploadFile,
      InvokeLLM: async () => ({ response: 'Funcionalidade de IA não disponível no modo offline' }),
      SendEmail: async () => ({ success: false, message: 'Funcionalidade de email não disponível no modo offline' }),
      SendSMS: async () => ({ success: false, message: 'Funcionalidade de SMS não disponível no modo offline' }),
      GenerateImage: async () => ({ success: false, message: 'Funcionalidade de geração de imagem não disponível no modo offline' }),
      ExtractDataFromUploadedFile: async () => ({ success: false, message: 'Funcionalidade de extração não disponível no modo offline' }),
    },
  },
  
  // Helper to retrieve file data
  getFileData,
  
  entities: {
    Folder: {
      create: (data) => createEntity(STORAGE_KEYS.FOLDERS, data),
      list: () => listEntities(STORAGE_KEYS.FOLDERS),
      get: (id) => getEntity(STORAGE_KEYS.FOLDERS, id),
      update: (id, data) => updateEntity(STORAGE_KEYS.FOLDERS, id, data),
      delete: (id) => deleteEntity(STORAGE_KEYS.FOLDERS, id),
    },
    
    File: {
      create: (data) => createEntity(STORAGE_KEYS.FILES, data),
      list: () => listEntities(STORAGE_KEYS.FILES),
      get: (id) => getEntity(STORAGE_KEYS.FILES, id),
      update: (id, data) => updateEntity(STORAGE_KEYS.FILES, id, data),
      delete: (id) => deleteEntity(STORAGE_KEYS.FILES, id),
    },
    
    Team: {
      create: (data) => createEntity(STORAGE_KEYS.TEAMS, data),
      list: () => listEntities(STORAGE_KEYS.TEAMS),
      get: (id) => getEntity(STORAGE_KEYS.TEAMS, id),
      update: (id, data) => updateEntity(STORAGE_KEYS.TEAMS, id, data),
      delete: (id) => deleteEntity(STORAGE_KEYS.TEAMS, id),
    },
    
    TeamActivity: {
      create: (data) => createEntity(STORAGE_KEYS.TEAM_ACTIVITIES, data),
      list: () => listEntities(STORAGE_KEYS.TEAM_ACTIVITIES),
      get: (id) => getEntity(STORAGE_KEYS.TEAM_ACTIVITIES, id),
      update: (id, data) => updateEntity(STORAGE_KEYS.TEAM_ACTIVITIES, id, data),
      delete: (id) => deleteEntity(STORAGE_KEYS.TEAM_ACTIVITIES, id),
    },
    
    Query: {
      run: () => Promise.resolve([]),
    },
  },
};

// Initialize storage on module load
initializeStorage();

export default localDB;
