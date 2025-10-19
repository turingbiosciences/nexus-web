'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatBytes, formatUploadProgress } from '@/lib/utils'

interface FileUpload {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error'
  error?: string
  tusUpload?: unknown
}

interface FileUploaderProps {
  maxSize?: number
  onUploadComplete?: (files: File[]) => void
  onUploadProgress?: (fileId: string, progress: number) => void
}

export function FileUploader({ 
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB default
  onUploadComplete,
  onUploadProgress 
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: FileUpload[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }))

    setUploads(prev => [...prev, ...newUploads])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      'text/*': ['.txt', '.csv', '.json', '.xml'],
      'application/*': ['.zip', '.rar', '.7z', '.tar', '.gz'],
    }
  })

  const startUpload = async (upload: FileUpload) => {
    try {
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'uploading' } : u
      ))

      // Simulate upload progress for demo
      // In production, integrate with TUS protocol or your backend
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, progress } : u
        ))
        
        onUploadProgress?.(upload.id, progress)
      }

      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'completed' } : u
      ))

      onUploadComplete?.([upload.file])
    } catch (error) {
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { 
          ...u, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : u
      ))
    }
  }

  const pauseUpload = (upload: FileUpload) => {
    setUploads(prev => prev.map(u => 
      u.id === upload.id ? { ...u, status: 'paused' } : u
    ))
  }

  const resumeUpload = (upload: FileUpload) => {
    startUpload(upload)
  }

  const removeUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId))
  }

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      default:
        return <Upload className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: FileUpload['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'uploading':
        return 'border-blue-200 bg-blue-50'
      case 'paused':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-blue-400 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500">
          or click to select files (max {formatBytes(maxSize)})
        </p>
      </div>

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Upload Queue</h3>
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className={cn(
                "border rounded-lg p-4 transition-colors",
                getStatusColor(upload.status)
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(upload.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(upload.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Progress Bar */}
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  
                  {/* Progress Text */}
                  <span className="text-xs text-gray-500 w-12">
                    {formatUploadProgress(upload.progress, 100)}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                    {upload.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startUpload(upload)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {upload.status === 'uploading' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseUpload(upload)}
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {upload.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resumeUpload(upload)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUpload(upload.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {upload.error && (
                <p className="text-xs text-red-600 mt-2">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
