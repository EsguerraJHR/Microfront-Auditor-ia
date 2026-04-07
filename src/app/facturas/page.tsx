"use client"

import { useState } from "react"
import { Receipt, DollarSign, Clock, CheckCircle, AlertTriangle, Filter, Download, Upload, Search } from "lucide-react"
import { motion } from "framer-motion"
import { animations } from "@/lib/design-tokens"
import { InvoiceUploadModal } from "@/components/invoices/invoice-upload-modal"
import { InvoiceDetailsModal } from "@/components/invoices/invoice-details-modal"
import { type InvoiceData } from "@/lib/api/invoice-service"

export default function FacturasPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const facturas = [
    {
      id: "FAC-2024-001",
      number: "FV-001234",
      supplier: "Constructora ABC S.A.S.",
      client: "Empresa Cliente XYZ",
      amount: 2450000,
      status: "approved",
      issueDate: "2024-01-15",
      dueDate: "2024-02-14",
      type: "Venta",
      tax: 465500,
      category: "Servicios"
    },
    {
      id: "FAC-2024-002",
      number: "FC-005678",
      supplier: "Servicios Logisticos XYZ",
      client: "Nuestra Empresa",
      amount: 890000,
      status: "pending",
      issueDate: "2024-01-14",
      dueDate: "2024-02-13",
      type: "Compra",
      tax: 169100,
      category: "Logistica"
    },
    {
      id: "FAC-2024-003",
      number: "FV-001235",
      supplier: "Nuestra Empresa",
      client: "Cliente Corporativo DEF",
      amount: 5670000,
      status: "approved",
      issueDate: "2024-01-13",
      dueDate: "2024-02-12",
      type: "Venta",
      tax: 1077300,
      category: "Consultoria"
    },
    {
      id: "FAC-2024-004",
      number: "FC-005679",
      supplier: "Transportes Rapidos GHI",
      client: "Nuestra Empresa",
      amount: 340000,
      status: "rejected",
      issueDate: "2024-01-12",
      dueDate: "2024-02-11",
      type: "Compra",
      tax: 64600,
      category: "Transporte"
    },
    {
      id: "FAC-2024-005",
      number: "FV-001236",
      supplier: "Nuestra Empresa",
      client: "Nuevo Cliente MNO",
      amount: 1250000,
      status: "in_review",
      issueDate: "2024-01-11",
      dueDate: "2024-02-10",
      type: "Venta",
      tax: 237500,
      category: "Productos"
    }
  ]

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return { label: "Aprobada", class: "status-valid", icon: CheckCircle }
      case "pending":
        return { label: "Pendiente", class: "status-pending", icon: Clock }
      case "in_review":
        return { label: "En Revision", class: "status-warning", icon: Receipt }
      case "rejected":
        return { label: "Rechazada", class: "status-error", icon: AlertTriangle }
      default:
        return { label: "Desconocido", class: "status-pending", icon: Clock }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleUploadSuccess = (data: InvoiceData) => {
    setInvoiceData(data)
    setShowDetailsModal(true)
  }

  const totalFacturas = facturas.length
  const totalAmount = facturas.reduce((sum, factura) => sum + factura.amount, 0)
  const approvedAmount = facturas
    .filter(f => f.status === 'approved')
    .reduce((sum, factura) => sum + factura.amount, 0)
  const pendingCount = facturas.filter(f => f.status === 'pending').length

  return (
    <motion.div className="space-y-6" {...animations.pageTransition}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
          Control de Facturas
        </h1>
        <p className="text-sm text-brand-text-secondary max-w-3xl">
          Sistema integral para la gestion, validacion y seguimiento de facturas de compra y venta.
          Incluye verificacion automatica, control de impuestos y analisis de cumplimiento fiscal.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Cargar Facturas
          </button>
          <button className="px-4 py-2 border border-brand-border text-brand-text-secondary rounded-md hover:bg-brand-bg-alt transition-colors text-sm font-medium">
            <Filter className="h-4 w-4 inline mr-2" />
            Filtros Avanzados
          </button>
          <button className="px-4 py-2 border border-brand-border text-brand-text-secondary rounded-md hover:bg-brand-bg-alt transition-colors text-sm font-medium">
            <Download className="h-4 w-4 inline mr-2" />
            Exportar
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-text-secondary" />
          <input
            type="text"
            placeholder="Buscar facturas..."
            className="pl-10 pr-4 py-2 border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo text-sm bg-white"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        variants={animations.staggerContainer.variants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="card-base p-6" variants={animations.staggerItem.variants}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-brand-indigo/10 rounded-xl">
              <Receipt className="h-5 w-5 text-brand-indigo" />
            </div>
            <h3 className="font-medium text-sm text-brand-text">Total Facturas</h3>
          </div>
          <p className="text-2xl font-bold text-brand-indigo">{totalFacturas}</p>
          <p className="text-xs text-brand-text-secondary">Este periodo</p>
        </motion.div>

        <motion.div className="card-base p-6" variants={animations.staggerItem.variants}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-brand-indigo/10 rounded-xl">
              <DollarSign className="h-5 w-5 text-brand-indigo" />
            </div>
            <h3 className="font-medium text-sm text-brand-text">Monto Total</h3>
          </div>
          <p className="text-xl font-bold text-brand-navy">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-xs text-brand-text-secondary">Valor bruto</p>
        </motion.div>

        <motion.div className="card-base p-6" variants={animations.staggerItem.variants}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-success-bg rounded-xl">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <h3 className="font-medium text-sm text-brand-text">Aprobadas</h3>
          </div>
          <p className="text-xl font-bold text-brand-navy">
            {formatCurrency(approvedAmount)}
          </p>
          <p className="text-xs text-brand-text-secondary">Procesadas</p>
        </motion.div>

        <motion.div className="card-base p-6" variants={animations.staggerItem.variants}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-warning-bg rounded-xl">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-medium text-sm text-brand-text">Pendientes</h3>
          </div>
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-xs text-brand-text-secondary">Por revisar</p>
        </motion.div>
      </motion.div>

      {/* Facturas Table */}
      <div className="card-base p-6">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Facturas Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Numero</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Tipo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Proveedor/Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Monto</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Impuestos</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Emision</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Vencimiento</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((factura) => {
                const statusConfig = getStatusConfig(factura.status)
                const StatusIcon = statusConfig.icon
                const isOverdue = new Date(factura.dueDate) < new Date() && factura.status === 'pending'

                return (
                  <tr key={factura.id} className="border-b border-brand-border/50 hover:bg-brand-bg-alt transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-brand-text-secondary">{factura.id}</td>
                    <td className="py-3 px-4 font-mono font-medium text-sm text-brand-text">{factura.number}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-md font-medium ${
                        factura.type === 'Venta'
                          ? 'bg-success-bg text-success-foreground'
                          : 'bg-info-bg text-info-foreground'
                      }`}>
                        {factura.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm text-brand-text">
                          {factura.type === 'Venta' ? factura.client : factura.supplier}
                        </p>
                        <p className="text-xs text-brand-text-secondary">{factura.category}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-sm text-brand-text">
                        {formatCurrency(factura.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text-secondary">
                      {formatCurrency(factura.tax)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span className={`px-2 py-1 text-xs rounded-md font-medium ${statusConfig.class}`}>
                          {statusConfig.label}
                        </span>
                        {isOverdue && (
                          <AlertTriangle className="h-3 w-3 text-error" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text-secondary">{factura.issueDate}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={isOverdue ? 'text-error font-medium' : 'text-brand-text-secondary'}>
                        {factura.dueDate}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-brand-indigo hover:text-brand-indigo-hover text-sm font-medium">
                          Ver
                        </button>
                        <button className="text-brand-navy hover:text-brand-indigo text-sm font-medium">
                          Procesar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-base p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Analisis por Tipo</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-sm text-brand-text">Facturas de Venta</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-brand-navy">
                  {formatCurrency(facturas.filter(f => f.type === 'Venta').reduce((sum, f) => sum + f.amount, 0))}
                </p>
                <p className="text-xs text-brand-text-secondary">
                  {facturas.filter(f => f.type === 'Venta').length} facturas
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-info rounded-full"></div>
                <span className="text-sm text-brand-text">Facturas de Compra</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-brand-text-secondary">
                  {formatCurrency(facturas.filter(f => f.type === 'Compra').reduce((sum, f) => sum + f.amount, 0))}
                </p>
                <p className="text-xs text-brand-text-secondary">
                  {facturas.filter(f => f.type === 'Compra').length} facturas
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-base p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Proximos Vencimientos</h3>
          <div className="space-y-3">
            {facturas
              .filter(f => f.status === 'pending')
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 3)
              .map(factura => (
                <div key={factura.id} className="flex items-center justify-between p-3 bg-brand-bg-alt rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-brand-text">{factura.number}</p>
                    <p className="text-xs text-brand-text-secondary">
                      {factura.type === 'Venta' ? factura.client : factura.supplier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-brand-text">{formatCurrency(factura.amount)}</p>
                    <p className="text-xs text-warning">Vence: {factura.dueDate}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <InvoiceUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      <InvoiceDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        data={invoiceData}
      />
    </motion.div>
  )
}
