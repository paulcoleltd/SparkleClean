export { auth as middleware } from './auth'

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/cleaner/:path*'],
}
