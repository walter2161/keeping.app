import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createDefaultStructure } from './setup/DefaultStructureSetup';

// Componente para inicializar o SDK da Base44 manualmente
export default function Base44Init({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Forçar inicialização manual do SDK
    const baseUrl = import.meta.env.VITE_BASE44_API_URL || 'https://app.base44.com/api';
    const appId = import.meta.env.VITE_BASE44_APP_ID;
    const apiKey = import.meta.env.VITE_BASE44_API_KEY;

    console.log('🔧 Inicializando Base44 SDK:', {
      baseUrl,
      appId,
      hasApiKey: !!apiKey,
    });

    // Verificar se o SDK está configurado corretamente
    if (!baseUrl || baseUrl === 'undefined') {
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
          baseUrl,
          appId,
          apiKey,
        });
        console.log('✅ Base44 SDK inicializado com sucesso');
        console.log('[Base44 CONFIG]', base44.config || base44);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar Base44:', error);
    }

    // Verificar e criar estrutura padrão para TODOS os usuários
    const initializeDefaultStructure = async () => {
      try {
        const user = await base44.auth.me();
        
        if (!user) {
          setIsInitialized(true);
          return;
        }

        // Buscar todas as pastas do usuário
        const folders = await base44.entities.Folder.list();
        const userFolders = folders.filter(f => f.owner === user.email && !f.parent_id && !f.deleted);
        
        // Verificar se já existe a pasta EMPRESA com estrutura completa
        const empresaFolder = userFolders.find(f => f.name === 'EMPRESA');
        
        if (!empresaFolder) {
          console.log('🆕 Criando estrutura padrão EMPRESA completa para ' + user.email);
          
          try {
            // Criar estrutura padrão
            await createDefaultStructure(user.email);
            
            // Marcar como criado no perfil do usuário
            await base44.auth.updateMe({ default_structure_created: true });
            
            console.log('✅ Estrutura padrão EMPRESA criada com sucesso!');
            
            // Recarregar a página para mostrar as pastas criadas
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (structureError) {
            console.error('❌ Erro detalhado ao criar estrutura:', structureError);
          }
        } else {
          console.log('✓ Pasta EMPRESA já existe');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error);
        setIsInitialized(true);
      }
    };

    // Aguardar 500ms para garantir que o SDK está pronto
    setTimeout(() => {
      initializeDefaultStructure();
    }, 500);
  }, []);

  return children;
}