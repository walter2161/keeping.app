import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Componente para inicializar o SDK da Base44 manualmente
export default function Base44Init({ children }) {
  useEffect(() => {
    // Forçar inicialização manual do SDK
    const apiUrl = import.meta.env.VITE_BASE44_API_URL || 'https://app.base44.com/api';
    const appId = import.meta.env.VITE_BASE44_APP_ID;
    const apiKey = import.meta.env.VITE_BASE44_API_KEY;

    console.log('🔧 Inicializando Base44 SDK:', {
      apiUrl,
      appId,
      hasApiKey: !!apiKey,
    });

    // Verificar se o SDK está configurado corretamente
    if (!apiUrl || apiUrl === 'undefined') {
      console.error('❌ VITE_BASE44_API_URL não está definida!');
    }
    if (!appId || appId === 'undefined') {
      console.error('❌ VITE_BASE44_APP_ID não está definida!');
    }
    if (!apiKey || apiKey === 'undefined') {
      console.error('❌ VITE_BASE44_API_KEY não está definida!');
    }

    // Tentar inicializar
    try {
      if (base44.init && typeof base44.init === 'function') {
        base44.init({
          apiUrl,
          appId,
          apiKey,
        });
        console.log('✅ Base44 SDK inicializado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar Base44:', error);
    }
  }, []);

  return children;
}