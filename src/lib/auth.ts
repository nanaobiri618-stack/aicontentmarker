import { getServerSession } from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';

const GOD_ADMIN_EMAIL = 'admingod123@gmail.com';
const GOD_ADMIN_PASSWORD = 'GODad_2026a';

export const authOptions: NextAuthOptions = {
  // Use JWT sessions to avoid PrismaAdapter Session/Account tables.
  // We manage Users ourselves via `prisma.user`.
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase?.().trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        // Bootstrap the "God Admin" account on first login attempt.
        if (email === GOD_ADMIN_EMAIL) {
          const existing = await prisma.user.findUnique({ where: { email } });
          if (!existing) {
            const passwordHash = await bcrypt.hash(GOD_ADMIN_PASSWORD, 10);
            await prisma.user.create({
              data: {
                email,
                name: 'Main Admin',
                role: 'admin',
                passwordHash,
              },
            });
          }
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { institution: true },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // NextAuth expects id as string.
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          institutionSlug: user.institution?.slug ?? null,
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[AUTH] signIn callback triggered', { 
        provider: account?.provider, 
        email: user?.email,
        name: user?.name,
      });

      if (account?.provider === 'google' && user.email) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existing) {
            console.log('[AUTH] New Google user, creating database entry...', user.email);
            let role = 'user';
            try {
              // cookies() can throw or be unavailable in some callback environments
              const cookieStore = cookies();
              const signupRole = cookieStore.get('signupRole')?.value;
              console.log('[AUTH] signupRole cookie value:', signupRole);
              if (signupRole === 'owner' || signupRole === 'admin') {
                role = signupRole;
              }
            } catch (e) {
              console.warn('[AUTH] Failed to read signupRole cookie (expected in some environments)', e);
            }

            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name ?? 'Google User',
                image: user.image ?? null,
                role: role,
              },
            });
            console.log('[AUTH] User created successfully:', newUser.id);
          } else {
            console.log('[AUTH] Existing user found in database:', existing.email);
          }
        } catch (e) {
          console.error('[AUTH] Critical error in Google signIn callback:', e);
          // Return false here to prevent login if we couldn't create/find user
          return false;
        }
      }
      return true;
    },
    jwt: async ({ token, user }: any) => {
      // console.log('[AUTH] jwt callback token:', token.email);
      
      // If logging in via credentials, seed token from returned user.
      if (user) {
        console.log('[AUTH] Seeding token from user object:', user.email);
        token.role = (user as any).role ?? token.role ?? 'user';
        token.institutionSlug = (user as any).institutionSlug ?? null;
      }

      // Fix: Look up the user by email! Google OAuth IDs in token.sub will crash parseInt().
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            include: { institution: true },
          });

          if (dbUser) {
            // Re-map token.sub to our database ID instead of the Google profile ID
            token.sub = String(dbUser.id);
            token.role = dbUser.role;
            token.institutionSlug = dbUser.institution?.slug ?? null;
          }
        } catch (e) {
          console.error('[AUTH] Database lookup failed in JWT callback:', e);
        }
      }

      return token;
    },
    session: async ({ session, token }: any) => {
      // console.log('[AUTH] session callback for:', session?.user?.email);
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.institutionSlug = token.institutionSlug;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function getUserInstitution(userId: string) {
  const parsedUserId = parseInt(userId);
  if (isNaN(parsedUserId)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: parsedUserId },
    include: { institution: true },
  });
  return user?.institution;
}
