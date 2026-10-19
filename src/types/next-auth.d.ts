import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      // पुराने JWT में ID नहीं होगी, इसलिए optional है।
      id?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    janpollUserId?: string;
  }
}