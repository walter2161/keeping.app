import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createDefaultStructure } from './setup/DefaultStructureSetup';

// Componente para inicializar estrutura padrão
export default function Base44Init({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // LocalStorage já está inicializado, apenas verificar estrutura padrão
    const initializeDefaultStructure = async () => {
      try {
        // Verificar se está autenticado primeiro
        if (!base44.auth.isAuthenticated()) {
          console.log('[v0] Base44Init: not authenticated, skipping structure setup');
          setIsInitialized(true);
          return;
        }
        
        const user = base44.auth.me();
        console.log('[v0] Base44Init: user =', user);
        
        if (!user) {
          setIsInitialized(true);
          return;
        }

        // Buscar todas as pastas do usuário
        const folders = base44.entities.Folder.list();
        const userFolders = folders.filter(f => f.owner === user.email && !f.parent_id && !f.deleted);
        
        // Verificar se já existe a pasta EMPRESA com estrutura completa
        const empresaFolder = userFolders.find(f => f.name === 'EMPRESA');
        
        if (!empresaFolder) {
          console.log('[v0] Base44Init: creating default structure for ' + user.email);
          
          try {
            // Criar estrutura padrão
            await createDefaultStructure(user.email);
            
            // Marcar como criado no perfil do usuário
            base44.auth.updateMe({ default_structure_created: true });
            
            console.log('[v0] Base44Init: default structure created successfully!');
            
            // Recarregar a página para mostrar as pastas criadas
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } catch (structureError) {
            console.error('[v0] Base44Init: error creating structure:', structureError);
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('[v0] Base44Init: error checking structure:', error);
        setIsInitialized(true);
      }
    };

    // Aguardar um pouco para garantir que está pronto
    setTimeout(() => {
      initializeDefaultStructure();
    }, 200);
  }, []);

  return children;
}
