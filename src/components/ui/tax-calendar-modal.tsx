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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[95vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              type === 'grandes-contribuyentes'
                ? "bg-purple-100 dark:bg-purple-900/20"
                : "bg-blue-100 dark:bg-blue-900/20"
            )}>
              {icon === Building ? (
                <Building className={cn(
                  "h-5 w-5",
                  type === 'grandes-contribuyentes' ? "text-purple-600" : "text-blue-600"
                )} />
              ) : (
                <Users className={cn(
                  "h-5 w-5",
                  type === 'grandes-contribuyentes' ? "text-purple-600" : "text-blue-600"
                )} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              {data && (
                <p className="text-sm text-muted-foreground">
                  {data.total_registros} registros encontrados
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              disabled={loading || !data}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando calendario completo...</p>
              </div>
            </div>
          ) : data ? (
            <div className="h-full overflow-auto">
              <div className="p-6">
                {/* Summary Info */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total de registros:</span>
                      <span className="ml-2 font-semibold">{data.total_registros}</span>
                    </div>
                    {data.filtros_aplicados && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Año gravable:</span>
                          <span className="ml-2 font-semibold">{data.filtros_aplicados.ano_gravable}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Último dígito NIT:</span>
                          <span className="ml-2 font-semibold">{data.filtros_aplicados.ultimo_digito_nit}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                            Último Dígito NIT
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                            Año Gravable
                          </th>
                          {type === 'grandes-contribuyentes' ? (
                            <>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                Fecha Pago Primera Cuota
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                Fecha Declaración Segunda Cuota
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">
                                Fecha Pago Tercera Cuota
                              </th>
                            </>
                          ) : (
                            <>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                Fecha Declaración Primera Cuota
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">
                                Fecha Pago Segunda Cuota
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.calendarios.map((calendar, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700 font-medium">
                              {calendar.ultimo_digito_nit}
                            </td>
                            <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                              {calendar.ano_gravable}
                            </td>
                            {isGranContribuyenteData(data) ? (
                              <>
                                <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                                  {formatDate((calendar as GranContribuyenteCalendar).fecha_pago_primera_cuota)}
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                                  {formatDate((calendar as GranContribuyenteCalendar).fecha_declaracion_segunda_cuota)}
                                </td>
                                <td className="px-4 py-3">
                                  {formatDate((calendar as GranContribuyenteCalendar).fecha_pago_tercera_cuota)}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
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
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron registros en el calendario</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
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