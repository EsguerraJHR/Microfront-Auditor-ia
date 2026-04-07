"use client"

import { Loader2, Upload, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  isVisible: boolean
  title?: string
  message?: string
  progress?: number
  filesCount?: number
  children?: React.ReactNode
}

export function LoadingOverlay({
  isVisible,
  title = "Procesando archivos...",
  message = "Por favor espera mientras extraemos los datos de RUT",
  progress,
  filesCount,
  children
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-brand-border p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          {/* Icon and Animation */}
          <div className="relative">
            <div className="mx-auto h-16 w-16 bg-brand-indigo/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-brand-indigo animate-spin" />
            </div>

            {/* Floating icons animation */}
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-success-bg rounded-full flex items-center justify-center animate-bounce delay-75">
              <FileText className="h-3 w-3 text-success" />
            </div>
            <div className="absolute -bottom-2 -left-2 h-6 w-6 bg-brand-indigo/10 rounded-full flex items-center justify-center animate-bounce delay-150">
              <Upload className="h-3 w-3 text-brand-indigo" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brand-text">
              {title}
            </h3>
            <p className="text-sm text-brand-text-secondary">
              {message}
            </p>
          </div>

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-brand-text-secondary">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-brand-bg-alt rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-brand-navy to-brand-indigo rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Files Count */}
          {filesCount !== undefined && (
            <div className="flex items-center justify-center gap-2 text-sm text-brand-text-secondary">
              <FileText className="h-4 w-4" />
              <span>Procesando {filesCount} archivo{filesCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Custom content */}
          {children}

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-2 text-xs text-brand-text-secondary">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 bg-success rounded-full" />
              <span>Extrayendo datos</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 bg-brand-indigo rounded-full" />
              <span>Validando información</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-brand-indigo/5 border border-brand-indigo/20 rounded-lg p-3">
            <p className="text-xs text-brand-indigo">
              ⚠️ No cierres esta ventana hasta que termine el procesamiento
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ProcessingStepsProps {
  currentStep: number
  steps: string[]
}

export function ProcessingSteps({ currentStep, steps }: ProcessingStepsProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-brand-text">Pasos del proceso:</h4>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className={cn(
              "h-2 w-2 rounded-full flex-shrink-0",
              index < currentStep ? "bg-success" :
              index === currentStep ? "bg-brand-indigo" :
              "bg-brand-bg-alt"
            )} />
            <span className={cn(
              index <= currentStep ? "text-brand-text" : "text-brand-text-secondary"
            )}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}