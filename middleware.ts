export { auth as middleware } from './auth'

export const config = {
  matcher: [
    '/admin/((?!login$).*)',
    '/account/((?!login|register|forgot-password).*)',
    '/cleaner/((?!login$).*)',
  ],
}
