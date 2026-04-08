"use client"

import { useState, useCallback } from "react"
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileWithPreview extends File {
  preview?: string
  id: string
}

interface FileUploadProps {
  onFilesChange: (files: FileWithPreview[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  isUploading?: boolean
  title?: string
  description?: string
}

export function FileUpload({
  onFilesChange,
  maxFiles = 10,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  maxFileSize = 10,
  isUploading = false,
  title = "Cargar Archivos RUT",
  description = "Arrastra y suelta archivos aquí o haz clic para seleccionar"
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no válido: ${file.name}. Solo se permiten PDF e imágenes.`
    }
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Archivo muy grande: ${file.name}. Máximo ${maxFileSize}MB.`
    }
    return null
  }

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: FileWithPreview[] = []
    const newErrors: string[] = []

    Array.from(newFiles).forEach((file) => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(error)
        return
      }


      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: Math.random().toString(36).substring(2),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      })

      validFiles.push(fileWithPreview)
    })

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles]
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)
    }

    setErrors(newErrors)
  }, [files, maxFiles, onFilesChange])

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(file => {
      if (file.id === fileId) {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
        return false
      }
      return true
    })
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [files, onFilesChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }, [addFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files))
    }
  }, [addFiles])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200",
          dragActive ? "border-brand-indigo bg-brand-indigo/5" : "border-brand-border",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 text-brand-text-secondary">
            <Upload className="h-full w-full" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brand-text">
              {title}
            </h3>
            <p className="text-sm text-brand-text-secondary">
              {description}
            </p>
            <p className="text-xs text-brand-text-secondary">
              PDF e imágenes (JPG, PNG) - Máximo {maxFileSize}MB por archivo
            </p>
          </div>

          <button
            type="button"
            disabled={isUploading}
            className="btn-primary"
          >
            {isUploading ? "Procesando..." : "Seleccionar Archivos"}
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-error bg-error-bg p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-brand-text">
            Archivos seleccionados ({files.length})
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-brand-bg rounded-lg"
              >
                <div className="flex-shrink-0">
                  {file.type === 'application/pdf' ? (
                    <FileText className="h-6 w-6 text-error" />
                  ) : (
                    <div className="h-6 w-6 bg-brand-indigo/10 rounded flex items-center justify-center">
                      <span className="text-xs font-medium text-brand-indigo">IMG</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-brand-text truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-brand-text-secondary">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  disabled={isUploading}
                  className="p-1 text-brand-text-secondary hover:text-error transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}