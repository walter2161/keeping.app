import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * SYNC DIRECTIVE - Real-time synchronization hook
 * 
 * This hook ensures that Terminal, AI Assistant, and all components
 * are automatically synchronized with database changes in real-time.
 * 
 * Usage: Add useSyncData() at the top of any component that needs live updates.
 */
export function useSyncData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to Folder changes
    const unsubscribeFolders = base44.entities.Folder.subscribe((event) => {
      console.log('[SYNC] Folder event:', event.type, event.id);
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    });

    // Subscribe to File changes
    const unsubscribeFiles = base44.entities.File.subscribe((event) => {
      console.log('[SYNC] File event:', event.type, event.id);
      queryClient.invalidateQueries({ queryKey: ['files'] });
    });

    // Subscribe to Team changes
    const unsubscribeTeams = base44.entities.Team.subscribe((event) => {
      console.log('[SYNC] Team event:', event.type, event.id);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    });

    // Subscribe to TeamInvitation changes
    const unsubscribeInvites = base44.entities.TeamInvitation.subscribe((event) => {
      console.log('[SYNC] TeamInvitation event:', event.type, event.id);
      queryClient.invalidateQueries({ queryKey: ['teamInvitations'] });
    });

    // Subscribe to TeamActivity changes
    const unsubscribeActivity = base44.entities.TeamActivity.subscribe((event) => {
      console.log('[SYNC] TeamActivity event:', event.type, event.id);
      queryClient.invalidateQueries({ queryKey: ['teamActivities'] });
    });

    // Subscribe to ActiveSession changes
    const unsubscribeSessions = base44.entities.ActiveSession.subscribe((event) => {
      console.log('[SYNC] ActiveSession event:', event.type, event.id);
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
    });

    // Subscribe to ChatMessage changes
    const unsubscribeMessages = base44.entities.ChatMessage.subscribe((event) => {
      console.log('[SYNC] ChatMessage event:', event.type, event.id);
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    });

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribeFolders();
      unsubscribeFiles();
      unsubscribeTeams();
      unsubscribeInvites();
      unsubscribeActivity();
      unsubscribeSessions();
      unsubscribeMessages();
    };
  }, [queryClient]);
}

/**
 * SYNC DIRECTIVE RULES:
 * 
 * 1. ALL components that display or modify Folders, Files, Teams must use useSyncData()
 * 2. Terminal MUST use useSyncData() to stay updated with Drive changes
 * 3. AI Assistant MUST use useSyncData() to stay updated with all changes
 * 4. Drive pages MUST use useSyncData() for real-time collaboration
 * 5. FileViewer MUST use useSyncData() for live editing sessions
 * 
 * 6. When creating new mutations, ALWAYS invalidate queries to trigger sync
 * 7. When updating entities, ALWAYS use base44.entities methods (never direct API)
 * 8. Real-time subscriptions handle automatic updates across all components
 * 
 * This ensures Terminal and AI Assistant are ALWAYS synchronized with the app state.
 */