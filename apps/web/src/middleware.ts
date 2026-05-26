import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { UserRole } from '@foodmarket/shared-types';
import { CUSTOMER } from '@/lib/paths';
import { ACCESS_COOKIE } from '@/lib/auth/constants';
import {
  isAuthRequiredPath,
  isGuestOnlyPath,
  loginUrlWithReturn,
  panelForPath,
  redirectForRole,
  type TokenPayload,
} from '@/lib/auth/middleware-utils';

const SUBDOMAIN_PREFIX: Record<string, string> = {
  www: CUSTOMER,
  admin: '/admin',
  courier: '/courier',
  business: '/business',
  restaurant: '/restaurant',
  shop: '/business',
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function readToken(request: NextRequest): Promise<TokenPayload | null> {
  const raw = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!raw) return null;
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(raw, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

function applySubdomainRewrite(request: NextRequest): NextResponse | null {
  const host = request.headers.get('host')?.split(':')[0] ?? '';
  const parts = host.split('.');
  const sub = parts.length > 2 ? parts[0] : null;
  const prefix = sub ? SUBDOMAIN_PREFIX[sub] : null;
  if (!prefix) return null;

  const { pathname } = request.nextUrl;
  if (pathname.startsWith(prefix)) return null;

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? prefix : `${prefix}${pathname}`;
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  const subdomainResponse = applySubdomainRewrite(request);
  const { pathname } = request.nextUrl;

  const token = await readToken(request);
  const role = token?.role as UserRole | undefined;

  if (token && isGuestOnlyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = redirectForRole(role!);
    return NextResponse.redirect(url);
  }

  if (!token && isAuthRequiredPath(pathname)) {
    const panel = panelForPath(pathname);
    const url = request.nextUrl.clone();
    url.pathname = loginUrlWithReturn(pathname);
    url.searchParams.set('panel', panel?.prefix ?? '');
    return NextResponse.redirect(url);
  }

  if (token && panelForPath(pathname)) {
    const panel = panelForPath(pathname)!;
    if (!panel.roles.includes(role!)) {
      const url = request.nextUrl.clone();
      url.pathname = redirectForRole(role!);
      return NextResponse.redirect(url);
    }
  }

  if (subdomainResponse) return subdomainResponse;
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
