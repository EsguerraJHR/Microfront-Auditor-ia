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
  if (isNaN(value)) return <Minus className="h-5 w-5 text-gray-500" />
  if (value > 0) return <TrendingUp className="h-5 w-5 text-green-600" />
  if (value < 0) return <TrendingDown className="h-5 w-5 text-red-600" />
  return <Minus className="h-5 w-5 text-gray-500" />
}

const getChangeColor = (cambio: string) => {
  const value = parseFloat(cambio)
  if (isNaN(value)) return 'text-gray-600'
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-600'
}

const getChangeBgColor = (cambio: string) => {
  const value = parseFloat(cambio)
  if (isNaN(value)) return 'bg-gray-50 dark:bg-gray-800'
  if (value > 0) return 'bg-green-50 dark:bg-green-900/20'
  if (value < 0) return 'bg-red-50 dark:bg-red-900/20'
  return 'bg-gray-50 dark:bg-gray-800'
}

const getImpactIcon = (interpretacion: string) => {
  const lowerInterpretacion = interpretacion.toLowerCase()

  if (lowerInterpretacion.includes('mejora') || lowerInterpretacion.includes('positivo')) {
    return <CheckCircle className="h-5 w-5 text-green-600" />
  }

  if (lowerInterpretacion.includes('deterioro') || lowerInterpretacion.includes('negativo') || lowerInterpretacion.includes('preocupante')) {
    return <AlertTriangle className="h-5 w-5 text-red-600" />
  }

  return <Minus className="h-5 w-5 text-gray-500" />
}

const getImpactColor = (interpretacion: string) => {
  const lowerInterpretacion = interpretacion.toLowerCase()

  if (lowerInterpretacion.includes('mejora') || lowerInterpretacion.includes('positivo')) {
    return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
  }

  if (lowerInterpretacion.includes('deterioro') || lowerInterpretacion.includes('negativo') || lowerInterpretacion.includes('preocupante')) {
    return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20'
  }

  return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800'
}

export const StructureComparisonView: React.FC<StructureComparisonViewProps> = ({ comparison }) => {
  if (!comparison || comparison.total_cambios_identificados === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              🔄 Cambios Estructurales
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {comparison?.criterio_significancia || 'No se identificaron cambios significativos'}
            </p>
          </div>
        </div>

        <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-800 dark:text-green-200 font-medium">
            No se detectaron cambios estructurales significativos
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            La estructura financiera se mantiene estable entre períodos
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100">
                🔄 Cambios Estructurales Significativos
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {comparison.criterio_significancia}
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <span className="text-orange-800 dark:text-orange-200 font-bold text-lg">
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
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Campo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Línea
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Año Anterior
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Año Actual
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Cambio
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Interpretación
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.cambios_significativos.map((change, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                    getChangeBgColor(change.cambio_puntos_porcentuales)
                  )}
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {change.campo}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                      {change.linea}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {change.porcentaje_anterior}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
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
                "p-4 rounded-lg border border-gray-200 dark:border-gray-700",
                getChangeBgColor(change.cambio_puntos_porcentuales)
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {change.campo}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Año Anterior</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {change.porcentaje_anterior}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Año Actual</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
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
