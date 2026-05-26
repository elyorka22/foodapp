import { NextRequest, NextResponse } from 'next/server';
import { CUSTOMER } from '@/lib/paths';

/** Subdomain → panel path prefix (single Next.js app). */
const SUBDOMAIN_PREFIX: Record<string, string> = {
  www: CUSTOMER,
  admin: '/admin',
  courier: '/courier',
  business: '/business',
  restaurant: '/restaurant',
  shop: '/business',
};

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? '';
  const parts = host.split('.');
  const sub = parts.length > 2 ? parts[0] : null;
  const prefix = sub ? SUBDOMAIN_PREFIX[sub] : null;

  if (!prefix) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith(prefix)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? prefix : `${prefix}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
