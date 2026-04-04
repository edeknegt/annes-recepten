import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pinCookie = request.cookies.get('annes-recepten-auth')
  const isOnPinPage = request.nextUrl.pathname === '/pin'

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

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
