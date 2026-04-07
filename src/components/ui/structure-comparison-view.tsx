"use client"

import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Minus } from 'lucide-react'
import { StructureComparison, StructureChange } from '@/lib/api/comparative-analysis-service'
import { cn } from '@/lib/utils'

interface StructureComparisonViewProps {
  comparison: StructureComparison
}

const getChangeIcon = (cambio: string) => {
  const value = parseFloat(cambio)
  if (isNaN(value)) return <Minus className="h-5 w-5 text-brand-text-secondary" />
  if (value > 0) return <TrendingUp className="h-5 w-5 text-success" />
  if (value < 0) return <TrendingDown className="h-5 w-5 text-error" />
  return <Minus className="h-5 w-5 text-brand-text-secondary" />
}

const getChangeColor = (cambio: string) => {
  const value = parseFloat(cambio)
  if (isNaN(value)) return 'text-brand-text-secondary'
  if (value > 0) return 'text-success'
  if (value < 0) return 'text-error'
  return 'text-brand-text-secondary'
}

const getChangeBgColor = (cambio: string) => {
  const value = parseFloat(cambio)
  if (isNaN(value)) return 'bg-brand-bg'
  if (value > 0) return 'bg-success-bg'
  if (value < 0) return 'bg-error-bg'
  return 'bg-brand-bg'
}

const getImpactIcon = (interpretacion: string) => {
  const lowerInterpretacion = interpretacion.toLowerCase()

  if (lowerInterpretacion.includes('mejora') || lowerInterpretacion.includes('positivo')) {
    return <CheckCircle className="h-5 w-5 text-success" />
  }

  if (lowerInterpretacion.includes('deterioro') || lowerInterpretacion.includes('negativo') || lowerInterpretacion.includes('preocupante')) {
    return <AlertTriangle className="h-5 w-5 text-error" />
  }

  return <Minus className="h-5 w-5 text-brand-text-secondary" />
}

const getImpactColor = (interpretacion: string) => {
  const lowerInterpretacion = interpretacion.toLowerCase()

  if (lowerInterpretacion.includes('mejora') || lowerInterpretacion.includes('positivo')) {
    return 'text-success-foreground bg-success-bg'
  }

  if (lowerInterpretacion.includes('deterioro') || lowerInterpretacion.includes('negativo') || lowerInterpretacion.includes('preocupante')) {
    return 'text-error-foreground bg-error-bg'
  }

  return 'text-brand-text bg-brand-bg'
}

export const StructureComparisonView: React.FC<StructureComparisonViewProps> = ({ comparison }) => {
  if (!comparison || comparison.total_cambios_identificados === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-brand-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-success-bg rounded-full">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-text">
              🔄 Cambios Estructurales
            </h3>
            <p className="text-sm text-brand-text-secondary">
              {comparison?.criterio_significancia || 'No se identificaron cambios significativos'}
            </p>
          </div>
        </div>

        <div className="p-6 bg-success-bg border border-success-bg rounded-lg text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
          <p className="text-success-foreground font-medium">
            No se detectaron cambios estructurales significativos
          </p>
          <p className="text-sm text-success-foreground mt-2">
            La estructura financiera se mantiene estable entre períodos
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-brand-border overflow-hidden">
      {/* Header */}
      <div className="bg-error-bg px-6 py-4 border-b border-brand-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-bg rounded-full">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-warning-foreground">
                🔄 Cambios Estructurales Significativos
              </h3>
              <p className="text-sm text-warning-foreground">
                {comparison.criterio_significancia}
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-warning-bg rounded-full">
            <span className="text-warning-foreground font-bold text-lg">
              {comparison.total_cambios_identificados}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-text">
                  Campo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-text">
                  Línea
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-brand-text">
                  Año Anterior
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-brand-text">
                  Año Actual
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-brand-text">
                  Cambio
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-brand-text">
                  Interpretación
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.cambios_significativos.map((change, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    getChangeBgColor(change.cambio_puntos_porcentuales)
                  )}
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-brand-text">
                      {change.campo}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-brand-bg-alt rounded text-xs font-mono">
                      {change.linea}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-brand-text">
                      {change.porcentaje_anterior}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-brand-text">
                      {change.porcentaje_actual}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {getChangeIcon(change.cambio_puntos_porcentuales)}
                      <span className={cn("font-bold", getChangeColor(change.cambio_puntos_porcentuales))}>
                        {change.cambio_puntos_porcentuales}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className={cn("flex items-start gap-2 p-2 rounded-lg", getImpactColor(change.interpretacion))}>
                      {getImpactIcon(change.interpretacion)}
                      <span className="text-sm">
                        {change.interpretacion}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {comparison.cambios_significativos.map((change, idx) => (
            <div
              key={idx}
              className={cn(
                "p-4 rounded-lg border border-brand-border",
                getChangeBgColor(change.cambio_puntos_porcentuales)
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-brand-text">
                    {change.campo}
                  </h4>
                  <span className="text-xs text-brand-text-secondary">
                    Línea {change.linea}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getChangeIcon(change.cambio_puntos_porcentuales)}
                  <span className={cn("font-bold text-lg", getChangeColor(change.cambio_puntos_porcentuales))}>
                    {change.cambio_puntos_porcentuales}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-brand-text-secondary">Año Anterior</p>
                  <p className="font-semibold text-brand-text">
                    {change.porcentaje_anterior}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-brand-text-secondary">Año Actual</p>
                  <p className="font-semibold text-brand-text">
                    {change.porcentaje_actual}
                  </p>
                </div>
              </div>

              <div className={cn("flex items-start gap-2 p-3 rounded-lg", getImpactColor(change.interpretacion))}>
                {getImpactIcon(change.interpretacion)}
                <p className="text-sm flex-1">
                  {change.interpretacion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
