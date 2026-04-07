"use client"

import { X, FileText, Building, User, Package, Calculator, Calendar, CreditCard } from "lucide-react"
import { type InvoiceData } from "@/lib/api/invoice-service"

interface InvoiceDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  data: InvoiceData | null
}

export function InvoiceDetailsModal({ isOpen, onClose, data }: InvoiceDetailsModalProps) {
  if (!isOpen || !data) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('es-CO')
    } catch {
      return dateString
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-brand-border max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-indigo/10 rounded-full">
              <FileText className="h-6 w-6 text-brand-indigo" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-text">
                Factura {data.numero_factura}
              </h3>
              <p className="text-sm text-brand-text-secondary">
                {data.tipo_documento} • {formatDate(data.fecha_emision)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="space-y-8">
            {/* Basic Information */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-brand-indigo" />
                <h4 className="text-lg font-medium text-brand-text">Información General</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">CUFE</p>
                  <p className="text-sm font-mono break-all">{data.cufe || 'N/A'}</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Fecha Vencimiento</p>
                  <p className="text-sm">{formatDate(data.fecha_vencimiento)}</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Validación DIAN</p>
                  <p className="text-sm">{formatDate(data.fecha_validacion_dian)}</p>
                </div>
              </div>
            </section>

            {/* Emisor */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-success" />
                <h4 className="text-lg font-medium text-brand-text">Emisor</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 bg-success-bg rounded-lg border border-success-bg">
                    <p className="text-sm text-brand-text-secondary mb-1">Razón Social</p>
                    <p className="font-medium">{data.emisor_razon_social}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">NIT</p>
                    <p className="font-mono">{data.emisor_nit}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Dirección</p>
                    <p className="text-sm">{data.emisor_direccion}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Ciudad</p>
                    <p className="text-sm">{data.emisor_ciudad}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Teléfono</p>
                    <p className="text-sm">{data.emisor_telefono || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Email</p>
                    <p className="text-sm">{data.emisor_email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Receptor */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-brand-indigo" />
                <h4 className="text-lg font-medium text-brand-text">Receptor</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20">
                    <p className="text-sm text-brand-text-secondary mb-1">Razón Social</p>
                    <p className="font-medium">{data.receptor_razon_social}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">NIT</p>
                    <p className="font-mono">{data.receptor_nit}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Dirección</p>
                    <p className="text-sm">{data.receptor_direccion}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Ciudad</p>
                    <p className="text-sm">{data.receptor_ciudad}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Teléfono</p>
                    <p className="text-sm">{data.receptor_telefono || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Contacto</p>
                    <p className="text-sm">{data.contacto || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Commercial Info */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-warning" />
                <h4 className="text-lg font-medium text-brand-text">Información Comercial</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Asesor Comercial</p>
                  <p className="text-sm">{data.asesor_comercial || 'N/A'}</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Zona</p>
                  <p className="text-sm">{data.zona || 'N/A'}</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Orden de Compra</p>
                  <p className="text-sm">{data.orden_compra || 'N/A'}</p>
                </div>
              </div>
            </section>

            {/* Items */}
            {data.items && data.items.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-brand-indigo" />
                  <h4 className="text-lg font-medium text-brand-text">
                    Items ({data.items.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-brand-border rounded-lg overflow-hidden">
                    <thead className="bg-brand-bg">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Descripción</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Cantidad</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase">Valor Unit.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase">IVA %</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {data.items.map((item, index) => (
                        <tr key={index} className="hover:bg-brand-bg-alt">
                          <td className="px-4 py-3 text-sm font-mono">{item.codigo}</td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium">{item.descripcion}</p>
                              {item.referencia && (
                                <p className="text-xs text-brand-text-secondary">Ref: {item.referencia}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {item.cantidad} {item.unidad_empaque}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono">
                            {formatCurrency(item.valor_unitario)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {item.porcentaje_iva}%
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                            {formatCurrency(item.valor_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Totals */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-success" />
                <h4 className="text-lg font-medium text-brand-text">Totales</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Subtotal</p>
                  <p className="text-lg font-medium">{formatCurrency(data.subtotal)}</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Valor Gravado</p>
                  <p className="text-lg font-medium">{formatCurrency(data.valor_gravado)}</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Total IVA</p>
                  <p className="text-lg font-medium text-warning">{formatCurrency(data.total_iva)}</p>
                </div>
                <div className="p-4 bg-success-bg rounded-lg border border-success-bg">
                  <p className="text-sm text-brand-text-secondary mb-1">Total Factura</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(data.valor_total)}</p>
                </div>
              </div>

              {(data.retencion_fuente > 0 || data.retencion_ica > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-error-bg rounded-lg border border-error-bg">
                    <p className="text-sm text-brand-text-secondary mb-1">Retención Fuente</p>
                    <p className="text-lg font-medium text-error">{formatCurrency(data.retencion_fuente)}</p>
                  </div>
                  <div className="p-4 bg-error-bg rounded-lg border border-error-bg">
                    <p className="text-sm text-brand-text-secondary mb-1">Retención ICA</p>
                    <p className="text-lg font-medium text-error">{formatCurrency(data.retencion_ica)}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Payment Info */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-brand-indigo" />
                <h4 className="text-lg font-medium text-brand-text">Forma de Pago</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Forma de Pago</p>
                  <p className="text-sm">{data.forma_pago || 'N/A'}</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Medio de Pago</p>
                  <p className="text-sm">{data.medio_pago || 'N/A'}</p>
                </div>
                <div className="p-4 bg-brand-bg rounded-lg">
                  <p className="text-sm text-brand-text-secondary mb-1">Términos de Pago</p>
                  <p className="text-sm">{data.terminos_pago || 'N/A'}</p>
                </div>
              </div>
            </section>

            {/* Additional Info */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-brand-text-secondary" />
                <h4 className="text-lg font-medium text-brand-text">Información Adicional</h4>
              </div>
              <div className="space-y-4">
                {data.observaciones && (
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-2">Observaciones</p>
                    <p className="text-sm whitespace-pre-line">{data.observaciones}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Autorización DIAN</p>
                    <p className="text-sm font-mono">{data.autorizacion_dian || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-brand-bg rounded-lg">
                    <p className="text-sm text-brand-text-secondary mb-1">Rango Numeración</p>
                    <p className="text-sm">{data.rango_numeracion || 'N/A'}</p>
                  </div>
                </div>
                {data.extraction_timestamp && (
                  <div className="p-4 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20">
                    <p className="text-sm text-brand-text-secondary mb-1">Procesado el</p>
                    <p className="text-sm">{formatDate(data.extraction_timestamp)}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}