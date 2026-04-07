"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  }
}
import {
  Upload,
  FileText,
  Loader2,
  ArrowLeft,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  Trash2,
  Plus,
  Building,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Hash,
  ClipboardCheck,
  FileCheck,
  Info
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ivaDeclarationService,
  IvaExtractionResponse,
  IvaExtractionResult,
  IvaDeclarationData,
  getPeriodName
} from "@/lib/api/iva-declaration-service"
import {
  ivaValidationService,
  IvaValidationResponse,
  IvaValidationProgress,
  IvaValidationRequest
} from "@/lib/api/iva-validation-service"
import {
  declarationStorageService,
  StoredRentaDeclaration
} from "@/lib/services/declaration-storage-service"
import { FEATURES } from "@/config/features"
import { ProgressBar } from "@/components/ui/progress-bar"
import { IvaValidationChecklist } from "@/components/ui/iva-validation-checklist"
import { formatCurrency } from "@/lib/utils/format"

interface UploadedFile {
  id: string
  file: File
  name: string
  size: string
}

export default function AnalisisDeclaracionesIvaPage() {
  // Extraction states
  const [ivaFiles, setIvaFiles] = useState<UploadedFile[]>([])
  const [relatedFiles, setRelatedFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOverIva, setDragOverIva] = useState(false)
  const [dragOverRelated, setDragOverRelated] = useState(false)
  const [extractionResult, setExtractionResult] = useState<IvaExtractionResponse | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Validation states
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<IvaValidationResponse | null>(null)
  const [validationProgress, setValidationProgress] = useState<IvaValidationProgress | null>(null)
  const [rentaData, setRentaData] = useState<StoredRentaDeclaration | null>(null)
  const [useStoredRenta, setUseStoredRenta] = useState(true)

  // Load stored renta data on mount
  useEffect(() => {
    const storedRenta = declarationStorageService.getRentaDeclaration()
    if (storedRenta) {
      setRentaData(storedRenta)
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // formatCurrency imported from @/lib/utils/format

  const generateId = () => Math.random().toString(36).substring(2, 11)

  const handleIvaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: generateId(),
        file,
        name: file.name,
        size: formatFileSize(file.size)
      }))
      setIvaFiles(prev => [...prev, ...newFiles])
      setError(null)
    }
    e.target.value = ''
  }

  const handleRelatedFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: generateId(),
        file,
        name: file.name,
        size: formatFileSize(file.size)
      }))
      setRelatedFiles(prev => [...prev, ...newFiles])
      setError(null)
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent, type: 'iva' | 'related') => {
    e.preventDefault()
    if (type === 'iva') {
      setDragOverIva(false)
    } else {
      setDragOverRelated(false)
    }

    const files = e.dataTransfer.files
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files)
        .filter(file => file.type === 'application/pdf')
        .map(file => ({
          id: generateId(),
          file,
          name: file.name,
          size: formatFileSize(file.size)
        }))

      if (type === 'iva') {
        setIvaFiles(prev => [...prev, ...newFiles])
      } else {
        setRelatedFiles(prev => [...prev, ...newFiles])
      }
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeIvaFile = (id: string) => {
    setIvaFiles(prev => prev.filter(f => f.id !== id))
  }

  const removeRelatedFile = (id: string) => {
    setRelatedFiles(prev => prev.filter(f => f.id !== id))
  }

  const toggleCardExpanded = (filename: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(filename)) {
        newSet.delete(filename)
      } else {
        newSet.add(filename)
      }
      return newSet
    })
  }

  const handleAnalyze = async () => {
    if (ivaFiles.length === 0) {
      setError('Por favor sube al menos una declaración de IVA para analizar.')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setExtractionResult(null)

    try {
      const files = ivaFiles.map(f => f.file)
      const result = await ivaDeclarationService.extractDeclarations(files)
      setExtractionResult(result)

      // Expand all successful extractions by default
      const successfulFilenames = result.results
        .filter(r => r.success)
        .map(r => r.filename)
      setExpandedCards(new Set(successfulFilenames))
    } catch (err) {
      console.error('Error analyzing IVA declarations:', err)
      setError(err instanceof Error ? err.message : 'Error durante el análisis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearAll = () => {
    setIvaFiles([])
    setRelatedFiles([])
    setError(null)
    setExtractionResult(null)
    setExpandedCards(new Set())
    setValidationResult(null)
    setValidationProgress(null)
  }

  const handleValidate = async () => {
    if (!extractionResult) return

    setIsValidating(true)
    setError(null)
    setValidationProgress(null)

    try {
      // Build request with extracted IVA data
      const ivaDeclarations = extractionResult.results
        .filter(r => r.success && r.data)
        .map(r => r.data!)

      if (ivaDeclarations.length === 0) {
        throw new Error('No hay declaraciones de IVA válidas para validar')
      }

      const request: IvaValidationRequest = {
        iva_declarations: ivaDeclarations
      }

      // Add renta data if available and selected
      if (useStoredRenta && rentaData) {
        request.renta_declaration = rentaData.declaracion
      }

      // Call validation service
      const result = await ivaValidationService.validateChecklist(
        request,
        FEATURES.USE_SSE_PROGRESS ? (progress) => setValidationProgress(progress) : undefined
      )

      setValidationResult(result)
    } catch (err) {
      console.error('Error validating IVA declarations:', err)
      setError(err instanceof Error ? err.message : 'Error durante la validación')
    } finally {
      setIsValidating(false)
      setValidationProgress(null)
    }
  }

  const clearValidation = () => {
    setValidationResult(null)
    setValidationProgress(null)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header with Back Button */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Link
            href="/analisis-eficacia"
            className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Análisis de Eficacia
          </Link>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-brand-indigo flex items-center justify-center shadow-lg shadow-brand-navy/25">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text">
                  Análisis Declaración de IVA
                </h1>
                <p className="text-brand-text-secondary">
                  Extracción y validación de declaraciones de IVA con documentos de soporte
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-error-bg border border-error-bg rounded-xl p-4"
            >
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
                <p className="text-sm text-error-foreground">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Sections */}
        {!extractionResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* IVA Declarations Upload */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="bg-gradient-to-r from-brand-navy to-brand-indigo px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Declaraciones de IVA</h2>
                    <p className="text-white/80 text-sm">Formularios 300 - Declaración bimestral</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Drop Zone */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onDrop={(e) => handleDrop(e, 'iva')}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDragOverIva(true)}
                  onDragLeave={() => setDragOverIva(false)}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
                    dragOverIva
                      ? "border-brand-indigo bg-brand-indigo/5"
                      : "border-brand-border hover:border-brand-indigo"
                  )}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleIvaFilesChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                      dragOverIva ? "bg-brand-indigo" : "bg-brand-indigo/10"
                    )}>
                      <Upload className={cn(
                        "h-7 w-7",
                        dragOverIva ? "text-white" : "text-brand-indigo"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-brand-text">
                        Arrastra tus declaraciones aquí
                      </p>
                      <p className="text-sm text-brand-text-secondary mt-1">
                        o haz clic para seleccionar archivos PDF
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Uploaded Files List */}
                <AnimatePresence>
                  {ivaFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-brand-text">
                          {ivaFiles.length} archivo{ivaFiles.length > 1 ? 's' : ''} seleccionado{ivaFiles.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ivaFiles.map((file) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 p-3 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20"
                          >
                            <FileText className="h-5 w-5 text-brand-indigo flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-brand-text truncate">{file.name}</p>
                              <p className="text-xs text-brand-text-secondary">{file.size}</p>
                            </div>
                            <button
                              onClick={() => removeIvaFile(file.id)}
                              className="p-1.5 rounded-lg hover:bg-error-bg text-brand-text-secondary hover:text-error transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Related Documents Upload */}
            <motion.div
              variants={itemVariants}
              className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Documentos Relacionados</h2>
                    <p className="text-white/80 text-sm">Facturas, libros auxiliares, soportes</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Drop Zone */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onDrop={(e) => handleDrop(e, 'related')}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDragOverRelated(true)}
                  onDragLeave={() => setDragOverRelated(false)}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
                    dragOverRelated
                      ? "border-brand-indigo bg-brand-indigo/5"
                      : "border-brand-border hover:border-brand-indigo"
                  )}
                >
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv"
                    multiple
                    onChange={handleRelatedFilesChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                      dragOverRelated ? "bg-brand-indigo" : "bg-brand-indigo/10"
                    )}>
                      <Plus className={cn(
                        "h-7 w-7",
                        dragOverRelated ? "text-white" : "text-brand-indigo"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-brand-text">
                        Documentos de soporte (opcional)
                      </p>
                      <p className="text-sm text-brand-text-secondary mt-1">
                        PDF, Excel o CSV con información adicional
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Uploaded Files List */}
                <AnimatePresence>
                  {relatedFiles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-brand-text">
                          {relatedFiles.length} archivo{relatedFiles.length > 1 ? 's' : ''} de soporte
                        </span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {relatedFiles.map((file) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 p-3 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20"
                          >
                            <FileSpreadsheet className="h-5 w-5 text-brand-indigo flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-brand-text truncate">{file.name}</p>
                              <p className="text-xs text-brand-text-secondary">{file.size}</p>
                            </div>
                            <button
                              onClick={() => removeRelatedFile(file.id)}
                              className="p-1.5 rounded-lg hover:bg-error-bg text-brand-text-secondary hover:text-error transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
          {!extractionResult ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={isAnalyzing || ivaFiles.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-navy to-brand-indigo hover:from-brand-navy/90 hover:to-brand-indigo-hover text-white rounded-xl font-medium shadow-lg shadow-brand-navy/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Extrayendo datos...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Extraer Declaraciones
                  </>
                )}
              </motion.button>

              {(ivaFiles.length > 0 || relatedFiles.length > 0) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearAll}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-brand-border text-brand-text rounded-xl font-medium hover:bg-brand-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                  Limpiar Todo
                </motion.button>
              )}
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-navy to-brand-indigo hover:from-brand-navy/90 hover:to-brand-indigo-hover text-white rounded-xl font-medium shadow-lg shadow-brand-navy/25 transition-all"
            >
              <Plus className="h-5 w-5" />
              Nueva Extracción
            </motion.button>
          )}
        </motion.div>

        {/* Extraction Results */}
        <AnimatePresence>
          {extractionResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Summary Header */}
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-success/20 backdrop-blur-sm flex items-center justify-center border border-success/30">
                      <CheckCircle2 className="h-7 w-7 text-success" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Extracción Completada
                      </h2>
                      <p className="text-slate-300">
                        {extractionResult.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-success/20 rounded-xl border border-success/30">
                      <p className="text-2xl font-bold text-success">{extractionResult.successful}</p>
                      <p className="text-xs text-success">Exitosos</p>
                    </div>
                    {extractionResult.failed > 0 && (
                      <div className="text-center px-4 py-2 bg-error/20 rounded-xl border border-error/30">
                        <p className="text-2xl font-bold text-error">{extractionResult.failed}</p>
                        <p className="text-xs text-error">Fallidos</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Results Cards */}
              <div className="space-y-4">
                {extractionResult.results.map((result, index) => (
                  <IvaResultCard
                    key={result.filename}
                    result={result}
                    index={index}
                    isExpanded={expandedCards.has(result.filename)}
                    onToggle={() => toggleCardExpanded(result.filename)}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>

              {/* Validation Section - Show after extraction, before validation results */}
              {!validationResult && FEATURES.IVA_VALIDATION_ENABLED && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white border-2 border-success-bg rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <ClipboardCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-brand-text mb-1">
                        Checklist de Validación IVA
                      </h3>
                      <p className="text-brand-text-secondary text-sm mb-4">
                        Ejecuta 11 validaciones automáticas sobre las declaraciones extraídas para verificar consistencia y cumplimiento.
                      </p>

                      {/* Renta data indicator */}
                      <div className="mb-4 p-3 bg-brand-bg rounded-lg">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useStoredRenta}
                            onChange={(e) => setUseStoredRenta(e.target.checked)}
                            disabled={!rentaData}
                            className="mt-1 h-4 w-4 rounded border-brand-border text-brand-indigo focus:ring-brand-indigo"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-brand-text">
                              Incluir datos de Declaración de Renta
                            </span>
                            {rentaData ? (
                              <div className="flex items-center gap-2 mt-1">
                                <CheckCircle2 className="h-4 w-4 text-success" />
                                <span className="text-sm text-success">
                                  {rentaData.declaracion.razon_social} - Año {rentaData.declaracion.ano_gravable}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <Info className="h-4 w-4 text-warning" />
                                <span className="text-sm text-warning">
                                  No hay datos de renta disponibles. Algunas validaciones se omitirán.
                                </span>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Validation progress */}
                      {isValidating && validationProgress && (
                        <div className="mb-4">
                          <ProgressBar
                            percentage={validationProgress.percentage}
                            message={validationProgress.message}
                          />
                          <p className="text-sm text-brand-text-secondary mt-2">
                            Validación {validationProgress.current_validation} de {validationProgress.total_validations}
                          </p>
                        </div>
                      )}

                      {/* Validate button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleValidate}
                        disabled={isValidating}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Validando...
                          </>
                        ) : (
                          <>
                            <FileCheck className="h-5 w-5" />
                            Ejecutar Checklist de Validación
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Validation Results */}
              {validationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Back to extraction button */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={clearValidation}
                      className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver a resultados de extracción
                    </button>
                  </div>

                  {/* Checklist component */}
                  <IvaValidationChecklist result={validationResult} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Section - Only show when no results */}
        {!extractionResult && (
          <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-r from-brand-indigo/5 to-brand-indigo/5 border border-brand-indigo/20 rounded-xl p-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-indigo/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-brand-indigo" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-navy mb-2">
                    ¿Qué documentos puedo subir?
                  </h3>
                  <ul className="text-brand-text text-sm leading-relaxed space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-indigo" />
                      <span><strong>Declaraciones de IVA:</strong> Formularios 300 en formato PDF</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-indigo" />
                      <span><strong>Libros auxiliares:</strong> Registros de ventas y compras</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-indigo" />
                      <span><strong>Facturas electrónicas:</strong> Para cruce de información</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-indigo" />
                      <span><strong>Información exógena:</strong> Archivos de terceros relacionados</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </motion.div>
    </div>
  )
}

// Component for individual IVA result card
interface IvaResultCardProps {
  result: IvaExtractionResult
  index: number
  isExpanded: boolean
  onToggle: () => void
  formatCurrency: (value: number | null | undefined) => string
}

function IvaResultCard({ result, index, isExpanded, onToggle, formatCurrency }: IvaResultCardProps) {
  if (!result.success || !result.data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-error-bg border border-error-bg rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-error-bg flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-error" />
          </div>
          <div>
            <p className="font-medium text-error-foreground">{result.filename}</p>
            <p className="text-sm text-error">
              {result.errors?.join(', ') || 'Error en la extracción'}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const data = result.data
  const declarante = data.datos_declarante
  const periodName = getPeriodName(declarante.periodo, declarante.periodicidad)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Card Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-brand-bg transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-brand-indigo flex items-center justify-center shadow-lg shadow-brand-navy/25">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-brand-text">
              {declarante.razon_social || 'Sin razón social'}
            </h3>
            <div className="flex items-center gap-3 text-sm text-brand-text-secondary">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                NIT: {declarante.nit}-{declarante.dv}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Periodo {declarante.periodo}: {periodName} {declarante.ano}
              </span>
              <span className="px-2 py-0.5 bg-brand-indigo/10 text-brand-indigo rounded-full text-xs">
                {declarante.periodicidad}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-brand-text-secondary">Total IVA Generado</p>
              <p className="font-semibold text-success">{formatCurrency(data.impuesto_generado.total_impuesto_generado)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-text-secondary">Saldo</p>
              <p className={cn(
                "font-semibold",
                data.liquidacion_privada.total_saldo_pagar > 0 ? "text-error" : "text-brand-indigo"
              )}>
                {data.liquidacion_privada.total_saldo_pagar > 0
                  ? `A pagar: ${formatCurrency(data.liquidacion_privada.total_saldo_pagar)}`
                  : `A favor: ${formatCurrency(data.liquidacion_privada.total_saldo_favor)}`
                }
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-brand-text-secondary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-brand-text-secondary" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6 border-t border-brand-border pt-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  icon={<TrendingUp className="h-5 w-5 text-success" />}
                  label="Total Ingresos"
                  value={formatCurrency(data.ingresos.total_ingresos_netos_periodo)}
                  bgColor="bg-success-bg"
                  borderColor="border-success-bg"
                />
                <SummaryCard
                  icon={<TrendingDown className="h-5 w-5 text-error" />}
                  label="Total Compras"
                  value={formatCurrency(data.compras_nacionales.total_compras_netas_periodo)}
                  bgColor="bg-error-bg"
                  borderColor="border-error-bg"
                />
                <SummaryCard
                  icon={<DollarSign className="h-5 w-5 text-brand-indigo" />}
                  label="IVA Generado"
                  value={formatCurrency(data.impuesto_generado.total_impuesto_generado)}
                  bgColor="bg-brand-indigo/5"
                  borderColor="border-brand-indigo/20"
                />
                <SummaryCard
                  icon={<DollarSign className="h-5 w-5 text-brand-indigo" />}
                  label="IVA Descontable"
                  value={formatCurrency(data.impuesto_descontable.total_impuestos_descontables)}
                  bgColor="bg-brand-indigo/5"
                  borderColor="border-brand-indigo/20"
                />
              </div>

              {/* Detailed Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ingresos */}
                <DetailSection title="Ingresos" icon={<TrendingUp className="h-4 w-4" />}>
                  <DetailRow label="Gravados tarifa general (19%)" value={formatCurrency(data.ingresos.ingresos_gravados_tarifa_general)} />
                  <DetailRow label="Gravados tarifa 5%" value={formatCurrency(data.ingresos.ingresos_gravados_5_porciento)} />
                  <DetailRow label="Operaciones no gravadas" value={formatCurrency(data.ingresos.operaciones_no_gravadas)} />
                  <DetailRow label="Operaciones excluidas" value={formatCurrency(data.ingresos.operaciones_excluidas)} />
                  <DetailRow label="Exportaciones" value={formatCurrency(data.ingresos.exportaciones_bienes + data.ingresos.exportaciones_servicios)} />
                  <DetailRow label="Total ingresos brutos" value={formatCurrency(data.ingresos.total_ingresos_brutos)} highlight />
                </DetailSection>

                {/* Compras */}
                <DetailSection title="Compras Nacionales" icon={<TrendingDown className="h-4 w-4" />}>
                  <DetailRow label="Servicios tarifa general (19%)" value={formatCurrency(data.compras_nacionales.compras_servicios_tarifa_general)} />
                  <DetailRow label="Servicios tarifa 5%" value={formatCurrency(data.compras_nacionales.compras_servicios_5_porciento)} />
                  <DetailRow label="Bienes tarifa general (19%)" value={formatCurrency(data.compras_nacionales.compras_bienes_tarifa_general)} />
                  <DetailRow label="Bienes excluidos/exentos" value={formatCurrency(data.compras_nacionales.compras_bienes_excluidos_exentos)} />
                  <DetailRow label="Total compras netas" value={formatCurrency(data.compras_nacionales.total_compras_netas_periodo)} highlight />
                </DetailSection>

                {/* IVA Generado */}
                <DetailSection title="Impuesto Generado" icon={<DollarSign className="h-4 w-4" />}>
                  <DetailRow label="IVA tarifa general (19%)" value={formatCurrency(data.impuesto_generado.impuesto_generado_tarifa_general)} />
                  <DetailRow label="IVA tarifa 5%" value={formatCurrency(data.impuesto_generado.impuesto_generado_5_porciento)} />
                  <DetailRow label="IVA AIU operaciones" value={formatCurrency(data.impuesto_generado.impuesto_aiu_operaciones)} />
                  <DetailRow label="Total IVA generado" value={formatCurrency(data.impuesto_generado.total_impuesto_generado)} highlight />
                </DetailSection>

                {/* IVA Descontable */}
                <DetailSection title="Impuesto Descontable" icon={<DollarSign className="h-4 w-4" />}>
                  <DetailRow label="IVA servicios tarifa general" value={formatCurrency(data.impuesto_descontable.iva_servicios_tarifa_general)} />
                  <DetailRow label="IVA servicios tarifa 5%" value={formatCurrency(data.impuesto_descontable.iva_servicios_5_porciento)} />
                  <DetailRow label="IVA compras bienes tarifa general" value={formatCurrency(data.impuesto_descontable.iva_compras_bienes_tarifa_general)} />
                  <DetailRow label="Total IVA descontable" value={formatCurrency(data.impuesto_descontable.total_impuestos_descontables)} highlight />
                </DetailSection>
              </div>

              {/* Liquidación */}
              <div className="bg-gradient-to-r from-brand-bg to-brand-bg-alt rounded-xl p-5 border border-brand-border">
                <h4 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-slate-600" />
                  Liquidación Privada
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-brand-text-secondary">Saldo a pagar periodo</p>
                    <p className="font-semibold text-brand-text">{formatCurrency(data.liquidacion_privada.saldo_pagar_periodo_fiscal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-text-secondary">Saldo a favor anterior</p>
                    <p className="font-semibold text-brand-text">{formatCurrency(data.liquidacion_privada.saldo_favor_periodo_anterior)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-text-secondary">Retenciones IVA</p>
                    <p className="font-semibold text-brand-text">{formatCurrency(data.liquidacion_privada.retenciones_iva_practicaron)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-text-secondary">Sanciones</p>
                    <p className="font-semibold text-brand-text">{formatCurrency(data.liquidacion_privada.sanciones)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-2 gap-4">
                  <div className={cn(
                    "p-4 rounded-xl",
                    data.liquidacion_privada.total_saldo_pagar > 0
                      ? "bg-error-bg border border-error-bg"
                      : "bg-brand-bg-alt"
                  )}>
                    <p className="text-sm text-brand-text-secondary">Total Saldo a Pagar</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      data.liquidacion_privada.total_saldo_pagar > 0 ? "text-error" : "text-brand-text-secondary"
                    )}>
                      {formatCurrency(data.liquidacion_privada.total_saldo_pagar)}
                    </p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-xl",
                    data.liquidacion_privada.total_saldo_favor > 0
                      ? "bg-brand-indigo/10 border border-brand-indigo/20"
                      : "bg-brand-bg-alt"
                  )}>
                    <p className="text-sm text-brand-text-secondary">Total Saldo a Favor</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      data.liquidacion_privada.total_saldo_favor > 0 ? "text-brand-indigo" : "text-brand-text-secondary"
                    )}>
                      {formatCurrency(data.liquidacion_privada.total_saldo_favor)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-brand-text-secondary flex items-center gap-4 pt-2">
                <span>Formulario: {declarante.numero_formulario}</span>
                <span>•</span>
                <span>Campos extraídos: {data.metadatos.campos_extraidos}</span>
                <span>•</span>
                <span>Fecha extracción: {new Date(data.metadatos.fecha_extraccion).toLocaleString('es-CO')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Helper Components
function SummaryCard({ icon, label, value, bgColor, borderColor }: {
  icon: React.ReactNode
  label: string
  value: string
  bgColor: string
  borderColor: string
}) {
  return (
    <div className={cn("p-4 rounded-xl border", bgColor, borderColor)}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-brand-text-secondary">{label}</span>
      </div>
      <p className="text-lg font-bold text-brand-text">{value}</p>
    </div>
  )
}

function DetailSection({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-brand-bg rounded-xl p-4">
      <h4 className="font-semibold text-brand-text mb-3 flex items-center gap-2 text-sm">
        {icon}
        {title}
      </h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function DetailRow({ label, value, highlight = false }: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={cn(
      "flex justify-between items-center text-sm",
      highlight && "pt-2 mt-2 border-t border-brand-border"
    )}>
      <span className={cn(
        highlight ? "font-semibold text-brand-text" : "text-brand-text-secondary"
      )}>
        {label}
      </span>
      <span className={cn(
        "font-mono",
        highlight ? "font-bold text-brand-text" : "text-brand-text"
      )}>
        {value}
      </span>
    </div>
  )
}
