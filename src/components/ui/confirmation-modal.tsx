"use client"

import { AlertTriangle, CheckCircle, XCircle, X } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'success' | 'error' | 'info'
  isLoading?: boolean
  children?: React.ReactNode
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = 'warning',
  isLoading = false,
  children
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-success',
          iconBg: 'bg-success-bg',
          confirmBg: 'bg-success hover:bg-success/90',
          borderColor: 'border-success-bg'
        }
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-error',
          iconBg: 'bg-error-bg',
          confirmBg: 'bg-error hover:bg-error/90',
          borderColor: 'border-error-bg'
        }
      case 'info':
        return {
          icon: CheckCircle,
          iconColor: 'text-brand-indigo',
          iconBg: 'bg-brand-indigo/10',
          confirmBg: 'bg-brand-indigo hover:bg-brand-indigo-hover',
          borderColor: 'border-brand-indigo/20'
        }
      default: // warning
        return {
          icon: AlertTriangle,
          iconColor: 'text-warning',
          iconBg: 'bg-warning-bg',
          confirmBg: 'bg-warning hover:bg-warning/90',
          borderColor: 'border-warning-bg'
        }
    }
  }

  const config = getTypeConfig()
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-brand-border p-6 max-w-md w-full mx-4 transform transition-all">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${config.iconBg}`}>
                <Icon className={`h-6 w-6 ${config.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                {title}
              </h3>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="text-brand-text-secondary hover:text-brand-text"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Message */}
          <div className={`p-4 rounded-lg border ${config.borderColor} ${config.iconBg}/30`}>
            <p className="text-sm text-brand-text whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Children content */}
          {children}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-lg hover:bg-brand-bg-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBg}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}