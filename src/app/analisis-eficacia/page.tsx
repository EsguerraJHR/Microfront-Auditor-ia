"use client"

import React, { useState } from "react"
import { Upload, FileText, Loader2, X, Building, CheckCircle, AlertTriangle, Calendar, Clock, Users, DollarSign } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import { declarationService, DetailedDeclarationResponse, UploadProgress, PagoDetalle } from "@/lib/api/declaration-service"
import { taxCalendarService, GranContribuyenteResponse, PersonaJuridicaResponse } from "@/lib/api/tax-calendar-service"
import { TaxCalendarModal } from "@/components/ui/tax-calendar-modal"

export default function AnalisisEficaciaPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [paymentFiles, setPaymentFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
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
    setError(null)

    try {
      const response = await declarationService.extractDetailedDeclaration(
        selectedFile,
        paymentFiles.length > 0 ? paymentFiles : undefined,
        (progress) => setUploadProgress(progress)
      )

      setExtractionResult(response)
      setShowUploadModal(false)
      setSelectedFile(null)
      setPaymentFiles([])

      // Load tax calendar after successful extraction
      await loadTaxCalendar(response.declaracion, response.es_gran_contribuyente)
    } catch (error) {
      console.error('Error extracting declaration:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido durante la extracción')
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
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

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

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
      {/* Header */}
      <div className="space-y-2">
        <h1 className="accountingTitle">
          Análisis de Eficacia
        </h1>
        <p className="accountingParagraph">
          Evaluación integral de la eficiencia de los procesos contables y operativos.
          Utiliza inteligencia artificial para identificar áreas de mejora y optimización.
        </p>
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
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
        >
          <Building className="h-4 w-4" />
          Calendario Grandes Contribuyentes
        </button>

        <button
          onClick={handleViewCompletePersonasJuridicas}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Users className="h-4 w-4" />
          Calendario Personas Jurídicas
        </button>
      </div>

      {/* Tax Calendar Section */}
      {extractionResult && taxCalendar && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-orange-700 dark:text-orange-300">
                  Calendario Tributario {declaracion?.ano_gravable}
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  {extractionResult.es_gran_contribuyente ? 'Grandes Contribuyentes' : 'Personas Jurídicas'}
                  {' '}| Último dígito NIT: {declaracion?.nit.slice(-1)}
                </p>
              </div>
              {isLoadingCalendar && (
                <div className="ml-auto">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
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
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                        Obligación
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
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
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-4 font-medium">Pago Primera Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  {formatDate(calendar.fecha_pago_primera_cuota)}
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-4 font-medium">Declaración Segunda Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  {formatDate(calendar.fecha_declaracion_segunda_cuota)}
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-4 font-medium">Pago Tercera Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
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
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-4 font-medium">Declaración Primera Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  {formatDate(calendar.fecha_declaracion_primera_cuota)}
                                </div>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-4 font-medium">Pago Segunda Cuota</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No se encontraron fechas del calendario tributario para este contribuyente.</p>
              </div>
            )}

            {/* Calendar Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span>Total de registros: {taxCalendar.total_registros}</span>
                <span className="mx-2">•</span>
                <span>Último dígito NIT: {taxCalendar.filtros_aplicados.ultimo_digito_nit}</span>
                <span className="mx-2">•</span>
                <span>Año gravable: {taxCalendar.filtros_aplicados.ano_gravable}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Analysis Section */}
      {extractionResult?.tiene_pagos && extractionResult?.analisis_pagos && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  Análisis de Pagos
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Comparación entre lo declarado y lo pagado
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Saldo a Pagar</span>
                </div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatCurrency(extractionResult.declaracion.saldo_pagar_impuesto)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Pagado</span>
                </div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(extractionResult.analisis_pagos.total_pagado)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Pendiente</span>
                </div>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {formatCurrency(extractionResult.analisis_pagos.saldo_pendiente)}
                </p>
              </div>

              <div className={`bg-gradient-to-br p-4 rounded-lg border ${
                extractionResult.analisis_pagos.estado_pago === 'PAGADO_COMPLETO'
                  ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 border-green-200 dark:border-green-800'
                  : extractionResult.analisis_pagos.estado_pago === 'PAGO_PARCIAL'
                  ? 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800'
                  : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {extractionResult.analisis_pagos.estado_pago === 'PAGADO_COMPLETO' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className={`h-5 w-5 ${
                      extractionResult.analisis_pagos.estado_pago === 'PAGO_PARCIAL' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  )}
                  <span className={`text-sm font-medium ${
                    extractionResult.analisis_pagos.estado_pago === 'PAGADO_COMPLETO'
                      ? 'text-green-700 dark:text-green-300'
                      : extractionResult.analisis_pagos.estado_pago === 'PAGO_PARCIAL'
                      ? 'text-yellow-700 dark:text-yellow-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>Estado</span>
                </div>
                <p className={`text-xl font-bold ${
                  extractionResult.analisis_pagos.estado_pago === 'PAGADO_COMPLETO'
                    ? 'text-green-900 dark:text-green-100'
                    : extractionResult.analisis_pagos.estado_pago === 'PAGO_PARCIAL'
                    ? 'text-yellow-900 dark:text-yellow-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {extractionResult.analisis_pagos.estado_pago.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Payment Details Table */}
            {extractionResult.analisis_pagos.pagos_detalle && extractionResult.analisis_pagos.pagos_detalle.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Detalle de Pagos</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Formulario</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Fecha Pago</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Cuota</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Impuesto</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Intereses</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Sanción</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Total</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Concepto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractionResult.analisis_pagos.pagos_detalle.map((pago: PagoDetalle, index: number) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4 font-medium">{pago.numero_formulario}</td>
                          <td className="py-3 px-4">{formatDate(pago.fecha_pago)}</td>
                          <td className="py-3 px-4">Cuota {pago.cuota_numero}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(pago.valor_impuesto)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(pago.valor_intereses)}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(pago.valor_sancion)}</td>
                          <td className="py-3 px-4 text-right font-semibold">{formatCurrency(pago.total_pago)}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{pago.concepto}</td>
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
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Análisis de Cumplimiento de Fechas</h4>
                <div className="space-y-4">
                  {extractionResult.analisis_pagos.cumplimiento_fechas.pagos_analizados.map((pago, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        pago.pago_oportuno
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {pago.pago_oportuno ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            )}
                            <span className={`font-semibold ${
                              pago.pago_oportuno
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              Cuota {pago.cuota}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Fecha límite:</span>
                              <p className="font-medium">{formatDate(pago.fecha_limite)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Fecha pago:</span>
                              <p className="font-medium">{formatDate(pago.fecha_pago)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Días de mora:</span>
                              <p className={`font-bold ${
                                (pago.dias_mora ?? 0) > 0 ? 'text-red-600' : 'text-green-600'
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
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Extracción de Declaración de Renta</h2>
                <button
                  onClick={handleCloseUploadModal}
                  disabled={isUploading}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800 dark:text-red-200">Error</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Archivos de Pagos (Opcional - Máximo 10)</label>
                  <FileUpload
                    onFilesChange={handlePaymentFilesChange}
                    maxFiles={10}
                    acceptedTypes={['application/pdf']}
                    maxFileSize={50}
                  />
                </div>

                {uploadProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Procesando archivos...</span>
                      <span>{uploadProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percentage}%` }}
                      ></div>
                    </div>
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
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
