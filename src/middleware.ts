import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // For debugging routing issues
  console.log(`[MW] Request: ${pathname} | Token: ${token ? 'Found' : 'Missing'}`);

  // Allow public paths through without checking
  const publicPaths = ['/auth', '/store', '/api/auth', '/api/public', '/_next', '/favicon'];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Not authenticated → send to sign in
  if (!token) {
    console.log(`[MW] No token, redirecting ${pathname} to /auth/signin`);
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  const role = (token as any).role as string | undefined;
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isUser = role === 'user';

  // Customer users should NOT access /dashboard — redirect to their store
  if (pathname.startsWith('/dashboard')) {
    if (!isOwnerOrAdmin) {
      const slug = (token as any).institutionSlug as string | undefined;
      const dest = slug ? `/store/${slug}` : '/store';
      console.log(`[MW] Non-admin hitting dashboard, redirecting to ${dest}`);
      return NextResponse.redirect(new URL(dest, req.url));
    }
  }

  // Owners/admins should not access the user dashboard
  if (pathname.startsWith('/user') && isOwnerOrAdmin) {
    console.log('[MW] Admin hitting user area, redirecting to /dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Users landing on / should go to user dashboard (store remains accessible)
  if (pathname === '/' && isUser) {
    return NextResponse.redirect(new URL('/user', req.url));
  }

  // Non-owners/admins hitting root / → redirect appropriately
  if (pathname === '/') {
    const slug = (token as any).institutionSlug as string | undefined;
    if (isOwnerOrAdmin) {
      console.log('[MW] Admin hitting /, redirecting to /dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    const dest = slug ? `/store/${slug}` : '/store';
    console.log(`[MW] User hitting /, redirecting to ${dest}`);
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
