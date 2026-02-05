// Redirect to localStorage database for offline/local development
// This replaces the original base44 SDK with local storage

import { localDB } from '@/lib/localStorageDB';

// Export localDB as base44 so all existing imports work
export const base44 = localDB;

export default base44;
