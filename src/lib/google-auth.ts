import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

function isDevLoginEnabled() {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.ENABLE_DEV_LOGIN !== 'true'
  ) {
    return false;
  }

  try {
    const url = new URL(process.env.NEXTAUTH_URL ?? '');

    return (
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}

const devLoginEnabled = isDevLoginEnabled();

export const googleAuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),

    ...(devLoginEnabled
      ? [
          CredentialsProvider({
            id: 'dev-login',
            name: 'Local Test Login',
            credentials: {},

            async authorize() {
              if (!isDevLoginEnabled()) {
                return null;
              }

              const user = await db.user.upsert({
                where: {
                  email: 'dev-test@janpoll.invalid',
                },

                create: {
                  name: 'Local Test User',
                  email: 'dev-test@janpoll.invalid',
                },

                update: {},

                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              });

              return user;
            },
          }),
        ]
      : []),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async signIn({ account, user, profile }) {
      if (account?.provider === 'dev-login') {
        return isDevLoginEnabled();
      }

      if (account?.provider !== 'google') {
        return false;
      }

      const googleProfile = profile as
        | {
            email?: string;
            email_verified?: boolean;
          }
        | undefined;

      return Boolean(
        user.email &&
          googleProfile?.email_verified === true &&
          googleProfile.email?.toLowerCase() ===
            user.email.toLowerCase(),
      );
    },

    async jwt({ token, user, account }) {
      if (user && account?.provider === 'dev-login') {
        if (!isDevLoginEnabled()) {
          throw new Error('Development login is disabled.');
        }

        token.janpollUserId = user.id;
      }

      if (user && account?.provider === 'google') {
        const email = user.email?.trim().toLowerCase();

        if (!email) {
          throw new Error('Google email unavailable.');
        }

        const databaseUser = await db.user.upsert({
          where: { email },

          create: {
            email,
            name: user.name ?? null,
            image: user.image ?? null,
            emailVerified: new Date(),
          },

          update: {
            name: user.name ?? null,
            image: user.image ?? null,
            emailVerified: new Date(),
          },

          select: { id: true },
        });

        token.janpollUserId = databaseUser.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        return {
          ...session,
          user: {
            ...session.user,
            id:
              typeof token.janpollUserId === 'string'
                ? token.janpollUserId
                : undefined,
          },
        };
      }

      return session;
    },
  },
};