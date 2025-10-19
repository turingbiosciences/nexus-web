'use client'

import { AuthButton } from '@/components/auth/auth-button'
import { FileUploader } from '@/components/file-upload/file-uploader'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function HomePageClient() {
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
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

  // Debug logging
  console.log('HomePageClient - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'authError:', authError)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src="/turing-biosciences-logo.svg" 
                alt="Turing Biosciences" 
                className="h-12 w-auto"
              />
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {authError === 'auth_failed' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Failed
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>There was an error signing you in. Please try again.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Turing Biosciences
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Please sign in to access the secure file upload platform.
            </p>
            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Secure File Management
              </h3>
              <ul className="text-left text-gray-600 space-y-2">
                <li>• Upload files up to 5GB</li>
                <li>• Resumable uploads</li>
                <li>• Drag & drop interface</li>
                <li>• Enterprise-grade security</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                File Upload Dashboard
              </h2>
              <p className="text-lg text-gray-600">
                Upload and manage your files securely
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Files
              </h3>
              <FileUploader
                maxSize={5 * 1024 * 1024 * 1024} // 5GB
                onUploadComplete={(files) => {
                  console.log('Upload completed:', files)
                }}
                onUploadProgress={(fileId, progress) => {
                  console.log('Upload progress:', fileId, progress)
                }}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900">Total Files</h4>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900">Total Size</h4>
                  <p className="text-2xl font-bold text-green-600">0 MB</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-900">Successful Uploads</h4>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
