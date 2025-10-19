'use client'

import { LogtoProvider } from '@logto/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const config = {
    endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
    appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
    scopes: ['openid', 'profile', 'email', 'offline_access'],
  }

  console.log('Logto config:', config)

  return (
    <LogtoProvider config={config}>
      {children}
    </LogtoProvider>
  )
}
