"use client"

import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  autoClose?: boolean
  autoCloseDelay?: number
}

export function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  autoClose = false,
  autoCloseDelay = 3000
}: NotificationModalProps) {
  // Auto close functionality
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-success',
          iconBg: 'bg-success-bg',
          borderColor: 'border-success-bg',
          bgColor: 'bg-success-bg'
        }
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-error',
          iconBg: 'bg-error-bg',
          borderColor: 'border-error-bg',
          bgColor: 'bg-error-bg'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-warning',
          iconBg: 'bg-warning-bg',
          borderColor: 'border-warning-bg',
          bgColor: 'bg-warning-bg'
        }
      default: // info
        return {
          icon: Info,
          iconColor: 'text-brand-indigo',
          iconBg: 'bg-brand-indigo/10',
          borderColor: 'border-brand-indigo/20',
          bgColor: 'bg-brand-indigo/5'
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
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-brand-border p-6 max-w-md w-full mx-4 transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="space-y-4">
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
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message */}
          <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
            <p className="text-sm text-brand-text leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-indigo hover:bg-brand-indigo-hover rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>

          {/* Auto close progress bar */}
          {autoClose && (
            <div className="w-full bg-brand-bg-alt rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-brand-indigo rounded-full transition-all ease-linear"
                style={{
                  animation: `shrink ${autoCloseDelay}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

