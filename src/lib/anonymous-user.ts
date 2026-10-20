
export function getOrCreateAnonymousUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('janpoll_anonymous_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('janpoll_anonymous_id', userId);
  }
  return userId;
}