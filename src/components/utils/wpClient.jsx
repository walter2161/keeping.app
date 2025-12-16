import { base44 } from '@/api/base44Client';

class WordPressClient {
  constructor() {
    this.config = null;
  }

  async getConfig() {
    if (!this.config) {
      const user = await base44.auth.me();
      this.config = {
        baseUrl: user.wp_url?.trim().replace(/\/$/, ''),
        apiKey: user.wp_api_key?.trim(),
        userEmail: user.email,
      };
    }
    return this.config;
  }

  resetConfig() {
    this.config = null;
  }

  async request(endpoint, options = {}) {
    const config = await this.getConfig();
    
    if (!config.baseUrl || !config.apiKey) {
      throw new Error('WordPress não configurado. Acesse a aba Wiki → Configuração para configurar a URL e API Key.');
    }

    const url = `${config.baseUrl}/wp-json/keeping/v1${endpoint}`;
    
    console.log('WordPress Request:', { url, method: options.method || 'GET', endpoint });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress Error:', { status: response.status, statusText: response.statusText, body: errorText });
      throw new Error(`Erro WordPress (${response.status}): ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('WordPress Response:', data);
    return data;
  }

  // Folders
  async listFolders() {
    const config = await this.getConfig();
    return this.request(`/folders?user_email=${encodeURIComponent(config.userEmail)}`);
  }

  async createFolder(data) {
    const config = await this.getConfig();
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        user_email: config.userEmail,
      }),
    });
  }

  async updateFolder(id, data) {
    return this.request(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFolder(id) {
    return this.request(`/folders/${id}`, {
      method: 'DELETE',
    });
  }

  // Files
  async listFiles() {
    const config = await this.getConfig();
    return this.request(`/files?user_email=${encodeURIComponent(config.userEmail)}`);
  }

  async getFile(id) {
    const config = await this.getConfig();
    const files = await this.listFiles();
    return files.find(f => f.id === id);
  }

  async createFile(data) {
    const config = await this.getConfig();
    return this.request('/files', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        user_email: config.userEmail,
      }),
    });
  }

  async updateFile(id, data) {
    return this.request(`/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFile(id) {
    return this.request(`/files/${id}`, {
      method: 'DELETE',
    });
  }
}

export const wpClient = new WordPressClient();