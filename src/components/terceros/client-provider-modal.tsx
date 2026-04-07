"use client"

import { useState, useEffect } from "react"
import { X, Building, Loader2, ChevronDown, User, Users } from "lucide-react"
import { ClientProvider } from "@/lib/api/client-provider-service"

interface ClientProviderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  entityType: 'CLIENTE' | 'PROVEEDOR'
  onEntityTypeChange: (type: 'CLIENTE' | 'PROVEEDOR') => void
  clientProviders: ClientProvider[]
  selectedClientProvider: ClientProvider | null
  onSelectClientProvider: (provider: ClientProvider | null) => void
  isLoading: boolean
}

export function ClientProviderModal({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  onEntityTypeChange,
  clientProviders,
  selectedClientProvider,
  onSelectClientProvider,
  isLoading
}: ClientProviderModalProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (isOpen) {
      onEntityTypeChange(entityType)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleEntityTypeChange = (type: 'CLIENTE' | 'PROVEEDOR') => {
    onEntityTypeChange(type)
    onSelectClientProvider(null)
    setShowDropdown(false)
  }

  const handleSelectProvider = (provider: ClientProvider) => {
    onSelectClientProvider(provider)
    setShowDropdown(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-brand-border p-6 max-w-lg w-full mx-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-indigo/10 rounded-full">
                <Building className="h-6 w-6 text-brand-indigo" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                Crear Cliente/Proveedor
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Entity Type Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-brand-text">
              Tipo de Entidad
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleEntityTypeChange('CLIENTE')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  entityType === 'CLIENTE'
                    ? 'border-brand-indigo bg-brand-indigo/5 text-brand-indigo'
                    : 'border-brand-border hover:border-brand-indigo/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Cliente</span>
                </div>
              </button>
              <button
                onClick={() => handleEntityTypeChange('PROVEEDOR')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  entityType === 'PROVEEDOR'
                    ? 'border-brand-indigo bg-brand-indigo/5 text-brand-indigo'
                    : 'border-brand-border hover:border-brand-indigo/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Proveedor</span>
                </div>
              </button>
            </div>
          </div>

          {/* Client/Provider Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-brand-text">
              Seleccionar {entityType === 'CLIENTE' ? 'Cliente' : 'Proveedor'}
            </label>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isLoading || clientProviders.length === 0}
                className="w-full p-3 text-left border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-brand-text-secondary">Cargando...</span>
                      </div>
                    ) : selectedClientProvider ? (
                      <div>
                        <p className="font-medium truncate">{selectedClientProvider.nombre_comercial}</p>
                        <p className="text-sm text-brand-text-secondary truncate">
                          {selectedClientProvider.codigo_interno} • {selectedClientProvider.categoria}
                        </p>
                      </div>
                    ) : (
                      <span className="text-brand-text-secondary">
                        {clientProviders.length === 0
                          ? `No hay ${entityType.toLowerCase()}s disponibles`
                          : `Selecciona un ${entityType.toLowerCase()}`
                        }
                      </span>
                    )}
                  </div>
                  {!isLoading && clientProviders.length > 0 && (
                    <ChevronDown className={`h-4 w-4 text-brand-text-secondary transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </button>

              {/* Dropdown */}
              {showDropdown && clientProviders.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-brand-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {clientProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleSelectProvider(provider)}
                      className="w-full p-3 text-left hover:bg-brand-bg-alt transition-colors border-b border-brand-border last:border-b-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-brand-text">{provider.nombre_comercial}</p>
                        <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                          <span>{provider.codigo_interno}</span>
                          <span>{provider.categoria}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            provider.estado === 'ACTIVO'
                              ? 'bg-success-bg text-success-foreground'
                              : 'bg-error-bg text-error-foreground'
                          }`}>
                            {provider.estado}
                          </span>
                        </div>
                        {provider.razon_social_principal && (
                          <p className="text-sm text-brand-text-secondary truncate">
                            {provider.razon_social_principal}
                          </p>
                        )}
                        <p className="text-xs text-brand-text-secondary">
                          Registrado: {formatDate(provider.fecha_registro)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Provider Details */}
          {selectedClientProvider && (
            <div className="p-4 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20">
              <h4 className="font-medium text-brand-indigo mb-2">
                {entityType === 'CLIENTE' ? 'Cliente' : 'Proveedor'} Seleccionado
              </h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-brand-text-secondary">Nombre:</span>
                    <p className="font-medium">{selectedClientProvider.nombre_comercial}</p>
                  </div>
                  <div>
                    <span className="text-brand-text-secondary">Código:</span>
                    <p className="font-medium">{selectedClientProvider.codigo_interno}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-brand-text-secondary">Categoría:</span>
                    <p className="font-medium">{selectedClientProvider.categoria}</p>
                  </div>
                  <div>
                    <span className="text-brand-text-secondary">Estado:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedClientProvider.estado === 'ACTIVO'
                        ? 'bg-success-bg text-success-foreground'
                        : 'bg-error-bg text-error-foreground'
                    }`}>
                      {selectedClientProvider.estado}
                    </span>
                  </div>
                </div>
                {selectedClientProvider.razon_social_principal && (
                  <div>
                    <span className="text-brand-text-secondary">Razón Social:</span>
                    <p className="font-medium">{selectedClientProvider.razon_social_principal}</p>
                  </div>
                )}
                <div>
                  <span className="text-brand-text-secondary">RUTs registrados:</span>
                  <p className="font-medium">{selectedClientProvider.total_ruts}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-brand-text border border-brand-border rounded-lg hover:bg-brand-bg-alt transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedClientProvider}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-indigo hover:bg-brand-indigo/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear {entityType === 'CLIENTE' ? 'Cliente' : 'Proveedor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}