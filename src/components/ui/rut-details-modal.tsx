"use client"

import { X, Building, User, Phone, Mail, MapPin, Calendar, FileText, Loader2, Copy, ExternalLink } from "lucide-react"
import { RutDetails } from "@/lib/api/rut-service"

interface RutDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  rutDetails: RutDetails | null
  isLoading: boolean
  error?: string | null
}

export function RutDetailsModal({
  isOpen,
  onClose,
  rutDetails,
  isLoading,
  error
}: RutDetailsModalProps) {
  if (!isOpen) return null

  const formatPhone = (phone: string) => {
    if (!phone) return 'No disponible'
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
  }

  const formatNit = (nit: string, dv: string) => {
    if (!nit) return 'No disponible'
    return `${nit}${dv ? `-${dv}` : ''}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "EXTRAIDO":
        return { label: "Extraído", class: "status-pending", color: "text-brand-indigo bg-brand-indigo/5 border-brand-indigo/20" }
      case "LISTO":
        return { label: "Listo", class: "status-valid", color: "text-success bg-success-bg border-success-bg" }
      case "PROCESADO":
        return { label: "Procesado", class: "status-warning", color: "text-warning bg-warning-bg border-warning-bg" }
      default:
        return { label: status, class: "status-pending", color: "text-brand-text-secondary bg-brand-bg border-brand-border" }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-brand-border max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-brand-border px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-indigo/10 rounded-full">
                <Building className="h-6 w-6 text-brand-indigo" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-text">
                  Detalles del Tercero
                </h2>
                <p className="text-sm text-brand-text-secondary">
                  Información completa del RUT
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-indigo" />
                <p className="text-brand-text-secondary">Cargando detalles del tercero...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="p-4 bg-error-bg border border-error-bg rounded-lg">
                <p className="text-error font-medium">Error al cargar los detalles</p>
                <p className="text-error text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : rutDetails ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-brand-indigo/5 rounded-xl p-6 border border-brand-indigo/20">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-brand-indigo">
                      {rutDetails.razon_social}
                    </h3>
                    {rutDetails.nombre_comercial && (
                      <p className="text-brand-indigo mt-1">
                        Nombre comercial: {rutDetails.nombre_comercial}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-brand-text-secondary">NIT:</span>
                      <span className="font-mono font-semibold">{formatNit(rutDetails.nit, rutDetails.dv)}</span>
                      <button
                        onClick={() => copyToClipboard(formatNit(rutDetails.nit, rutDetails.dv))}
                        className="text-brand-indigo hover:text-brand-indigo-hover ml-1"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusConfig(rutDetails.processing_state).color}`}>
                      {getStatusConfig(rutDetails.processing_state).label}
                    </div>
                    <div className="text-xs text-brand-text-secondary text-center">
                      ID: #{rutDetails.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-brand-text flex items-center gap-2 text-lg">
                    <Building className="h-5 w-5 text-brand-indigo" />
                    Información Básica
                  </h4>
                  <div className="bg-brand-bg rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Tipo:</span>
                      <span className="col-span-2 font-medium">{rutDetails.tipo_contribuyente}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Formulario:</span>
                      <span className="col-span-2 font-mono">{rutDetails.numero_formulario}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">País:</span>
                      <span className="col-span-2">{rutDetails.pais}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Archivo original:</span>
                      <div className="col-span-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-text-secondary" />
                        <span className="font-mono text-xs">{rutDetails.original_filename}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-brand-text flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-success" />
                    Ubicación
                  </h4>
                  <div className="bg-brand-bg rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Departamento:</span>
                      <span className="col-span-2 font-medium">{rutDetails.departamento}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Ciudad:</span>
                      <span className="col-span-2 font-medium">{rutDetails.ciudad_municipio}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Dirección:</span>
                      <div className="col-span-2">
                        <span className="font-medium">{rutDetails.direccion_principal}</span>
                        <button
                          onClick={() => copyToClipboard(rutDetails.direccion_principal)}
                          className="text-brand-indigo hover:text-brand-indigo-hover ml-2"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-brand-text flex items-center gap-2 text-lg">
                    <Phone className="h-5 w-5 text-brand-indigo" />
                    Contacto
                  </h4>
                  <div className="bg-brand-bg rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Teléfono:</span>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="font-medium">{formatPhone(rutDetails.telefono_1)}</span>
                        {rutDetails.telefono_1 && (
                          <button
                            onClick={() => copyToClipboard(rutDetails.telefono_1)}
                            className="text-brand-indigo hover:text-brand-indigo-hover"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Email:</span>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="font-medium break-all">{rutDetails.correo_electronico || 'No disponible'}</span>
                        {rutDetails.correo_electronico && (
                          <>
                            <button
                              onClick={() => copyToClipboard(rutDetails.correo_electronico)}
                              className="text-brand-indigo hover:text-brand-indigo-hover"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <a
                              href={`mailto:${rutDetails.correo_electronico}`}
                              className="text-brand-indigo hover:text-brand-indigo-hover"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity & Dates */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-brand-text flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-warning" />
                    Actividad y Fechas
                  </h4>
                  <div className="bg-brand-bg rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Actividad principal:</span>
                      <span className="col-span-2 font-medium">{rutDetails.actividad_principal_codigo}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-brand-text-secondary font-medium">Creado:</span>
                      <span className="col-span-2">{formatDate(rutDetails.created_at)}</span>
                    </div>
                    {rutDetails.updated_at && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <span className="text-brand-text-secondary font-medium">Última actualización:</span>
                        <span className="col-span-2">{formatDate(rutDetails.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Representatives */}
              {rutDetails.representantes_legales.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-brand-text flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-brand-indigo" />
                    Representantes Legales ({rutDetails.representantes_legales.length})
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {rutDetails.representantes_legales.map((rep, index) => (
                      <div key={index} className="bg-brand-bg rounded-lg p-4 border border-brand-border">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-brand-text">
                              {rep.primer_nombre} {rep.otros_nombres} {rep.primer_apellido} {rep.segundo_apellido}
                            </span>
                            <span className="px-2 py-1 text-xs bg-brand-indigo/10 text-brand-indigo rounded-full">
                              {rep.tipo_representacion}
                            </span>
                          </div>
                          <div className="text-sm text-brand-text-secondary">
                            <p><strong>{rep.tipo_documento}:</strong> {rep.numero_identificacion}</p>
                            {rep.fecha_inicio_ejercicio && (
                              <p><strong>Inicio ejercicio:</strong> {rep.fecha_inicio_ejercicio}</p>
                            )}
                            {rep.numero_tarjeta_profesional && (
                              <p><strong>Tarjeta profesional:</strong> {rep.numero_tarjeta_profesional}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-brand-text-secondary">No se encontraron detalles para mostrar.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-brand-border px-6 py-4 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}