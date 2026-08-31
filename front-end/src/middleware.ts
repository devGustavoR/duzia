import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image (build assets)
     * - favicon.ico
     * - PWA metadata routes (manifest, generated icons) — must be reachable
     *   without a session or the "add to home screen" install breaks
     * - static image files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
