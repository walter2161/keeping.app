// OnHub Client - WordPress REST API + LocalStorage fallback
// Connects to a WordPress plugin (onhub-db) for data persistence
// Falls back to localStorage when WP is not configured

const STORAGE_PREFIX = 'onhub_';
const WP_CONFIG_KEY = `${STORAGE_PREFIX}wp_config`;

// --- WordPress config management ---
const getWpConfig = () => {
  try {
    const config = localStorage.getItem(WP_CONFIG_KEY);
    if (config) {
      const parsed = JSON.parse(config);
      if (parsed.url && parsed.apiKey) return parsed;
    }
  } catch {}
  return null;
};

const setWpConfig = (url, apiKey) => {
  localStorage.setItem(WP_CONFIG_KEY, JSON.stringify({ url: url.replace(/\/+$/, ''), apiKey }));
};

const clearWpConfig = () => {
  localStorage.removeItem(WP_CONFIG_KEY);
};

const isWpConnected = () => !!getWpConfig();

// --- WordPress REST API helper ---
const wpFetch = async (endpoint, options = {}) => {
  const config = getWpConfig();
  if (!config) throw new Error('WordPress not configured');

  const url = `${config.url}/wp-json/onhub/v1${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-OnHub-Key': config.apiKey,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `WP API error: ${res.status}`);
  }

  return res.json();
};

// --- localStorage helpers (fallback) ---
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

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// --- Entity factory (auto-switch WP / localStorage) ---
const createEntity = (entityName) => {
  const storageKey = getStorageKey(entityName);

  return {
    list: async (filters = {}) => {
      if (isWpConnected()) {
        const params = new URLSearchParams(filters).toString();
        return wpFetch(`/${entityName}${params ? `?${params}` : ''}`);
      }
      const items = getFromStorage(storageKey);
      if (Object.keys(filters).length > 0) {
        return items.filter(item =>
          Object.entries(filters).every(([key, value]) => item[key] === value)
        );
      }
      return items;
    },

    get: async (id) => {
      if (isWpConnected()) return wpFetch(`/${entityName}/${id}`);
      const items = getFromStorage(storageKey);
      return items.find(item => item.id === id) || null;
    },

    create: async (data) => {
      if (isWpConnected()) return wpFetch(`/${entityName}`, { method: 'POST', body: JSON.stringify(data) });
      const items = getFromStorage(storageKey);
      const newItem = { ...data, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      items.push(newItem);
      saveToStorage(storageKey, items);
      return newItem;
    },

    update: async (id, data) => {
      if (isWpConnected()) return wpFetch(`/${entityName}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      const items = getFromStorage(storageKey);
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
        saveToStorage(storageKey, items);
        return items[index];
      }
      throw new Error(`Item with id ${id} not found`);
    },

    delete: async (id) => {
      if (isWpConnected()) return wpFetch(`/${entityName}/${id}`, { method: 'DELETE' });
      const items = getFromStorage(storageKey);
      saveToStorage(storageKey, items.filter(item => item.id !== id));
      return true;
    },

    subscribe: (callback) => {
      const checkInterval = setInterval(() => {}, 1000);
      return () => clearInterval(checkInterval);
    },
  };
};

// --- Auth management ---
const createAuth = () => {
  const USER_KEY = `${STORAGE_PREFIX}current_user`;
  const LOGGED_IN_KEY = `${STORAGE_PREFIX}is_logged_in`;

  return {
    me: async () => {
      const isLoggedIn = localStorage.getItem(LOGGED_IN_KEY) === 'true';
      if (!isLoggedIn) return null;
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    },

    login: async (username, password) => {
      // Try WP auth first if configured
      if (isWpConnected()) {
        try {
          const user = await wpFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
          });
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          localStorage.setItem(LOGGED_IN_KEY, 'true');
          return user;
        } catch {
          // Fall through to local auth
        }
      }

      // Local admin login
      if (username === 'admin' && password === '123456') {
        const user = {
          id: 'admin-user',
          email: 'admin@onhub.local',
          name: 'Admin',
          full_name: 'Administrador',
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

    isLoggedIn: () => localStorage.getItem(LOGGED_IN_KEY) === 'true',

    redirectToLogin: () => {
      window.location.href = '/';
    },
  };
};

// --- Integration stubs ---
const createIntegrations = () => ({
  Core: {
    InvokeLLM: async (params) => {
      if (isWpConnected()) {
        try { return await wpFetch('/integrations/llm', { method: 'POST', body: JSON.stringify(params) }); } catch {}
      }
      return { response: 'LLM integration not available' };
    },
    SendEmail: async (params) => {
      if (isWpConnected()) {
        try { return await wpFetch('/integrations/email', { method: 'POST', body: JSON.stringify(params) }); } catch {}
      }
      return { success: false, message: 'Email integration not available' };
    },
    SendSMS: async (params) => {
      return { success: false, message: 'SMS integration not available' };
    },
    UploadFile: async (params) => {
      if (isWpConnected() && params.file) {
        try {
          const formData = new FormData();
          formData.append('file', params.file);
          const config = getWpConfig();
          const res = await fetch(`${config.url}/wp-json/onhub/v1/upload`, {
            method: 'POST',
            headers: { 'X-OnHub-Key': config.apiKey },
            body: formData,
          });
          if (res.ok) return res.json();
        } catch {}
      }
      // Fallback: base64
      if (params.file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ url: reader.result, success: true });
          reader.onerror = reject;
          reader.readAsDataURL(params.file);
        });
      }
      return { success: false, message: 'No file provided' };
    },
    GenerateImage: async () => ({ success: false, message: 'Image generation not available' }),
    ExtractDataFromUploadedFile: async () => ({ success: false, message: 'Not available' }),
  },
});

// --- Main client ---
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
  integrations: createIntegrations(),
  // WP config helpers exposed for the settings page
  wp: { getConfig: getWpConfig, setConfig: setWpConfig, clearConfig: clearWpConfig, isConnected: isWpConnected },
};

export default onhub;
