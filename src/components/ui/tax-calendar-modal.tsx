"use client"

import { useState } from "react"
import { X, Calendar, Building, Users, Download, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import { GranContribuyenteResponse, PersonaJuridicaResponse, GranContribuyenteCalendar, PersonaJuridicaCalendar } from "@/lib/api/tax-calendar-service"

interface TaxCalendarModalProps {
  isOpen: boolean
  onClose: () => void
  data: GranContribuyenteResponse | PersonaJuridicaResponse | null
  type: 'grandes-contribuyentes' | 'personas-juridicas'
  loading: boolean
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'No especificada'
  try {
    // Separar la fecha en partes para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number)
    // Crear fecha en zona horaria local (mes es 0-indexed)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const isGranContribuyenteData = (data: GranContribuyenteResponse | PersonaJuridicaResponse): data is GranContribuyenteResponse => {
  return 'calendarios' in data && data.calendarios.length > 0 && 'fecha_pago_primera_cuota' in data.calendarios[0]
}

export function TaxCalendarModal({ isOpen, onClose, data, type, loading }: TaxCalendarModalProps) {
  if (!isOpen) return null

  const title = type === 'grandes-contribuyentes'
    ? 'Calendario Completo - Grandes Contribuyentes'
    : 'Calendario Completo - Personas Jurídicas'

  const icon = type === 'grandes-contribuyentes' ? Building : Users

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              type === 'grandes-contribuyentes'
                ? "bg-brand-indigo/10"
                : "bg-brand-indigo/10"
            )}>
              {icon === Building ? (
                <Building className={cn(
                  "h-5 w-5",
                  type === 'grandes-contribuyentes' ? "text-brand-indigo" : "text-brand-indigo"
                )} />
              ) : (
                <Users className={cn(
                  "h-5 w-5",
                  type === 'grandes-contribuyentes' ? "text-brand-indigo" : "text-brand-indigo"
                )} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-text">{title}</h2>
              {data && (
                <p className="text-sm text-brand-text-secondary">
                  {data.total_registros} registros encontrados
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm bg-success hover:bg-success/90 text-white rounded-lg transition-colors"
              disabled={loading || !data}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </button>
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto mb-4"></div>
                <p className="text-brand-text-secondary">Cargando calendario completo...</p>
              </div>
            </div>
          ) : data ? (
            <div className="h-full overflow-auto">
              <div className="p-6">
                {/* Summary Info */}
                <div className="mb-6 p-4 bg-brand-bg rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-brand-text-secondary">Total de registros:</span>
                      <span className="ml-2 font-semibold">{data.total_registros}</span>
                    </div>
                    {data.filtros_aplicados && (
                      <>
                        <div>
                          <span className="text-brand-text-secondary">Año gravable:</span>
                          <span className="ml-2 font-semibold">{data.filtros_aplicados.ano_gravable}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-secondary">Último dígito NIT:</span>
                          <span className="ml-2 font-semibold">{data.filtros_aplicados.ultimo_digito_nit}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="border border-brand-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-brand-bg">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-brand-text border-r border-brand-border">
                            Último Dígito NIT
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-brand-text border-r border-brand-border">
                            Año Gravable
                          </th>
                          {type === 'grandes-contribuyentes' ? (
                            <>
                              <th className="px-4 py-3 text-left font-medium text-brand-text border-r border-brand-border">
                                Fecha Pago Primera Cuota
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-brand-text border-r border-brand-border">
                                Fecha Declaración Segunda Cuota
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-brand-text">
                                Fecha Pago Tercera Cuota
                              </th>
                            </>
                          ) : (
                            <>
                              <th className="px-4 py-3 text-left font-medium text-brand-text border-r border-brand-border">
                                Fecha Declaración Primera Cuota
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-brand-text">
                                Fecha Pago Segunda Cuota
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-brand-border">
                        {data.calendarios.map((calendar, index) => (
                          <tr key={index} className="hover:bg-brand-bg">
                            <td className="px-4 py-3 border-r border-brand-border font-medium">
                              {calendar.ultimo_digito_nit}
                            </td>
                            <td className="px-4 py-3 border-r border-brand-border">
                              {calendar.ano_gravable}
                            </td>
                            {isGranContribuyenteData(data) ? (
                              <>
                                <td className="px-4 py-3 border-r border-brand-border">
                                  {formatDate((calendar as GranContribuyenteCalendar).fecha_pago_primera_cuota)}
                                </td>
                                <td className="px-4 py-3 border-r border-brand-border">
                                  {formatDate((calendar as GranContribuyenteCalendar).fecha_declaracion_segunda_cuota)}
                                </td>
                                <td className="px-4 py-3">
                                  {formatDate((calendar as GranContribuyenteCalendar).fecha_pago_tercera_cuota)}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 border-r border-brand-border">
                                  {formatDate((calendar as PersonaJuridicaCalendar).fecha_declaracion_primera_cuota)}
                                </td>
                                <td className="px-4 py-3">
                                  {formatDate((calendar as PersonaJuridicaCalendar).fecha_pago_segunda_cuota)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {data.calendarios.length === 0 && (
                  <div className="text-center py-12 text-brand-text-secondary">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron registros en el calendario</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-brand-text-secondary">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Error al cargar el calendario</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}