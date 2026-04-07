"use client"

import React, { useState } from "react"
import { Upload, FileText, Loader2, X, Building, CheckCircle, AlertTriangle, Calendar, Clock, Users, DollarSign, ArrowLeft } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import { declarationService, DetailedDeclarationResponse, UploadProgress, PagoDetalle, SSEProgressEvent } from "@/lib/api/declaration-service"
import { taxCalendarService, GranContribuyenteResponse, PersonaJuridicaResponse } from "@/lib/api/tax-calendar-service"
import { declarationStorageService } from "@/lib/services/declaration-storage-service"
import { TaxCalendarModal } from "@/components/ui/tax-calendar-modal"
import { ProgressBar } from "@/components/ui/progress-bar"
import { FEATURES } from "@/config/features"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import Link from "next/link"

export default function AnalisisDeclaracionesRentaPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [paymentFiles, setPaymentFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [sseProgress, setSSEProgress] = useState<SSEProgressEvent | null>(null)
  const [extractionResult, setExtractionResult] = useState<DetailedDeclarationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [taxCalendar, setTaxCalendar] = useState<GranContribuyenteResponse | PersonaJuridicaResponse | null>(null)
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendarModalData, setCalendarModalData] = useState<GranContribuyenteResponse | PersonaJuridicaResponse | null>(null)
  const [calendarModalType, setCalendarModalType] = useState<'grandes-contribuyentes' | 'personas-juridicas'>('grandes-contribuyentes')
  const [isLoadingCalendarModal, setIsLoadingCalendarModal] = useState(false)

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0])
      setError(null)
    }
  }

  const handlePaymentFilesChange = (files: File[]) => {
    setPaymentFiles(files)
    setError(null)
  }

  const handleExtractDeclaration = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona un archivo de declaración para procesar.')
      return
    }

    setIsUploading(true)
    setUploadProgress(null)
    setSSEProgress(null)
    setError(null)

    try {
      const response = await declarationService.extractDetailedDeclaration(
        selectedFile,
        paymentFiles.length > 0 ? paymentFiles : undefined,
        (progress) => setUploadProgress(progress),
        FEATURES.USE_SSE_PROGRESS ? (progress) => setSSEProgress(progress) : undefined
      )

      setExtractionResult(response)
      setShowUploadModal(false)
      setSelectedFile(null)
      setPaymentFiles([])

      // Persist renta data for use in IVA validation
      declarationStorageService.saveRentaDeclaration(response)

      // Load tax calendar after successful extraction
      await loadTaxCalendar(response.declaracion, response.es_gran_contribuyente)
    } catch (error) {
      console.error('Error extracting declaration:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido durante la extracción')
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
      setSSEProgress(null)
    }
  }

  const handleCloseUploadModal = () => {
    if (!isUploading) {
      setShowUploadModal(false)
      setSelectedFile(null)
      setPaymentFiles([])
      setError(null)
      setUploadProgress(null)
    }
  }

  const loadTaxCalendar = async (declarationData: any, esGranContribuyente?: boolean) => {
    if (!declarationData.nit || !declarationData.ano_gravable) return

    setIsLoadingCalendar(true)
    try {
      const ultimoDigitoNit = parseInt(declarationData.nit.slice(-1))
      const anoGravable = declarationData.ano_gravable
      const isGranContribuyente = esGranContribuyente ?? declarationData.es_gran_contribuyente

      let calendarResponse
      if (isGranContribuyente) {
        calendarResponse = await taxCalendarService.getGrandesContribuyentesCalendar(anoGravable, ultimoDigitoNit)
      } else {
        calendarResponse = await taxCalendarService.getPersonasJuridicasCalendar(anoGravable, ultimoDigitoNit)
      }

      setTaxCalendar(calendarResponse)
    } catch (error) {
      console.error('Error loading tax calendar:', error)
    } finally {
      setIsLoadingCalendar(false)
    }
  }

  // formatCurrency and formatDate imported from @/lib/utils/format

  const handleViewCompleteGrandesContribuyentes = async () => {
    setCalendarModalType('grandes-contribuyentes')
    setShowCalendarModal(true)
    setIsLoadingCalendarModal(true)
    setCalendarModalData(null)

    try {
      const response = await taxCalendarService.getCompleteGrandesContribuyentesCalendar()
      setCalendarModalData(response)
    } catch (error) {
      console.error('Error loading complete grandes contribuyentes calendar:', error)
    } finally {
      setIsLoadingCalendarModal(false)
    }
  }

  const handleViewCompletePersonasJuridicas = async () => {
    setCalendarModalType('personas-juridicas')
    setShowCalendarModal(true)
    setIsLoadingCalendarModal(true)
    setCalendarModalData(null)

    try {
      const response = await taxCalendarService.getCompletePersonasJuridicasCalendar()
      setCalendarModalData(response)
    } catch (error) {
      console.error('Error loading complete personas juridicas calendar:', error)
    } finally {
      setIsLoadingCalendarModal(false)
    }
  }

  const declaracion = extractionResult?.declaracion

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="space-y-4">
        <Link
          href="/analisis-eficacia"
          className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Análisis de Eficacia
        </Link>

        <div className="space-y-2">
          <h1 className="accountingTitle">
            Análisis Declaración de Renta
          </h1>
          <p className="accountingParagraph">
            Extracción y análisis de declaraciones de renta. Incluye validación de pagos y calendario tributario.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-start">
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Extraer Declaración de Renta
        </button>

        <button
          onClick={handleViewCompleteGrandesContribuyentes}
          className="flex items-center gap-2 px-4 py-2 bg-brand-indigo hover:bg-brand-indigo-hover text-white rounded-lg transition-colors font-medium"
        >
          <Building className="h-4 w-4" />
          Calendario Grandes Contribuyentes
        </button>

        <button
          onClick={handleViewCompletePersonasJuridicas}
          className="flex items-center gap-2 px-4 py-2 bg-brand-indigo hover:bg-brand-indigo-hover text-white rounded-lg transition-colors font-medium"
        >
          <Users className="h-4 w-4" />
          Calendario Personas Jurídicas
        </button>
      </div>

      {/* Tax Calendar Section */}
      {extractionResult && taxCalendar && (
        <div className="bg-white rounded-xl shadow-lg border border-brand-border overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-warning-bg to-warning-bg px-6 py-4 border-b border-brand-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-bg rounded-full">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-warning">
                  Calendario Tributario {declaracion?.ano_gravable ? declaracion.ano_gravable + 1 : ''}
                </h3>
                <p className="text-sm text-warning">
                  {extractionResult.es_gran_contribuyente ? 'Grandes Contribuyentes' : 'Personas Jurídicas'}
                  {' '}| Último dígito NIT: {declaracion?.nit.slice(-1)}
                </p>
              </div>
              {isLoadingCalendar && (
                <div className="ml-auto">
                  <Loader2 className="h-5 w-5 animate-spin text-warning" />
                </div>
              )}
            </div>
          </div>

          {/* Calendar Content */}
          <div className="p-6">
            {taxCalendar.calendarios.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-border">
                      <th className="text-left py-3 px-4 font-semibold text-brand-text">
                        Obligación
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-brand-text">
                        Fecha Límite
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractionResult.es_gran_contribuyente ? (
                      // Gran Contribuyente Calendar
                      <>
                        {(taxCalendar as GranContribuyenteResponse).calendarios.map((calendar, index) => (
                          <React.Fragment key={index}>
                            <tr className="border-b border-brand-border">
                              <td className="py-3 px-4 font-medium">Pago Primera Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-brand-text-secondary" />
                                  {formatDate(calendar.fecha_pago_primera_cuota)}
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b border-brand-border">
                              <td className="py-3 px-4 font-medium">Declaración Segunda Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-brand-text-secondary" />
                                  {formatDate(calendar.fecha_declaracion_segunda_cuota)}
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b border-brand-border">
                              <td className="py-3 px-4 font-medium">Pago Tercera Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-brand-text-secondary" />
                                  {formatDate(calendar.fecha_pago_tercera_cuota)}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </>
                    ) : (
                      // Persona Jurídica Calendar
                      <>
                        {(taxCalendar as PersonaJuridicaResponse).calendarios.map((calendar, index) => (
                          <React.Fragment key={index}>
                            <tr className="border-b border-brand-border">
                              <td className="py-3 px-4 font-medium">Declaración Primera Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-brand-text-secondary" />
                                  {formatDate(calendar.fecha_declaracion_primera_cuota)}
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b border-brand-border">
                              <td className="py-3 px-4 font-medium">Pago Segunda Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-brand-text-secondary" />
                                  {formatDate(calendar.fecha_pago_segunda_cuota)}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-brand-text-secondary">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-brand-text-secondary" />
                <p>No se encontraron fechas del calendario tributario para este contribuyente.</p>
              </div>
            )}

            {/* Calendar Info */}
            <div className="mt-4 pt-4 border-t border-brand-border">
              <div className="text-sm text-brand-text-secondary">
                <span>Total de registros: {taxCalendar.total_registros}</span>
                <span className="mx-2">•</span>
                <span>Último dígito NIT: {taxCalendar.filtros_aplicados.ultimo_digito_nit}</span>
                <span className="mx-2">•</span>
                <span>Año gravable: {taxCalendar.filtros_aplicados.ano_gravable || declaracion?.ano_gravable || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Analysis Section */}
      {extractionResult?.tiene_pagos && extractionResult?.analisis_pagos && (
        <div className="bg-white rounded-xl shadow-lg border border-brand-border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-indigo/5 to-success-bg px-6 py-4 border-b border-brand-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-indigo/10 rounded-full">
                <DollarSign className="h-6 w-6 text-brand-indigo" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-brand-indigo">
                  Análisis de Pagos
                </h3>
                <p className="text-sm text-brand-indigo">
                  Comparación entre lo declarado y lo pagado
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-brand-indigo/5 to-brand-indigo/10 p-4 rounded-lg border border-brand-indigo/20">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-brand-indigo" />
                  <span className="text-sm font-medium text-brand-indigo">Saldo a Pagar</span>
                </div>
                <p className="text-2xl font-bold text-brand-text">
                  {formatCurrency(extractionResult.declaracion.saldo_pagar_impuesto)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-success-bg to-success-bg p-4 rounded-lg border border-success-bg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success-foreground">Total Pagado</span>
                </div>
                <p className="text-2xl font-bold text-success-foreground">
                  {formatCurrency(extractionResult.analisis_pagos.total_pagado)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-warning-bg to-warning-bg p-4 rounded-lg border border-warning-bg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="text-sm font-medium text-warning-foreground">Pendiente</span>
                </div>
                <p className="text-2xl font-bold text-warning-foreground">
                  {formatCurrency(extractionResult.analisis_pagos.saldo_pendiente)}
                </p>
              </div>

              <div className={`bg-gradient-to-br p-4 rounded-lg border ${
                extractionResult.analisis_pagos.estado_pago === 'PAGADO_COMPLETO'
                  ? 'from-success-bg to-success-bg border-success-bg'
                  : extractionResult.analisis_pagos.estado_pago === 'PAGO_PARCIAL'
                  ? 'from-warning-bg to-warning-bg border-warning-bg'
                  : 'from-error-bg to-error-bg border-error-bg'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {extractionResult.analisis_pagos.estado_pago === 'PAGADO_COMPLETO' ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className={`h-5 w-5 ${
                      extractionResult.analisis_pagos.estado_pago === 'PAGO_PARCIAL' ? 'text-warning' : 'text-error'
                    }`} />
                  )}
                  <span className={`text-sm font-medium ${
                    extractionResult.analisis_pagos.estado_pago === 'PAGADO_COMPLETO'
                      ? 'text-success-foreground'
                      : extractionResult.analisis_pagos.estado_pago === 'PAGO_PARCIAL'
                      ? 'text-warning-foreground'
                      : 'text-error-foreground'
                  }`}>Estado</span>
                </div>
                <p className={`text-xl font-bold ${
                  extractionResult.analisis_pagos.estado_pago === 'PAGADO_COMPLETO'
                    ? 'text-success-foreground'
                    : extractionResult.analisis_pagos.estado_pago === 'PAGO_PARCIAL'
                    ? 'text-warning-foreground'
                    : 'text-error-foreground'
                }`}>
                  {extractionResult.analisis_pagos.estado_pago.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Payment Details Table */}
            {extractionResult.analisis_pagos.pagos_detalle && extractionResult.analisis_pagos.pagos_detalle.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-brand-text mb-4">Detalle de Pagos</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-brand-border">
                        <th className="text-left py-3 px-4 font-semibold text-brand-text">Formulario</th>
                        <th className="text-left py-3 px-4 font-semibold text-brand-text">Fecha Pago</th>
                        <th className="text-left py-3 px-4 font-semibold text-brand-text">Cuota</th>
                        <th className="text-right py-3 px-4 font-semibold text-brand-text">Impuesto</th>
                        <th className="text-right py-3 px-4 font-semibold text-brand-text">Intereses</th>
                        <th className="text-right py-3 px-4 font-semibold text-brand-text">Sanción</th>
                        <th className="text-right py-3 px-4 font-semibold text-brand-text">Total</th>
                        <th className="text-left py-3 px-4 font-semibold text-brand-text">Concepto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractionResult.analisis_pagos.pagos_detalle.map((pago: PagoDetalle, index: number) => (
                        <tr key={index} className="border-b border-brand-border hover:bg-brand-bg">
                          <td className="py-3 px-4 font-medium">{pago.numero_formulario}</td>
                          <td className="py-3 px-4">{formatDate(pago.fecha_pago)}</td>
                          <td className="py-3 px-4">Cuota {pago.cuota_numero}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(pago.valor_impuesto)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(pago.valor_intereses)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(pago.valor_sancion)}</td>
                          <td className="py-3 px-4 text-right font-semibold">{formatCurrency(pago.total_pago)}</td>
                          <td className="py-3 px-4 text-sm text-brand-text-secondary">{pago.concepto}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Compliance Analysis */}
            {extractionResult.analisis_pagos.cumplimiento_fechas?.analisis_disponible &&
             extractionResult.analisis_pagos.cumplimiento_fechas.pagos_analizados && (
              <div className="mt-6 pt-6 border-t border-brand-border">
                <h4 className="text-lg font-bold text-brand-text mb-4">Análisis de Cumplimiento de Fechas</h4>
                <div className="space-y-4">
                  {extractionResult.analisis_pagos.cumplimiento_fechas.pagos_analizados.map((pago, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        pago.pago_oportuno
                          ? 'bg-success-bg border-success-bg'
                          : 'bg-error-bg border-error-bg'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {pago.pago_oportuno ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-error" />
                            )}
                            <span className={`font-semibold ${
                              pago.pago_oportuno
                                ? 'text-success-foreground'
                                : 'text-error-foreground'
                            }`}>
                              Cuota {pago.cuota}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-brand-text-secondary">Fecha límite:</span>
                              <p className="font-medium">{formatDate(pago.fecha_limite)}</p>
                            </div>
                            <div>
                              <span className="text-brand-text-secondary">Fecha pago:</span>
                              <p className="font-medium">{formatDate(pago.fecha_pago)}</p>
                            </div>
                            <div>
                              <span className="text-brand-text-secondary">Días de mora:</span>
                              <p className={`font-bold ${
                                (pago.dias_mora ?? 0) > 0 ? 'text-error' : 'text-success'
                              }`}>
                                {pago.dias_mora ?? 0} {(pago.dias_mora ?? 0) === 1 ? 'día' : 'días'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseUploadModal} />
          <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-brand-border p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-text">Extracción de Declaración de Renta</h2>
                <button
                  onClick={handleCloseUploadModal}
                  disabled={isUploading}
                  className="text-brand-text-secondary hover:text-brand-text disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-error-bg rounded-lg border border-error-bg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-error" />
                    <span className="font-medium text-error-foreground">Error</span>
                  </div>
                  <p className="text-sm text-error mt-1">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Archivo de Declaración (Requerido)</label>
                  <FileUpload
                    onFilesChange={handleFileChange}
                    maxFiles={1}
                    acceptedTypes={['application/pdf']}
                    maxFileSize={50}
                    title="Cargar Declaración de Renta"
                    description="Arrastra y suelta el archivo aquí o haz clic para seleccionar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Archivos de Pagos (Opcional - Máximo 10)</label>
                  <FileUpload
                    onFilesChange={handlePaymentFilesChange}
                    maxFiles={10}
                    acceptedTypes={['application/pdf']}
                    maxFileSize={50}
                    title="Cargar Formularios Pago 490"
                    description="Arrastra y suelta los archivos aquí o haz clic para seleccionar"
                  />
                </div>

                {/* Progress Bar - SSE Progress (si está habilitado) */}
                {isUploading && FEATURES.USE_SSE_PROGRESS && sseProgress && (
                  <div className="space-y-2">
                    <ProgressBar
                      percentage={sseProgress.percentage}
                      message={sseProgress.message}
                    />
                  </div>
                )}

                {/* Progress Bar - Upload Progress (fallback o cuando SSE está deshabilitado) */}
                {isUploading && !FEATURES.USE_SSE_PROGRESS && uploadProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Procesando archivos...</span>
                      <span>{uploadProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-brand-bg-alt rounded-full h-2">
                      <div
                        className="bg-brand-indigo h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Mensaje genérico si no hay progreso disponible aún */}
                {isUploading && !sseProgress && !uploadProgress && (
                  <div className="flex items-center gap-3 text-sm text-brand-text-secondary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Iniciando extracción...</span>
                  </div>
                )}

                {selectedFile && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={handleExtractDeclaration}
                      disabled={isUploading}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Extrayendo datos...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Extraer Datos
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCloseUploadModal}
                      disabled={isUploading}
                      className="px-4 py-2 border border-brand-border text-brand-text rounded-lg hover:bg-brand-bg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Calendar Modal */}
      <TaxCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        data={calendarModalData}
        type={calendarModalType}
        loading={isLoadingCalendarModal}
      />
    </div>
  )
}
