"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, Loader2, BarChart3, AlertCircle, CheckCircle2, Sparkles } from "lucide-react"
import { comparativeAnalysisService, ComparativeAnalysisResponse, UploadProgress, SSEProgressEvent } from "@/lib/api/comparative-analysis-service"
import { ProgressBar } from "./progress-bar"
import { FEATURES } from "@/config/features"

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
}

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

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
  const [dragOverCurrent, setDragOverCurrent] = useState(false)
  const [dragOverPrevious, setDragOverPrevious] = useState(false)

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

  const handleDragOver = (e: React.DragEvent, type: 'current' | 'previous') => {
    e.preventDefault()
    if (type === 'current') setDragOverCurrent(true)
    else setDragOverPrevious(true)
  }

  const handleDragLeave = (type: 'current' | 'previous') => {
    if (type === 'current') setDragOverCurrent(false)
    else setDragOverPrevious(false)
  }

  const handleDrop = (e: React.DragEvent, type: 'current' | 'previous') => {
    e.preventDefault()
    setDragOverCurrent(false)
    setDragOverPrevious(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      if (type === 'current') setCurrentYearFile(file)
      else setPreviousYearFile(file)
      setError(null)
    } else if (file) {
      setError('Solo se permiten archivos PDF para el análisis comparativo.')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !isAnalyzing && handleClose()}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/25"
                >
                  <BarChart3 className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Análisis Comparativo</h2>
                  <p className="text-sm text-muted-foreground">
                    Compara declaraciones de renta entre dos años
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isAnalyzing}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Content */}
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="flex-1 p-6 space-y-6"
            >
              {/* Instructions */}
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      ¿Cómo funciona el análisis comparativo?
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                      Sube las declaraciones de renta de dos años consecutivos del mismo contribuyente.
                      El sistema analizará las variaciones en patrimonio, ingresos, gastos, renta líquida e impuestos.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* File Upload Section */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Year File */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Declaración Año Actual *
                  </label>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onDragOver={(e) => handleDragOver(e, 'current')}
                    onDragLeave={() => handleDragLeave('current')}
                    onDrop={(e) => handleDrop(e, 'current')}
                    className={`
                      relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                      ${dragOverCurrent
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.02]'
                        : currentYearFile
                          ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10'
                          : 'border-gray-300 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600'
                      }
                    `}
                  >
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
                      <motion.div
                        animate={currentYearFile ? { scale: [1, 1.1, 1] } : {}}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          currentYearFile ? 'bg-green-500' : 'bg-green-100 dark:bg-green-900/30'
                        }`}
                      >
                        {currentYearFile ? (
                          <CheckCircle2 className="h-7 w-7 text-white" />
                        ) : (
                          <Upload className="h-7 w-7 text-green-600" />
                        )}
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          {currentYearFile ? 'Archivo seleccionado' : 'Arrastra o selecciona'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Solo archivos PDF (máximo 50MB)
                        </p>
                      </div>
                    </label>
                    <AnimatePresence>
                      {currentYearFile && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-200 truncate">
                              {currentYearFile.name}
                            </span>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {(currentYearFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Previous Year File */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Declaración Año Anterior *
                  </label>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onDragOver={(e) => handleDragOver(e, 'previous')}
                    onDragLeave={() => handleDragLeave('previous')}
                    onDrop={(e) => handleDrop(e, 'previous')}
                    className={`
                      relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                      ${dragOverPrevious
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
                        : previousYearFile
                          ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                          : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                      }
                    `}
                  >
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
                      <motion.div
                        animate={previousYearFile ? { scale: [1, 1.1, 1] } : {}}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          previousYearFile ? 'bg-blue-500' : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}
                      >
                        {previousYearFile ? (
                          <CheckCircle2 className="h-7 w-7 text-white" />
                        ) : (
                          <Upload className="h-7 w-7 text-blue-600" />
                        )}
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {previousYearFile ? 'Archivo seleccionado' : 'Arrastra o selecciona'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Solo archivos PDF (máximo 50MB)
                        </p>
                      </div>
                    </label>
                    <AnimatePresence>
                      {previousYearFile && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800 dark:text-blue-200 truncate">
                              {previousYearFile.name}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {(previousYearFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>

              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Section */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center"
                      >
                        <Loader2 className="h-5 w-5 text-white" />
                      </motion.div>
                      <div>
                        <p className="font-medium text-orange-800 dark:text-orange-200">
                          Analizando declaraciones...
                        </p>
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          Esto puede tomar unos momentos
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar - SSE Progress (si está habilitado) */}
                    {FEATURES.USE_SSE_PROGRESS && sseProgress && (
                      <ProgressBar
                        percentage={sseProgress.percentage}
                        message={sseProgress.message}
                      />
                    )}

                    {/* Progress Bar - Upload Progress (fallback o cuando SSE está deshabilitado) */}
                    {!FEATURES.USE_SSE_PROGRESS && uploadProgress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Procesando análisis comparativo...</span>
                          <span>{uploadProgress.percentage}%</span>
                        </div>
                        <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress.percentage}%` }}
                            className="bg-orange-600 h-2 rounded-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Mensaje genérico si no hay progreso disponible aún */}
                    {!sseProgress && !uploadProgress && (
                      <div className="flex items-center gap-3 text-sm text-orange-700 dark:text-orange-300">
                        <div className="flex space-x-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                              className="w-2 h-2 bg-orange-500 rounded-full"
                            />
                          ))}
                        </div>
                        <span>Iniciando análisis comparativo...</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={isAnalyzing}
                className="px-5 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 font-medium transition-colors"
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={!currentYearFile || !previousYearFile || isAnalyzing}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
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
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}