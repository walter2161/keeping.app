import { useEffect, useState } from 'react';
import { onhub } from '@/api/onhubClient';

// Componente para inicializar o OnHub
export default function OnhubInit({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if user is logged in and set up basic structure
    const initializeApp = async () => {
      try {
        const user = await onhub.auth.me();
        
        if (!user) {
          setIsInitialized(true);
          return;
        }

        console.log('[OnHub] User logged in:', user.email);
        
        // Check if user has any folders, if not they might be new
        const folders = await onhub.entities.Folder.list();
        const userFolders = folders.filter(f => f.owner === user.email && !f.parent_id && !f.deleted);
        
        if (userFolders.length === 0) {
          console.log('[OnHub] New user - creating basic structure');
          
          // Create a basic "My Documents" folder for new users
          await onhub.entities.Folder.create({
            name: 'Meus Documentos',
            parent_id: null,
            owner: user.email,
            color: 'blue'
          });
          
          console.log('[OnHub] Basic structure created');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('[OnHub] Error initializing:', error);
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  return children;
}
