import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role: 'admin' | 'customer' | 'cleaner'
  }
  interface Session {
    user: {
      id:    string
      email: string
      name?: string | null
      role:  'admin' | 'customer' | 'cleaner'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:         string
    role:       'admin' | 'customer' | 'cleaner'
    checkedAt:  number
  }
}
