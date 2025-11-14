"use client"

import React, { useState } from "react"
import { X, Upload, FileText, Loader2, BarChart3, AlertCircle } from "lucide-react"
import { comparativeAnalysisService, ComparativeAnalysisResponse, UploadProgress, SSEProgressEvent } from "@/lib/api/comparative-analysis-service"
import { ProgressBar } from "./progress-bar"
import { FEATURES } from "@/config/features"

interface ComparativeAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  onAnalysisComplete?: (result: ComparativeAnalysisResponse) => void
}

export function ComparativeAnalysisModal({ isOpen, onClose, onAnalysisComplete }: ComparativeAnalysisModalProps) {
  const [currentYearFile, setCurrentYearFile] = useState<File | null>(null)
  const [previousYearFile, setPreviousYearFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [sseProgress, setSSEProgress] = useState<SSEProgressEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCurrentYearFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setCurrentYearFile(file)
      setError(null)
    } else if (file) {
      setError('Solo se permiten archivos PDF para el análisis comparativo.')
    }
  }

  const handlePreviousYearFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPreviousYearFile(file)
      setError(null)
    } else if (file) {
      setError('Solo se permiten archivos PDF para el análisis comparativo.')
    }
  }

  const handleAnalyze = async () => {
    if (!currentYearFile) {
      setError('Por favor selecciona el archivo de la declaración del año actual.')
      return
    }

    if (!previousYearFile) {
      setError('Por favor selecciona el archivo de la declaración del año anterior.')
      return
    }

    setIsAnalyzing(true)
    setUploadProgress(null)
    setSSEProgress(null)
    setError(null)

    try {
      const response = await comparativeAnalysisService.analyzeDeclarationComparative(
        currentYearFile,
        previousYearFile,
        (progress) => {
          setUploadProgress(progress)
        },
        FEATURES.USE_SSE_PROGRESS ? (progress) => {
          setSSEProgress(progress)
        } : undefined
      )

      if (onAnalysisComplete) {
        onAnalysisComplete(response)
      }
      handleClose()
    } catch (error) {
      console.error('Error during comparative analysis:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido durante el análisis')
    } finally {
      setIsAnalyzing(false)
      setUploadProgress(null)
      setSSEProgress(null)
    }
  }

  const handleClose = () => {
    if (!isAnalyzing) {
      setCurrentYearFile(null)
      setPreviousYearFile(null)
      setError(null)
      setUploadProgress(null)
      setSSEProgress(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Análisis Comparativo</h2>
              <p className="text-sm text-muted-foreground">
                Compara declaraciones de renta entre dos años
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isAnalyzing}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  ¿Cómo funciona el análisis comparativo?
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Sube las declaraciones de renta de dos años consecutivos del mismo contribuyente.
                  El sistema analizará las variaciones en patrimonio, ingresos, gastos, renta líquida e impuestos.
                </p>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Year File */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Declaración Año Actual *
              </label>
              <div className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg p-6 text-center hover:border-green-400 dark:hover:border-green-600 transition-colors">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleCurrentYearFileChange}
                  disabled={isAnalyzing}
                  className="hidden"
                  id="current-year-file"
                />
                <label
                  htmlFor="current-year-file"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      {currentYearFile ? 'Cambiar archivo' : 'Seleccionar archivo PDF'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo archivos PDF (máximo 50MB)
                    </p>
                  </div>
                </label>
                {currentYearFile && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200 truncate">
                        {currentYearFile.name}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {(currentYearFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Year File */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Declaración Año Anterior *
              </label>
              <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePreviousYearFileChange}
                  disabled={isAnalyzing}
                  className="hidden"
                  id="previous-year-file"
                />
                <label
                  htmlFor="previous-year-file"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {previousYearFile ? 'Cambiar archivo' : 'Seleccionar archivo PDF'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo archivos PDF (máximo 50MB)
                    </p>
                  </div>
                </label>
                {previousYearFile && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200 truncate">
                        {previousYearFile.name}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {(previousYearFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Progress Bar - SSE Progress (si está habilitado) */}
          {isAnalyzing && FEATURES.USE_SSE_PROGRESS && sseProgress && (
            <div className="space-y-2">
              <ProgressBar
                percentage={sseProgress.percentage}
                message={sseProgress.message}
              />
            </div>
          )}

          {/* Progress Bar - Upload Progress (fallback o cuando SSE está deshabilitado) */}
          {isAnalyzing && !FEATURES.USE_SSE_PROGRESS && uploadProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Procesando análisis comparativo...</span>
                <span>{uploadProgress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Mensaje genérico si no hay progreso disponible aún */}
          {isAnalyzing && !sseProgress && !uploadProgress && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Iniciando análisis comparativo...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isAnalyzing}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!currentYearFile || !previousYearFile || isAnalyzing}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                Realizar Análisis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}