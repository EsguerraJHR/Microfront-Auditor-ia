"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, FileText, Loader2, BarChart3, AlertCircle, CheckCircle2, Sparkles, ArrowLeft, ArrowRight, Building, Calendar, Hash, User } from "lucide-react"
import { comparativeAnalysisService, ComparativeAnalysisResponse, UploadProgress, SSEProgressEvent, RevisionCreateData } from "@/lib/api/comparative-analysis-service"
import { ProgressBar } from "./progress-bar"
import { FEATURES } from "@/config/features"

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
} as const

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
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
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
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
  // Step control: 1 = client data, 2 = file upload
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1: Client data
  const [clientData, setClientData] = useState<RevisionCreateData>({
    nombre_cliente: '',
    nit: '',
    mes: '',
    fecha_revision: new Date().toISOString().split('T')[0]
  })
  const [isCreatingRevision, setIsCreatingRevision] = useState(false)
  const [revisionId, setRevisionId] = useState<string | null>(null)

  // Step 2: File upload
  const [currentYearFile, setCurrentYearFile] = useState<File | null>(null)
  const [previousYearFile, setPreviousYearFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [sseProgress, setSSEProgress] = useState<SSEProgressEvent | null>(null)

  // Shared
  const [error, setError] = useState<string | null>(null)
  const [dragOverCurrent, setDragOverCurrent] = useState(false)
  const [dragOverPrevious, setDragOverPrevious] = useState(false)

  const isProcessing = isCreatingRevision || isAnalyzing

  const handleClientDataChange = (field: keyof RevisionCreateData, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleCreateRevision = async () => {
    if (!clientData.nombre_cliente.trim()) {
      setError('Por favor ingresa el nombre del cliente.')
      return
    }
    if (!clientData.nit.trim()) {
      setError('Por favor ingresa el NIT del cliente.')
      return
    }
    if (!clientData.mes.trim()) {
      setError('Por favor selecciona el mes.')
      return
    }
    if (!clientData.fecha_revision.trim()) {
      setError('Por favor selecciona la fecha de revisión.')
      return
    }

    setIsCreatingRevision(true)
    setError(null)

    try {
      const revision = await comparativeAnalysisService.createRevision(clientData)
      setRevisionId(String(revision.id))
      setStep(2)
    } catch (error) {
      console.error('Error creating revision:', error)
      setError(error instanceof Error ? error.message : 'Error al crear la revisión')
    } finally {
      setIsCreatingRevision(false)
    }
  }

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

    if (!revisionId) {
      setError('No se ha creado la revisión. Vuelve al paso anterior.')
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
        revisionId,
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
    if (!isProcessing) {
      setStep(1)
      setClientData({
        nombre_cliente: '',
        nit: '',
        mes: '',
        fecha_revision: new Date().toISOString().split('T')[0]
      })
      setRevisionId(null)
      setCurrentYearFile(null)
      setPreviousYearFile(null)
      setError(null)
      setUploadProgress(null)
      setSSEProgress(null)
      onClose()
    }
  }

  const handleBackToStep1 = () => {
    if (!isAnalyzing) {
      setStep(1)
      setCurrentYearFile(null)
      setPreviousYearFile(null)
      setError(null)
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

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !isProcessing && handleClose()}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
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
                  <h2 className="text-xl font-bold text-brand-text">Análisis Comparativo</h2>
                  <p className="text-sm text-brand-text-secondary">
                    Paso {step} de 2 — {step === 1 ? 'Datos del cliente' : 'Subir declaraciones'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isProcessing}
                className="w-8 h-8 flex items-center justify-center rounded-full text-brand-text-secondary hover:text-brand-text hover:bg-brand-bg disabled:opacity-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 pt-4">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= 1 ? 'bg-brand-indigo text-white' : 'bg-brand-bg-alt text-brand-text-secondary'
                }`}>
                  {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                </div>
                <div className={`flex-1 h-1 rounded-full ${
                  step >= 2 ? 'bg-brand-indigo' : 'bg-brand-bg-alt'
                }`} />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= 2 ? 'bg-brand-indigo text-white' : 'bg-brand-bg-alt text-brand-text-secondary'
                }`}>
                  2
                </div>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex-1 p-6 space-y-6"
                >
                  {/* Instructions */}
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-brand-bg border border-brand-indigo/20 rounded-xl p-4"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-indigo/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-brand-indigo" />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-brand-indigo mb-1">
                          Datos de la revisión
                        </p>
                        <p className="text-brand-indigo leading-relaxed">
                          Ingresa los datos del cliente para crear la revisión. Estos datos se asociarán al análisis comparativo.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Client Data Form */}
                  <div className="space-y-4">
                    {/* Nombre del cliente */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-brand-text">
                        <User className="h-4 w-4 text-brand-text-secondary" />
                        Nombre del Cliente *
                      </label>
                      <input
                        type="text"
                        value={clientData.nombre_cliente}
                        onChange={(e) => handleClientDataChange('nombre_cliente', e.target.value)}
                        disabled={isCreatingRevision}
                        placeholder="Ej: Empresa ABC S.A.S"
                        className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 transition-all"
                      />
                    </div>

                    {/* NIT */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-brand-text">
                        <Hash className="h-4 w-4 text-brand-text-secondary" />
                        NIT *
                      </label>
                      <input
                        type="text"
                        value={clientData.nit}
                        onChange={(e) => handleClientDataChange('nit', e.target.value)}
                        disabled={isCreatingRevision}
                        placeholder="Ej: 900123456"
                        className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white text-brand-text placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 transition-all"
                      />
                    </div>

                    {/* Mes and Fecha in a row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mes */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-brand-text">
                          <Calendar className="h-4 w-4 text-brand-text-secondary" />
                          Mes *
                        </label>
                        <select
                          value={clientData.mes}
                          onChange={(e) => handleClientDataChange('mes', e.target.value)}
                          disabled={isCreatingRevision}
                          className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 transition-all"
                        >
                          <option value="">Seleccionar mes</option>
                          {meses.map((mes) => (
                            <option key={mes} value={mes}>{mes}</option>
                          ))}
                        </select>
                      </div>

                      {/* Fecha de revisión */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-brand-text">
                          <Calendar className="h-4 w-4 text-brand-text-secondary" />
                          Fecha de Revisión *
                        </label>
                        <input
                          type="date"
                          value={clientData.fecha_revision}
                          onChange={(e) => handleClientDataChange('fecha_revision', e.target.value)}
                          disabled={isCreatingRevision}
                          className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
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
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex-1 p-6 space-y-6"
                >
                  {/* Instructions */}
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-brand-bg border border-brand-indigo/20 rounded-xl p-4"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-indigo/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-brand-indigo" />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-brand-indigo mb-1">
                          Subir declaraciones
                        </p>
                        <p className="text-brand-indigo leading-relaxed">
                          Sube las declaraciones de renta de dos años consecutivos del mismo contribuyente.
                          El sistema analizará las variaciones en patrimonio, ingresos, gastos, renta líquida e impuestos.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Client info summary */}
                  <div className="bg-brand-bg rounded-xl p-4 border border-brand-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-brand-indigo" />
                      <span className="text-sm font-medium text-brand-text">Cliente: {clientData.nombre_cliente}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-brand-text-secondary">
                      <span>NIT: {clientData.nit}</span>
                      <span>Mes: {clientData.mes}</span>
                      <span>Fecha: {clientData.fecha_revision}</span>
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Year File */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-brand-text">
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
                            ? 'border-success bg-success-bg scale-[1.02]'
                            : currentYearFile
                              ? 'border-success bg-success-bg'
                              : 'border-brand-border hover:border-success'
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
                              currentYearFile ? 'bg-success' : 'bg-success-bg'
                            }`}
                          >
                            {currentYearFile ? (
                              <CheckCircle2 className="h-7 w-7 text-white" />
                            ) : (
                              <Upload className="h-7 w-7 text-success" />
                            )}
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium text-success-foreground">
                              {currentYearFile ? 'Archivo seleccionado' : 'Arrastra o selecciona'}
                            </p>
                            <p className="text-xs text-brand-text-secondary mt-1">
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
                              className="mt-3 p-3 bg-success-bg rounded-lg"
                            >
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-success" />
                                <span className="font-medium text-success-foreground truncate">
                                  {currentYearFile.name}
                                </span>
                              </div>
                              <p className="text-xs text-success mt-1">
                                {(currentYearFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>

                    {/* Previous Year File */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-brand-text">
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
                            ? 'border-brand-indigo bg-brand-indigo/5 scale-[1.02]'
                            : previousYearFile
                              ? 'border-brand-indigo bg-brand-indigo/5'
                              : 'border-brand-border hover:border-brand-indigo'
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
                              previousYearFile ? 'bg-brand-indigo' : 'bg-brand-indigo/10'
                            }`}
                          >
                            {previousYearFile ? (
                              <CheckCircle2 className="h-7 w-7 text-white" />
                            ) : (
                              <Upload className="h-7 w-7 text-brand-indigo" />
                            )}
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium text-brand-indigo">
                              {previousYearFile ? 'Archivo seleccionado' : 'Arrastra o selecciona'}
                            </p>
                            <p className="text-xs text-brand-text-secondary mt-1">
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
                              className="mt-3 p-3 bg-brand-indigo/10 rounded-lg"
                            >
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-brand-indigo" />
                                <span className="font-medium text-brand-indigo truncate">
                                  {previousYearFile.name}
                                </span>
                              </div>
                              <p className="text-xs text-brand-indigo mt-1">
                                {(previousYearFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>

                  {/* Error Display */}
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

                  {/* Progress Section */}
                  <AnimatePresence>
                    {isAnalyzing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-warning-bg rounded-xl p-6 border border-warning-bg"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-10 h-10 rounded-full bg-brand-indigo flex items-center justify-center"
                          >
                            <Loader2 className="h-5 w-5 text-white" />
                          </motion.div>
                          <div>
                            <p className="font-medium text-warning-foreground">
                              Analizando declaraciones...
                            </p>
                            <p className="text-sm text-warning">
                              Esto puede tomar unos momentos
                            </p>
                          </div>
                        </div>

                        {FEATURES.USE_SSE_PROGRESS && sseProgress && (
                          <ProgressBar
                            percentage={sseProgress.percentage}
                            message={sseProgress.message}
                          />
                        )}

                        {!FEATURES.USE_SSE_PROGRESS && uploadProgress && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-brand-text-secondary">
                              <span>Procesando análisis comparativo...</span>
                              <span>{uploadProgress.percentage}%</span>
                            </div>
                            <div className="w-full bg-warning-bg rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress.percentage}%` }}
                                className="bg-brand-indigo h-2 rounded-full"
                              />
                            </div>
                          </div>
                        )}

                        {!sseProgress && !uploadProgress && (
                          <div className="flex items-center gap-3 text-sm text-warning-foreground">
                            <div className="flex space-x-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{ y: [0, -8, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                  className="w-2 h-2 bg-brand-indigo rounded-full"
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
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-between gap-3 p-6 border-t border-brand-border bg-brand-bg">
              <div>
                {step === 2 && !isAnalyzing && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBackToStep1}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-brand-text hover:bg-brand-bg font-medium transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Atrás
                  </motion.button>
                )}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-lg text-brand-text hover:bg-brand-bg disabled:opacity-50 font-medium transition-colors"
                >
                  Cancelar
                </motion.button>

                {step === 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateRevision}
                    disabled={isCreatingRevision}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
                  >
                    {isCreatingRevision ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creando revisión...
                      </>
                    ) : (
                      <>
                        Siguiente
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                ) : (
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
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
