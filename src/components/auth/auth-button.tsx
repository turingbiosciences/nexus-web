'use client'

import { LogIn, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function AuthButton() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/logto/user')
        setIsAuthenticated(response.ok)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleSignIn = () => {
    window.location.href = '/api/logto/sign-in'
  }

  const handleSignOut = () => {
    window.location.href = '/api/logto/sign-out'
  }

  // Debug logging
  console.log('AuthButton - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated)

  if (isLoading) {
    return (
      <Button disabled>
        <User className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (isAuthenticated) {
    return (
      <Button onClick={handleSignOut} variant="outline">
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    )
  }

  return (
    <Button onClick={handleSignIn}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  )
}
