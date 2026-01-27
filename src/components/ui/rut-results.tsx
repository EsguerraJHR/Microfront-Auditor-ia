"use client"

import { useState } from "react"
import { CheckCircle, AlertCircle, XCircle, Eye, EyeOff, Download, FileText, Building, User, Phone, Mail, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { RutExtractionResponse, RutExtractionWithClientResponse, ExtractionResult, ExtractionResultWithClient, RutData, DeteccionTipo } from "@/lib/api/rut-service"

const formatPhone = (phone: string) => {
  if (!phone) return 'No disponible'
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
}

const formatNit = (nit: string, dv: string) => {
  if (!nit) return 'No disponible'
  return `${nit}${dv ? `-${dv}` : ''}`
}

// Helper functions to extract data from different result types
const getRutDataFromResult = (result: ExtractionResult | ExtractionResultWithClient): RutData | null => {
  if (!result.success || !result.data) return null

  // Check if it's the new client response format
  if ('rut_data' in result.data) {
    return (result.data as any).rut_data
  }

  // Original format
  return result.data as RutData
}

const isClientResponse = (results: RutExtractionResponse | RutExtractionWithClientResponse): results is RutExtractionWithClientResponse => {
  return 'cliente_proveedor' in results
}

// Helper para obtener detección de tipo de un resultado
const getDeteccionTipo = (result: ExtractionResult | ExtractionResultWithClient): DeteccionTipo | null => {
  if (!result.success || !result.data) return null

  // Solo existe en el formato con cliente
  if ('rut_data' in result.data && 'deteccion_tipo' in result.data) {
    return (result.data as any).deteccion_tipo || null
  }

  return null
}

// Componente Badge para tipo de contribuyente
const TipoContribuyenteBadge = ({ deteccion }: { deteccion: DeteccionTipo | null }) => {
  if (!deteccion) {
    return (
      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">
        RUT Existente
      </span>
    )
  }

  const isJuridica = deteccion.tipo_contribuyente_detectado === 'JURIDICA'

  return (
    <span
      className={cn(
        "px-2 py-1 text-xs rounded-full inline-flex items-center gap-1",
        isJuridica
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      )}
      title={deteccion.fallback ? `Fallback desde: ${deteccion.agente_principal_fallido}` : `Agente: ${deteccion.agente_usado}`}
    >
      {isJuridica ? '🏢' : '👤'}
      {isJuridica ? 'Persona Jurídica' : 'Persona Natural'}
      {deteccion.fallback && <span className="text-amber-500">⚠</span>}
    </span>
  )
}

interface RutResultsProps {
  results: RutExtractionResponse | RutExtractionWithClientResponse
  onClose?: () => void
}

export function RutResults({ results, onClose }: RutResultsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedTab, setSelectedTab] = useState<'all' | 'success' | 'failed'>('all')

  const toggleExpanded = (filename: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename)
    } else {
      newExpanded.add(filename)
    }
    setExpandedItems(newExpanded)
  }

  const filteredResults = results.results.filter(result => {
    if (selectedTab === 'success') return result.success
    if (selectedTab === 'failed') return !result.success
    return true
  })

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300">
              Resultados de Extracción RUT
            </h2>
            {isClientResponse(results) && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                RUTs asociados a: {results.cliente_proveedor.nombre_comercial}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className={`grid grid-cols-1 gap-4 ${
          isClientResponse(results) ? 'md:grid-cols-5' : 'md:grid-cols-4'
        }`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{results.total_files}</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Archivos procesados</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{results.successful_extractions}</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Extracciones exitosas</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{results.failed_extractions}</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">Extracciones fallidas</p>
          </div>

          {isClientResponse(results) && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{results.total_associations_created}</span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">Asociaciones creadas</p>
            </div>
          )}

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span className="text-2xl font-bold text-gray-600">{results.processing_time_seconds.toFixed(2)}s</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">Tiempo de procesamiento</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-center text-gray-700 dark:text-gray-300">
            <strong>Estado:</strong> {results.message}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'all', label: 'Todos', count: results.total_files },
          { key: 'success', label: 'Exitosos', count: results.successful_extractions },
          { key: 'failed', label: 'Fallidos', count: results.failed_extractions }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              selectedTab === tab.key
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.map((result, index) => (
          <div
            key={`${result.filename}-${index}`}
            className={cn(
              "border rounded-lg overflow-hidden",
              result.success
                ? "border-green-200 dark:border-green-800"
                : "border-red-200 dark:border-red-800"
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "p-4 cursor-pointer transition-colors",
                result.success
                  ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                  : "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
              )}
              onClick={() => toggleExpanded(result.filename)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}

                  <div>
                    <h3 className="font-medium text-foreground">
                      {result.filename}
                    </h3>
                    {result.success && (() => {
                      const rutData = getRutDataFromResult(result)
                      return rutData && (
                        <p className="text-sm text-muted-foreground">
                          {rutData.razon_social} - NIT: {formatNit(rutData.nit, rutData.dv)}
                        </p>
                      )
                    })()}
                    {!result.success && result.error && (
                      <p className="text-sm text-red-600">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Badge de tipo de contribuyente detectado */}
                  {result.success && isClientResponse(results) && (
                    <TipoContribuyenteBadge deteccion={getDeteccionTipo(result)} />
                  )}
                  {result.excel_written && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Excel generado
                    </span>
                  )}
                  {expandedItems.has(result.filename) ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedItems.has(result.filename) && result.success && (() => {
              const rutData = getRutDataFromResult(result)
              return rutData && (
                <div className="border-t bg-white dark:bg-gray-900">
                  <RutDataDetails data={rutData} />
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay resultados para mostrar en esta categoría.
        </div>
      )}
    </div>
  )
}

interface RutDataDetailsProps {
  data: RutData
}

function RutDataDetails({ data }: RutDataDetailsProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Building className="h-4 w-4" />
            Información Básica
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Razón Social:</span>
              <span className="font-medium">{data.razon_social}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NIT:</span>
              <span className="font-medium">{formatNit(data.nit, data.dv)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <span className="font-medium">{data.tipo_contribuyente}</span>
            </div>
            {data.nombre_comercial && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre Comercial:</span>
                <span className="font-medium">{data.nombre_comercial}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contacto
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dirección:</span>
              <span className="font-medium text-right">{data.direccion_principal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ciudad:</span>
              <span className="font-medium">{data.ciudad_municipio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teléfono:</span>
              <span className="font-medium">{formatPhone(data.telefono_1)}</span>
            </div>
            {data.correo_electronico && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{data.correo_electronico}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Economic Activities */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">Actividades Económicas</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <span className="text-muted-foreground">Actividad Principal:</span>
            <p className="font-medium">{data.actividad_principal_codigo}</p>
            {data.actividad_principal_fecha_inicio && (
              <p className="text-xs text-muted-foreground">Desde: {data.actividad_principal_fecha_inicio}</p>
            )}
          </div>
          {data.actividad_secundaria_codigo && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <span className="text-muted-foreground">Actividad Secundaria:</span>
              <p className="font-medium">{data.actividad_secundaria_codigo}</p>
              {data.actividad_secundaria_fecha_inicio && (
                <p className="text-xs text-muted-foreground">Desde: {data.actividad_secundaria_fecha_inicio}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Responsibilities */}
      {data.responsabilidades && data.responsabilidades.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Responsabilidades</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {data.responsabilidades.map((resp, index) => (
              <div key={index} className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                {resp}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal Representatives */}
      {data.representantes_legales && data.representantes_legales.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Representantes Legales
          </h4>
          <div className="space-y-3">
            {data.representantes_legales.map((rep, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nombre:</span>
                    <p className="font-medium">
                      {rep.primer_nombre} {rep.otros_nombres} {rep.primer_apellido} {rep.segundo_apellido}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{rep.tipo_representacion}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Documento:</span>
                    <p className="font-medium">{rep.tipo_documento}: {rep.numero_identificacion}</p>
                  </div>
                  {rep.fecha_inicio_ejercicio && (
                    <div>
                      <span className="text-muted-foreground">Inicio:</span>
                      <p className="font-medium">{rep.fecha_inicio_ejercicio}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}