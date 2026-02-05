// OnHub Client - LocalStorage based data management
// This replaces the base44 SDK with a local storage solution

const STORAGE_PREFIX = 'onhub_';
const WP_CONFIG_KEY = 'onhub_wp_config';

// WordPress Sync Configuration
const getWpConfig = () => {
  try {
    const config = localStorage.getItem(WP_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  } catch {
    return null;
  }
};

export const setWpConfig = (url, apiKey, autoSync = true) => {
  localStorage.setItem(WP_CONFIG_KEY, JSON.stringify({ url, apiKey, autoSync }));
};

export const clearWpConfig = () => {
  localStorage.removeItem(WP_CONFIG_KEY);
};

export const isWpConnected = () => {
  const config = getWpConfig();
  return config && config.url && config.apiKey;
};

// WordPress Proxy helper - all WP requests go through /api/wp-proxy to avoid CORS
const wpProxyFetch = async (config, endpoint, method = 'GET', data = null) => {
  const res = await fetch('/api/wp-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wpUrl: config.url,
      wpApiKey: config.apiKey,
      endpoint,
      method,
      data,
    }),
  });
  return res;
};

// Sync single item to WordPress
const syncItemToWp = async (entityName, item, action = 'upsert') => {
  const config = getWpConfig();
  if (!config || !config.autoSync) return;

  const tableMap = {
    'folders': 'folders',
    'files': 'files',
    'teams': 'teams',
    'team_invitations': 'team_invitations',
    'team_activities': 'team_activities',
    'active_sessions': 'active_sessions',
    'chat_messages': 'chat_messages',
    'queries': 'queries',
  };

  const table = tableMap[entityName];
  if (!table) return;

  try {
    if (action === 'delete') {
      await wpProxyFetch(config, `${table}/${item.id}`, 'DELETE');
    } else {
      await wpProxyFetch(config, `${table}/${item.id}`, 'PUT', item);
    }
  } catch (error) {
    console.warn('WordPress sync failed:', error.message);
  }
};

// Export proxy helper for bulk sync
export const wpSync = {
  proxyFetch: async (endpoint, method = 'GET', data = null) => {
    const config = getWpConfig();
    if (!config) throw new Error('WordPress not configured');
    const res = await wpProxyFetch(config, endpoint, method, data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  healthCheck: async (url, apiKey) => {
    const res = await fetch('/api/wp-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wpUrl: url, wpApiKey: apiKey, endpoint: 'health', method: 'GET' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  bulkSync: async (table, items) => {
    const config = getWpConfig();
    if (!config) throw new Error('WordPress not configured');
    const res = await wpProxyFetch(config, 'sync', 'POST', { table, data: items });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
};

// Helper functions for localStorage
const getStorageKey = (entity) => `${STORAGE_PREFIX}${entity}`;

const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

// Generate unique ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Entity factory
const createEntity = (entityName) => {
  const storageKey = getStorageKey(entityName);

  return {
    list: async (filters = {}) => {
      const items = getFromStorage(storageKey);
      // Apply basic filtering
      if (Object.keys(filters).length > 0) {
        return items.filter(item => {
          return Object.entries(filters).every(([key, value]) => item[key] === value);
        });
      }
      return items;
    },

    get: async (id) => {
      const items = getFromStorage(storageKey);
      return items.find(item => item.id === id) || null;
    },

    create: async (data) => {
      const items = getFromStorage(storageKey);
      const newItem = {
        ...data,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      items.push(newItem);
      saveToStorage(storageKey, items);
      // Auto-sync to WordPress
      syncItemToWp(entityName, newItem, 'upsert');
      return newItem;
    },

    update: async (id, data) => {
      const items = getFromStorage(storageKey);
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = {
          ...items[index],
          ...data,
          updated_at: new Date().toISOString(),
        };
        saveToStorage(storageKey, items);
        // Auto-sync to WordPress
        syncItemToWp(entityName, items[index], 'upsert');
        return items[index];
      }
      throw new Error(`Item with id ${id} not found`);
    },

    delete: async (id) => {
      const items = getFromStorage(storageKey);
      const itemToDelete = items.find(item => item.id === id);
      const filteredItems = items.filter(item => item.id !== id);
      saveToStorage(storageKey, filteredItems);
      // Auto-sync delete to WordPress
      if (itemToDelete) {
        syncItemToWp(entityName, itemToDelete, 'delete');
      }
      return true;
    },

    subscribe: (callback) => {
      // Simple subscription - poll for changes
      const checkInterval = setInterval(() => {
        // This is a simplified implementation
        // In a real app, you might use BroadcastChannel or similar
      }, 1000);

      return () => clearInterval(checkInterval);
    },
  };
};

// Auth management
const createAuth = () => {
  const USER_KEY = `${STORAGE_PREFIX}current_user`;
  const LOGGED_IN_KEY = `${STORAGE_PREFIX}is_logged_in`;

  return {
    me: async () => {
      const isLoggedIn = localStorage.getItem(LOGGED_IN_KEY) === 'true';
      if (!isLoggedIn) {
        return null;
      }
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    },

    login: async (username, password) => {
      // Simple admin login
      if (username === 'admin' && password === '123456') {
        const user = {
          id: 'admin-user',
          email: 'admin@onhub.local',
          name: 'Admin',
          username: 'admin',
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(LOGGED_IN_KEY, 'true');
        return user;
      }
      throw new Error('Invalid credentials');
    },

    logout: async () => {
      localStorage.removeItem(USER_KEY);
      localStorage.setItem(LOGGED_IN_KEY, 'false');
      return true;
    },

    updateMe: async (data) => {
      const userData = localStorage.getItem(USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, ...data };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error('User not logged in');
    },

    isLoggedIn: () => {
      return localStorage.getItem(LOGGED_IN_KEY) === 'true';
    },

    redirectToLogin: () => {
      // No external redirect needed
      window.location.href = '/';
    },
  };
};

// Main onhub client
export const onhub = {
  entities: {
    Folder: createEntity('folders'),
    File: createEntity('files'),
    Team: createEntity('teams'),
    TeamInvitation: createEntity('team_invitations'),
    TeamActivity: createEntity('team_activities'),
    ActiveSession: createEntity('active_sessions'),
    ChatMessage: createEntity('chat_messages'),
    Query: createEntity('queries'),
  },
  auth: createAuth(),
  integrations: {
    Core: {
      InvokeLLM: async (params) => {
        // Mock LLM response for now
        console.log('InvokeLLM called with:', params);
        return { response: 'LLM integration not available in localStorage mode' };
      },
      SendEmail: async (params) => {
        console.log('SendEmail called with:', params);
        return { success: false, message: 'Email integration not available in localStorage mode' };
      },
      SendSMS: async (params) => {
        console.log('SendSMS called with:', params);
        return { success: false, message: 'SMS integration not available in localStorage mode' };
      },
      UploadFile: async (params) => {
        // Store file as base64 in localStorage
        console.log('UploadFile called with:', params);
        if (params.file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({ url: reader.result, success: true });
            };
            reader.onerror = reject;
            reader.readAsDataURL(params.file);
          });
        }
        return { success: false, message: 'No file provided' };
      },
      GenerateImage: async (params) => {
        console.log('GenerateImage called with:', params);
        return { success: false, message: 'Image generation not available in localStorage mode' };
      },
      ExtractDataFromUploadedFile: async (params) => {
        console.log('ExtractDataFromUploadedFile called with:', params);
        return { success: false, message: 'File extraction not available in localStorage mode' };
      },
    },
  },
};

// Export for backwards compatibility
export default onhub;
