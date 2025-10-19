'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the API route to handle the callback
    window.location.href = '/api/logto/sign-in-callback'
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Processing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we complete your sign-in...</p>
      </div>
    </div>
  )
}
