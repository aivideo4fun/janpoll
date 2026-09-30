import { v4 as uuidv4 } from 'uuid';

export function getOrCreateAnonymousUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('janpoll_anonymous_id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('janpoll_anonymous_id', userId);
  }
  return userId;
}