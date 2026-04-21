import { NextResponse, type NextRequest } from 'next/server'

const SESSION_MAX_AGE = 60 * 15 // 15 minuten

export function middleware(request: NextRequest) {
  const pinCookie = request.cookies.get('annes-recepten-auth')
  const path = request.nextUrl.pathname
  const isOnPinPage = path === '/pin'
  const isWebauthnApi = path.startsWith('/api/webauthn/')

  // WebAuthn API's lopen hun eigen auth-check; middleware mag die niet blokkeren
  if (isWebauthnApi) {
    return NextResponse.next()
  }

  if (!pinCookie && !isOnPinPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/pin'
    return NextResponse.redirect(url)
  }

  if (pinCookie && isOnPinPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Ververs de cookie bij elke request (rolling session)
  if (pinCookie && !isOnPinPage) {
    const response = NextResponse.next()
    response.cookies.set('annes-recepten-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
