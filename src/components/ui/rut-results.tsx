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
      <span className="px-2 py-1 text-xs bg-brand-bg-alt text-brand-text-secondary rounded-full">
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
          ? "bg-brand-indigo/10 text-brand-indigo"
          : "bg-success-bg text-success-foreground"
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
      <div className="bg-brand-indigo/5 rounded-xl p-6 border border-brand-indigo/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-brand-indigo">
              Resultados de Extracción RUT
            </h2>
            {isClientResponse(results) && (
              <p className="text-sm text-brand-indigo mt-1">
                RUTs asociados a: {results.cliente_proveedor.nombre_comercial}
              </p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text"
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
              <FileText className="h-5 w-5 text-brand-indigo" />
              <span className="text-2xl font-bold text-brand-indigo">{results.total_files}</span>
            </div>
            <p className="text-sm text-brand-indigo">Archivos procesados</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold text-success">{results.successful_extractions}</span>
            </div>
            <p className="text-sm text-success">Extracciones exitosas</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="h-5 w-5 text-error" />
              <span className="text-2xl font-bold text-error">{results.failed_extractions}</span>
            </div>
            <p className="text-sm text-error">Extracciones fallidas</p>
          </div>

          {isClientResponse(results) && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building className="h-5 w-5 text-brand-indigo" />
                <span className="text-2xl font-bold text-brand-indigo">{results.total_associations_created}</span>
              </div>
              <p className="text-sm text-brand-indigo">Asociaciones creadas</p>
            </div>
          )}

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="h-5 w-5 text-brand-text-secondary" />
              <span className="text-2xl font-bold text-brand-text-secondary">{results.processing_time_seconds.toFixed(2)}s</span>
            </div>
            <p className="text-sm text-brand-text-secondary">Tiempo de procesamiento</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-brand-bg rounded-lg">
          <p className="text-sm text-center text-brand-text-secondary">
            <strong>Estado:</strong> {results.message}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-brand-bg-alt p-1 rounded-lg">
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
                ? "bg-white text-brand-indigo shadow-sm"
                : "text-brand-text-secondary hover:text-brand-text"
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
                ? "border-success-bg"
                : "border-error-bg"
            )}
          >
            {/* Header */}
            <div
              className={cn(
                "p-4 cursor-pointer transition-colors",
                result.success
                  ? "bg-success-bg/50 hover:bg-success-bg"
                  : "bg-error-bg/50 hover:bg-error-bg"
              )}
              onClick={() => toggleExpanded(result.filename)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-error" />
                  )}

                  <div>
                    <h3 className="font-medium text-brand-text">
                      {result.filename}
                    </h3>
                    {result.success && (() => {
                      const rutData = getRutDataFromResult(result)
                      return rutData && (
                        <p className="text-sm text-brand-text-secondary">
                          {rutData.razon_social} - NIT: {formatNit(rutData.nit, rutData.dv)}
                        </p>
                      )
                    })()}
                    {!result.success && result.error && (
                      <p className="text-sm text-error">
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
                    <span className="px-2 py-1 text-xs bg-brand-indigo/10 text-brand-indigo rounded-full">
                      Excel generado
                    </span>
                  )}
                  {expandedItems.has(result.filename) ? (
                    <EyeOff className="h-4 w-4 text-brand-text-secondary" />
                  ) : (
                    <Eye className="h-4 w-4 text-brand-text-secondary" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedItems.has(result.filename) && result.success && (() => {
              const rutData = getRutDataFromResult(result)
              return rutData && (
                <div className="border-t bg-white">
                  <RutDataDetails data={rutData} />
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="text-center py-8 text-brand-text-secondary">
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
          <h4 className="font-semibold text-brand-text flex items-center gap-2">
            <Building className="h-4 w-4" />
            Información Básica
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Razón Social:</span>
              <span className="font-medium">{data.razon_social}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">NIT:</span>
              <span className="font-medium">{formatNit(data.nit, data.dv)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Tipo:</span>
              <span className="font-medium">{data.tipo_contribuyente}</span>
            </div>
            {data.nombre_comercial && (
              <div className="flex justify-between">
                <span className="text-brand-text-secondary">Nombre Comercial:</span>
                <span className="font-medium">{data.nombre_comercial}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-brand-text flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contacto
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Dirección:</span>
              <span className="font-medium text-right">{data.direccion_principal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Ciudad:</span>
              <span className="font-medium">{data.ciudad_municipio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Teléfono:</span>
              <span className="font-medium">{formatPhone(data.telefono_1)}</span>
            </div>
            {data.correo_electronico && (
              <div className="flex justify-between">
                <span className="text-brand-text-secondary">Email:</span>
                <span className="font-medium">{data.correo_electronico}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Economic Activities */}
      <div>
        <h4 className="font-semibold text-brand-text mb-3">Actividades Económicas</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
          <div className="bg-brand-bg p-3 rounded-lg">
            <span className="text-brand-text-secondary">Actividad Principal:</span>
            <p className="font-medium">{data.actividad_principal_codigo}</p>
            {data.actividad_principal_fecha_inicio && (
              <p className="text-xs text-brand-text-secondary">Desde: {data.actividad_principal_fecha_inicio}</p>
            )}
          </div>
          {data.actividad_secundaria_codigo && (
            <div className="bg-brand-bg p-3 rounded-lg">
              <span className="text-brand-text-secondary">Actividad Secundaria:</span>
              <p className="font-medium">{data.actividad_secundaria_codigo}</p>
              {data.actividad_secundaria_fecha_inicio && (
                <p className="text-xs text-brand-text-secondary">Desde: {data.actividad_secundaria_fecha_inicio}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Responsibilities */}
      {data.responsabilidades && data.responsabilidades.length > 0 && (
        <div>
          <h4 className="font-semibold text-brand-text mb-3">Responsabilidades</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {data.responsabilidades.map((resp, index) => (
              <div key={index} className="text-sm bg-brand-indigo/5 p-2 rounded">
                {resp}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal Representatives */}
      {data.representantes_legales && data.representantes_legales.length > 0 && (
        <div>
          <h4 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Representantes Legales
          </h4>
          <div className="space-y-3">
            {data.representantes_legales.map((rep, index) => (
              <div key={index} className="bg-brand-bg p-4 rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-brand-text-secondary">Nombre:</span>
                    <p className="font-medium">
                      {rep.primer_nombre} {rep.otros_nombres} {rep.primer_apellido} {rep.segundo_apellido}
                    </p>
                  </div>
                  <div>
                    <span className="text-brand-text-secondary">Tipo:</span>
                    <p className="font-medium">{rep.tipo_representacion}</p>
                  </div>
                  <div>
                    <span className="text-brand-text-secondary">Documento:</span>
                    <p className="font-medium">{rep.tipo_documento}: {rep.numero_identificacion}</p>
                  </div>
                  {rep.fecha_inicio_ejercicio && (
                    <div>
                      <span className="text-brand-text-secondary">Inicio:</span>
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