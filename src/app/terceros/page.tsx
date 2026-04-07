"use client"

import React, { useState, useEffect, useRef } from "react"
import { Users, Building, UserCheck, Truck, ChevronDown, Loader2, FileText, CheckCircle, AlertTriangle, Download, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { rutService, RutExtractionWithClientResponse, UploadProgress, RutDetails } from "@/lib/api/rut-service"
import { accountingClientService, AccountingClient } from "@/lib/api/accounting-client-service"
import { FileUpload } from "@/components/ui/file-upload"
import { RutResults } from "@/components/ui/rut-results"
// Lazy import para servicios de Excel — se cargan solo cuando el usuario exporta
const getExcelExportService = () => import("@/lib/services/excel-export").then(m => m.ExcelExportService)
const getRinganaExcelExport = () => import("@/lib/services/ringana-excel-export")
import { RINGANA_CODIGO_EMPRESA } from "@/lib/services/ringana-excel-export"
import { getAuthHeaders } from "@/lib/utils/api-helpers"

type TerceroType = 'cliente' | 'proveedor'

export default function TercerosPage() {
  // Ref to prevent duplicate API calls in StrictMode
  const hasFetchedClients = useRef(false)

  // Accounting client states
  const [accountingClients, setAccountingClients] = useState<AccountingClient[]>([])
  const [selectedAccountingClient, setSelectedAccountingClient] = useState<AccountingClient | null>(null)
  const [isLoadingAccountingClients, setIsLoadingAccountingClients] = useState(false)
  const [accountingError, setAccountingError] = useState<string | null>(null)

  const [selectedType, setSelectedType] = useState<TerceroType | null>(null)

  // RUT extraction states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState<UploadProgress | null>(null)
  const [extractionResults, setExtractionResults] = useState<RutExtractionWithClientResponse | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  // Ringana export result state
  const [ringanaExportResult, setRinganaExportResult] = useState<{
    naturales: number
    juridicas: number
    archivos: string[]
  } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Crossmatch provisions state
  const [isCrossmatchLoading, setIsCrossmatchLoading] = useState(false)
  const crossmatchInputRef = useRef<HTMLInputElement>(null)

  const loadAccountingClients = async () => {
    setIsLoadingAccountingClients(true)
    setAccountingError(null)

    try {
      const response = await accountingClientService.getAccountingClients()
      setAccountingClients(response.items)
    } catch (error) {
      console.error('Error loading accounting clients:', error)
      setAccountingError(error instanceof Error ? error.message : 'Error al cargar clientes de contabilidad')
      setAccountingClients([])
    } finally {
      setIsLoadingAccountingClients(false)
    }
  }

  const handleAccountingClientChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value
    const client = accountingClients.find(ac => ac.id === selectedId)
    setSelectedAccountingClient(client || null)
    // Reset everything when changing accounting client
    setSelectedType(null)
    setSelectedFiles([])
    setExtractionResults(null)
    setExtractionError(null)
    setRinganaExportResult(null)
  }

  const handleTypeChange = (type: TerceroType) => {
    setSelectedType(type)
  }

  const handleFilesChange = (files: any[]) => {
    // Convert FileWithPreview to File array
    const fileArray = files.map(f => f as File)
    setSelectedFiles(fileArray)
    setExtractionError(null)
  }

  const handleStartExtraction = async () => {
    if (!selectedAccountingClient) {
      setExtractionError('Debe seleccionar un cliente de contabilidad primero')
      return
    }

    if (selectedFiles.length === 0) {
      setExtractionError('Debe seleccionar al menos un archivo')
      return
    }

    setIsExtracting(true)
    setExtractionProgress(null)
    setExtractionError(null)
    setExtractionResults(null)

    try {
      const response = await rutService.extractRutFromFilesWithClient(
        selectedFiles,
        parseInt(selectedAccountingClient.codigo_empresa),
        (progress) => {
          setExtractionProgress(progress)
        }
      )

      setExtractionResults(response)
    } catch (error) {
      console.error('Error during RUT extraction:', error)
      setExtractionError(error instanceof Error ? error.message : 'Error durante la extracción')
    } finally {
      setIsExtracting(false)
      setExtractionProgress(null)
    }
  }

  const handleGenerateExcel = async () => {
    if (!extractionResults || !selectedAccountingClient || !selectedType) {
      return
    }

    setIsExporting(true)
    setRinganaExportResult(null)

    try {
      console.log('Selected Accounting Client:', selectedAccountingClient)
      console.log('Codigo Empresa:', selectedAccountingClient.codigo_empresa)

      // Verificar si es Ringana (código 17)
      const esRingana = selectedAccountingClient.codigo_empresa === RINGANA_CODIGO_EMPRESA

      if (esRingana) {
        // Usar servicio especializado de Ringana
        console.log('Exportando para Ringana - separando por tipo de contribuyente')

        const { RinganaExcelExportService } = await getRinganaExcelExport()
        const resultado = await RinganaExcelExportService.exportRingana(
          extractionResults.results,
          selectedType
        )

        setRinganaExportResult(resultado)

        console.log('Exportación Ringana completada:', resultado)
      } else {
        // Usar servicio estándar para otros clientes
        const rutDetails: RutDetails[] = extractionResults.results
          .filter(result => result.success && result.data)
          .map(result => {
            const rutData = result.data!.rut_data
            return {
              id: 0,
              nit: rutData.nit,
              dv: rutData.dv,
              numero_formulario: rutData.numero_formulario,
              razon_social: rutData.razon_social,
              nombre_comercial: rutData.nombre_comercial,
              tipo_contribuyente: rutData.tipo_contribuyente,
              pais: rutData.pais,
              departamento: rutData.departamento,
              ciudad_municipio: rutData.ciudad_municipio,
              direccion_principal: rutData.direccion_principal,
              telefono_1: rutData.telefono_1,
              correo_electronico: rutData.correo_electronico,
              actividad_principal_codigo: rutData.actividad_principal_codigo,
              processing_state: 'LISTO',
              representantes_legales: rutData.representantes_legales,
              created_at: rutData.extraction_timestamp,
              updated_at: null,
              original_filename: result.filename
            }
          })

        console.log('Calling exportToExcel with codigo_empresa:', selectedAccountingClient.codigo_empresa)
        const ExcelExportService = await getExcelExportService()
        await ExcelExportService.exportToExcel(rutDetails, selectedAccountingClient.codigo_empresa)
      }
    } catch (error) {
      console.error('Error generating Excel:', error)
      setExtractionError(error instanceof Error ? error.message : 'Error al generar el archivo Excel')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCrossmatchProvisiones = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsCrossmatchLoading(true)
    setExtractionError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Obtener headers de autenticación y remover Content-Type para que el browser lo configure
      const authHeaders = getAuthHeaders() as Record<string, string>
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(
        `${baseUrl}/api/v1/compliance/provisions/crossmatch-rut/download`,
        {
          method: 'POST',
          body: formData,
          headers: headersWithoutContentType,
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Error al procesar archivo')
      }

      // Obtener el blob del Excel
      const blob = await response.blob()

      // Extraer nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'provisiones_con_status.xlsx'
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }

      // Crear link de descarga y ejecutar
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Limpiar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error en crossmatch de provisiones:', error)
      setExtractionError(error instanceof Error ? error.message : 'Error al procesar el archivo de provisiones')
    } finally {
      setIsCrossmatchLoading(false)
      // Reset input para permitir seleccionar el mismo archivo de nuevo
      if (crossmatchInputRef.current) {
        crossmatchInputRef.current.value = ''
      }
    }
  }

  // Load accounting clients on mount
  useEffect(() => {
    if (!hasFetchedClients.current) {
      hasFetchedClients.current = true
      loadAccountingClients()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-brand-indigo" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-navy">Gestion de Terceros v2</h1>
            <p className="text-sm text-brand-text-secondary">
              Nueva versión mejorada para la gestión integral de terceros
            </p>
          </div>
        </div>
      </div>

      {/* Accounting Client Selector - FIRST ELEMENT */}
      <div className="card-base p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-brand-text">Cliente de Contabilidad</h3>
            <p className="text-sm text-brand-text-secondary">
              Selecciona el cliente de contabilidad para el cual realizarás la gestión de terceros
            </p>
          </div>

          {accountingError && (
            <div className="p-3 bg-error-bg border border-error-bg rounded-lg">
              <p className="text-sm text-error-foreground">{accountingError}</p>
            </div>
          )}

          <div className="relative">
            <select
              value={selectedAccountingClient?.id || ''}
              onChange={handleAccountingClientChange}
              disabled={isLoadingAccountingClients || accountingClients.length === 0}
              className={cn(
                "w-full px-4 py-3 pr-10 text-sm border border-brand-border rounded-lg",
                "bg-white text-brand-text",
                "focus:ring-2 focus:ring-brand-indigo focus:border-brand-indigo",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "appearance-none"
              )}
            >
              <option value="">
                {isLoadingAccountingClients
                  ? 'Cargando clientes...'
                  : accountingClients.length === 0
                    ? 'No hay clientes disponibles'
                    : 'Selecciona un cliente de contabilidad'
                }
              </option>
              {accountingClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.razon_social} - {client.nit}
                </option>
              ))}
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {isLoadingAccountingClients ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand-text-secondary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-brand-text-secondary" />
              )}
            </div>
          </div>

          {selectedAccountingClient && (
            <div className="p-4 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-indigo/10 flex items-center justify-center">
                  <Building className="h-4 w-4 text-brand-indigo" />
                </div>
                <div>
                  <p className="font-medium text-brand-text">{selectedAccountingClient.razon_social}</p>
                  <p className="text-xs text-brand-text-secondary">
                    NIT: {selectedAccountingClient.nit} • Código: {selectedAccountingClient.codigo_empresa}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tipo de Tercero Selector - Only show if accounting client is selected */}
      {selectedAccountingClient && (
      <>
      <div className="card-base p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-brand-text">Tipo de Tercero</h3>
            <p className="text-sm text-brand-text-secondary">
              Selecciona el tipo de tercero que deseas gestionar
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex space-x-1 bg-brand-bg-alt p-1 rounded-lg w-fit">
            <button
              onClick={() => handleTypeChange('cliente')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                selectedType === 'cliente'
                  ? "bg-white text-brand-indigo shadow-sm"
                  : "text-brand-text-secondary hover:text-brand-text"
              )}
            >
              <UserCheck className="h-4 w-4" />
              Cliente
            </button>
            <button
              onClick={() => handleTypeChange('proveedor')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                selectedType === 'proveedor'
                  ? "bg-white text-brand-indigo shadow-sm"
                  : "text-brand-text-secondary hover:text-brand-text"
              )}
            >
              <Truck className="h-4 w-4" />
              Proveedor
            </button>
          </div>

          {/* Selected Type Display */}
          {selectedType && (
          <div className="flex items-center gap-3 pt-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              selectedType === 'cliente'
                ? "bg-brand-indigo/10"
                : "bg-brand-indigo/10"
            )}>
              {selectedType === 'cliente' ? (
                <UserCheck className="h-4 w-4 text-brand-indigo" />
              ) : (
                <Truck className="h-4 w-4 text-success" />
              )}
            </div>
            <div>
              <p className="font-medium text-brand-text">
                {selectedType === 'cliente' ? 'Cliente' : 'Proveedor'} seleccionado
              </p>
              <p className="text-xs text-brand-text-secondary">
                {selectedType === 'cliente'
                  ? 'Gestiona información de tus clientes'
                  : 'Gestiona información de tus proveedores'
                }
              </p>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* RUT Batch Upload - Only show when type is selected */}
      {selectedAccountingClient && selectedType && (
        <div className="card-base p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold text-brand-text">
                Carga Masiva de RUTs
              </h3>
              <p className="text-sm text-brand-text-secondary">
                Sube múltiples archivos RUT para {selectedAccountingClient.razon_social} ({selectedType === 'cliente' ? 'Clientes' : 'Proveedores'})
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <FileUpload
                onFilesChange={handleFilesChange}
                maxFiles={50}
                acceptedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/bmp', 'image/tiff', 'image/webp']}
                maxFileSize={50}
                isUploading={isExtracting}
              />

              {/* Extract Button */}
              {selectedFiles.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-brand-text-secondary">
                    {selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''} seleccionado{selectedFiles.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={handleStartExtraction}
                    disabled={isExtracting}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Extraer RUTs
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Extraction Error */}
              {extractionError && (
                <div className="p-3 bg-error-bg border border-error-bg rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-error" />
                    <p className="text-sm text-error-foreground">{extractionError}</p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isExtracting && extractionProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-brand-text-secondary">
                    <span>Procesando archivos...</span>
                    <span>{extractionProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-brand-bg-alt rounded-full h-2">
                    <div
                      className="bg-brand-indigo h-2 rounded-full transition-all duration-300"
                      style={{ width: `${extractionProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {extractionResults && !isExtracting && (
                <div className="space-y-4">
                  <div className="p-3 bg-success-bg border border-success-bg rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div className="text-sm">
                        <p className="text-success-foreground font-medium">
                          ¡Extracción completada!
                        </p>
                        <p className="text-success-foreground">
                          {extractionResults.successful_extractions} de {extractionResults.total_files} archivos procesados exitosamente
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Generate Excel Button */}
                  {extractionResults.successful_extractions > 0 && (
                    <button
                      onClick={handleGenerateExcel}
                      disabled={isExporting}
                      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Generando archivos...
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5" />
                          {selectedAccountingClient?.codigo_empresa === RINGANA_CODIGO_EMPRESA
                            ? 'Generar Formatos Ringana (Separado por tipo)'
                            : `Generar Formato ${selectedType === 'cliente' ? 'Clientes' : 'Proveedores'}`
                          }
                        </>
                      )}
                    </button>
                  )}

                  {/* Ringana Export Result */}
                  {ringanaExportResult && (
                    <div className="p-4 bg-brand-indigo/5 border border-brand-indigo/20 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-brand-indigo" />
                          <span className="font-medium text-brand-navy">
                            Exportación Ringana completada
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center"><User className="h-4 w-4 text-brand-indigo" /></div>
                            <div>
                              <p className="font-semibold text-success-foreground">
                                {ringanaExportResult.naturales} Personas Naturales
                              </p>
                              {ringanaExportResult.naturales > 0 && (
                                <p className="text-xs text-brand-text-secondary">
                                  2 archivos generados
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-brand-navy/10 flex items-center justify-center"><Building className="h-4 w-4 text-brand-navy" /></div>
                            <div>
                              <p className="font-semibold text-info-foreground">
                                {ringanaExportResult.juridicas} Personas Jurídicas
                              </p>
                              {ringanaExportResult.juridicas > 0 && (
                                <p className="text-xs text-brand-text-secondary">
                                  1 archivo generado
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-brand-indigo/20">
                          <p className="text-xs text-brand-indigo font-medium mb-1">
                            Archivos descargados:
                          </p>
                          <ul className="text-xs text-brand-text-secondary space-y-1">
                            {ringanaExportResult.archivos.map((archivo, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {archivo}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Crossmatch Provisiones Button */}
                  {extractionResults.successful_extractions > 0 && (
                    <div className="pt-4 border-t border-brand-border">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-brand-text">
                          Cruce con Provisiones
                        </p>
                        <p className="text-xs text-brand-text-secondary">
                          Sube un archivo Excel de provisiones para cruzar con los RUTs extraídos y obtener el status de cada tercero.
                        </p>
                        <div className="relative">
                          <input
                            ref={crossmatchInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleCrossmatchProvisiones}
                            disabled={isCrossmatchLoading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <button
                            disabled={isCrossmatchLoading}
                            className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 border-2 border-dashed border-brand-indigo/30 hover:border-brand-indigo bg-brand-indigo/5 text-brand-indigo"
                          >
                            {isCrossmatchLoading ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Procesando provisiones...
                              </>
                            ) : (
                              <>
                                <FileText className="h-5 w-5" />
                                Subir Excel de Provisiones y Descargar Cruce
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Extraction Results */}
      {extractionResults && (
        <RutResults
          results={extractionResults}
          onClose={() => setExtractionResults(null)}
        />
      )}

      {/* Content Area - Currently Empty */}
      {selectedType && (
      <div className="card-base p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-bg-alt flex items-center justify-center mx-auto">
            <Building className="h-8 w-8 text-brand-text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-brand-text">
              Gestión de {selectedType === 'cliente' ? 'Clientes' : 'Proveedores'}
            </h3>
            <p className="text-brand-text-secondary">
              Los componentes para gestionar {selectedType === 'cliente' ? 'clientes' : 'proveedores'} se agregarán aquí.
            </p>
          </div>
        </div>
      </div>
      )}
      </>
      )}
    </div>
  )
}