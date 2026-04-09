"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Hash, Search, Plus, Pencil, Trash2, X, Check, Loader2,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  codigosRinganaService,
  type CodigoRinganaRecord,
  type CreateCodigoRinganaPayload,
} from "@/lib/api/codigos-ringana-service"

type ModalMode = 'create' | 'edit'

const EMPTY_FORM: CreateCodigoRinganaPayload = {
  cod_ringana: 0,
  no_documento: '',
  apellidos: '',
  nombres: '',
  correo: '',
}

export default function CodigosRinganaPage() {
  // List state
  const [records, setRecords] = useState<CodigoRinganaRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const pageSize = 20

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateCodigoRinganaPayload>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadRecords = useCallback(async (p: number, q: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await codigosRinganaService.list(p, pageSize, q)
      setRecords(res.items)
      setTotal(res.total)
      setPages(res.pages)
      setPage(res.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecords(1, '')
  }, [loadRecords])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      loadRecords(1, value)
    }, 400)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pages) return
    loadRecords(newPage, search)
  }

  // Modal handlers
  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModalMode('create')
    setModalError(null)
    setShowModal(true)
  }

  const openEdit = (record: CodigoRinganaRecord) => {
    setForm({
      cod_ringana: record.cod_ringana,
      no_documento: record.no_documento,
      apellidos: record.apellidos,
      nombres: record.nombres,
      correo: record.correo,
    })
    setEditingId(record.id)
    setModalMode('edit')
    setModalError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setModalError(null)
  }

  const handleSave = async () => {
    if (!form.cod_ringana || !form.no_documento || !form.nombres || !form.apellidos) {
      setModalError('Todos los campos son obligatorios excepto correo')
      return
    }

    setIsSaving(true)
    setModalError(null)

    try {
      if (modalMode === 'create') {
        await codigosRinganaService.create(form)
        showNotification('success', 'Registro creado exitosamente')
      } else if (editingId !== null) {
        await codigosRinganaService.update(editingId, form)
        showNotification('success', 'Registro actualizado exitosamente')
      }
      closeModal()
      loadRecords(page, search)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Estas seguro de que deseas eliminar este registro?')) return

    setDeletingId(id)
    try {
      await codigosRinganaService.delete(id)
      showNotification('success', 'Registro eliminado')
      loadRecords(page, search)
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
          notification.type === 'success' ? 'bg-success-bg text-success-foreground' : 'bg-error-bg text-error-foreground'
        )}>
          {notification.type === 'success'
            ? <CheckCircle className="h-4 w-4" />
            : <AlertTriangle className="h-4 w-4" />
          }
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center">
          <Hash className="h-5 w-5 text-brand-indigo" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy">Codigos Ringana</h1>
          <p className="text-sm text-brand-text-secondary">
            Administracion de codigos Ringana para terceros
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, documento, correo..."
            className="w-full pl-10 pr-4 py-2 border border-brand-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
          />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Registro
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-error-bg border border-error-bg rounded-xl text-sm text-error-foreground">
          <AlertTriangle className="h-4 w-4 text-error" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg">
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Cod. Ringana</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">No. Documento</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Apellidos</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Nombres</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Correo</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-brand-text-secondary uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="h-6 w-6 text-brand-indigo animate-spin mx-auto mb-2" />
                    <p className="text-sm text-brand-text-secondary">Cargando registros...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Hash className="h-10 w-10 text-brand-text-secondary mx-auto mb-2" />
                    <p className="text-sm text-brand-text-secondary">
                      {search ? 'No se encontraron resultados' : 'No hay registros'}
                    </p>
                  </td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record.id} className="border-b border-brand-border/50 hover:bg-brand-bg-alt transition-colors">
                    <td className="py-3 px-4 font-mono text-sm font-medium text-brand-indigo">{record.cod_ringana}</td>
                    <td className="py-3 px-4 font-mono text-sm text-brand-text">{record.no_documento}</td>
                    <td className="py-3 px-4 text-sm text-brand-text">{record.apellidos}</td>
                    <td className="py-3 px-4 text-sm text-brand-text">{record.nombres}</td>
                    <td className="py-3 px-4 text-sm text-brand-text-secondary">{record.correo}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(record)}
                          className="p-2 text-brand-indigo hover:bg-brand-indigo/5 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                          className="p-2 text-error hover:bg-error-bg rounded-md transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === record.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
            <p className="text-xs text-brand-text-secondary">
              {total} registros | Pagina {page} de {pages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-brand-bg-alt disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-brand-text" />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                let p: number
                if (pages <= 5) {
                  p = i + 1
                } else if (page <= 3) {
                  p = i + 1
                } else if (page >= pages - 2) {
                  p = pages - 4 + i
                } else {
                  p = page - 2 + i
                }
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={cn(
                      "w-8 h-8 rounded-md text-sm font-medium transition-colors",
                      p === page
                        ? "bg-brand-indigo text-white"
                        : "hover:bg-brand-bg-alt text-brand-text"
                    )}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pages}
                className="p-1.5 rounded-md hover:bg-brand-bg-alt disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-brand-text" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl border border-brand-border shadow-xl w-full max-w-lg mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
              <h2 className="text-lg font-semibold text-brand-text">
                {modalMode === 'create' ? 'Nuevo Codigo Ringana' : 'Editar Codigo Ringana'}
              </h2>
              <button onClick={closeModal} className="p-1 text-brand-text-secondary hover:text-brand-text rounded-md transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-center gap-2 p-3 bg-error-bg rounded-xl text-sm text-error-foreground">
                  <AlertTriangle className="h-4 w-4 text-error" />
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Cod. Ringana</label>
                  <input
                    type="number"
                    value={form.cod_ringana || ''}
                    onChange={e => setForm(f => ({ ...f, cod_ringana: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
                    placeholder="4714351"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">No. Documento</label>
                  <input
                    type="text"
                    value={form.no_documento}
                    onChange={e => setForm(f => ({ ...f, no_documento: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
                    placeholder="1053827172"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={form.apellidos}
                    onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
                    placeholder="RAMIREZ RIOS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Nombres</label>
                  <input
                    type="text"
                    value={form.nombres}
                    onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
                    placeholder="GERALDIN"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-1">Correo electronico</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-brand-border">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-md hover:bg-brand-bg-alt transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {modalMode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
