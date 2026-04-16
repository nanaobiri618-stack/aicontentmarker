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
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existing) {
            let role = 'user';
            try {
              const cookieStore = cookies();
              const signupRole = cookieStore.get('signupRole')?.value;
              if (signupRole === 'owner' || signupRole === 'admin') {
                role = signupRole;
              }
            } catch (e) {
              console.error('Failed to read signupRole cookie', e);
            }

            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name ?? 'Google User',
                image: user.image ?? null,
                role: role,
              },
            });
          }
        } catch (e) {
          console.error('Error in Google signIn callback', e);
          return false;
        }
      }
      return true;
    },
    jwt: async ({ token, user }: any) => {
      // If logging in via credentials, seed token from returned user.
      if (user) {
        token.role = (user as any).role ?? token.role ?? 'user';
        token.institutionSlug = (user as any).institutionSlug ?? null;
      }

      // Enrich JWT with role + institution slug for middleware redirects.
      const userId = token?.sub ? parseInt(token.sub) : NaN;
      if (!Number.isNaN(userId)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: { institution: true },
        });

        token.role = dbUser?.role ?? token.role ?? 'user';
        token.institutionSlug = dbUser?.institution?.slug ?? token.institutionSlug ?? null;
      }

      return token;
    },
    session: async ({ session, token }: any) => {
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
