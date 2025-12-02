"use client"

import React, { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, Info, PieChart, Activity, Shield, CheckCircle, XCircle } from 'lucide-react'
import {
  VerticalAnalysisYear,
  VerticalAnalysisBlock,
  VerticalAnalysisField,
  StructureComparison,
  TaxCoherenceData
} from '@/lib/api/comparative-analysis-service'
import { cn } from '@/lib/utils'

interface VerticalAnalysisViewProps {
  currentYear: VerticalAnalysisYear
  previousYear?: VerticalAnalysisYear
  structureComparison?: StructureComparison
  taxCoherenceCurrent?: TaxCoherenceData
  taxCoherencePrevious?: TaxCoherenceData
}

const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const getPercentageColor = (percentage: number | null): string => {
  if (percentage === null) return 'text-gray-600'
  if (percentage < 10) return 'text-green-600'
  if (percentage < 30) return 'text-yellow-600'
  return 'text-red-600'
}

const getPercentageBgColor = (percentage: number | null): string => {
  if (percentage === null) return 'bg-gray-50 dark:bg-gray-800'
  if (percentage < 10) return 'bg-green-50 dark:bg-green-900/20'
  if (percentage < 30) return 'bg-yellow-50 dark:bg-yellow-900/20'
  return 'bg-red-50 dark:bg-red-900/20'
}

interface AnalysisBlockCardProps {
  block: VerticalAnalysisBlock
  icon: React.ReactNode
  colorClass: string
}

const AnalysisBlockCard: React.FC<AnalysisBlockCardProps> = ({ block, icon, colorClass }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div
        className={cn("px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer", colorClass)}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {block.block_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Base: {block.base_field} - {formatCurrency(block.base_value)}
              </p>
            </div>
          </div>
          <div className="text-gray-500">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          {/* Progress Bars */}
          <div className="space-y-4">
            {block.fields.map((field) => (
              <div key={field.line_number} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 text-xs">
                      Línea {field.line_number}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {field.field_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatCurrency(field.value)}
                    </span>
                    <span className={cn("font-bold min-w-[70px] text-right", getPercentageColor(field.percentage))}>
                      {field.percentage_formatted || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {field.percentage !== null && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        getPercentageBgColor(field.percentage)
                      )}
                      style={{ width: `${Math.min(field.percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Table View for Base = 0 */}
          {block.base_value === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  No se puede calcular análisis vertical (base = 0)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const VerticalAnalysisView: React.FC<VerticalAnalysisViewProps> = ({
  currentYear,
  previousYear,
  structureComparison,
  taxCoherenceCurrent,
  taxCoherencePrevious
}) => {
  const [selectedYear, setSelectedYear] = useState<'current' | 'previous'>('current')
  const displayYear = selectedYear === 'current' ? currentYear : previousYear
  const displayTaxCoherence = selectedYear === 'current' ? taxCoherenceCurrent : taxCoherencePrevious

  if (!displayYear) return null

  return (
    <div className="space-y-6">
      {/* Header with Year Tabs */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <PieChart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Análisis Vertical
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {displayYear.razon_social || displayYear.nit}
              </p>
            </div>
          </div>

          {/* Year Selector */}
          {previousYear && (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedYear('current')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  selectedYear === 'current'
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                )}
              >
                {currentYear.year}
              </button>
              <button
                onClick={() => setSelectedYear('previous')}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all",
                  selectedYear === 'previous'
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                )}
              >
                {previousYear.year}
              </button>
            </div>
          )}
        </div>

        {/* Info Message */}
        <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            El análisis vertical muestra la composición porcentual de cada partida respecto a su base.
            Ayuda a identificar la estructura financiera y evaluar la importancia relativa de cada componente.
          </p>
        </div>
      </div>

      {/* Analysis Blocks */}
      <div className="grid grid-cols-1 gap-6">
        {/* Patrimonio Block */}
        <AnalysisBlockCard
          block={displayYear.patrimonio_block}
          icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
          colorClass="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30"
        />

        {/* Resultados Block */}
        <AnalysisBlockCard
          block={displayYear.resultados_block}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          colorClass="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30"
        />

        {/* Impuestos Block */}
        <AnalysisBlockCard
          block={displayYear.impuestos_block}
          icon={<TrendingDown className="h-5 w-5 text-orange-600" />}
          colorClass="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30"
        />

        {/* Pagos y Saldos Block */}
        <AnalysisBlockCard
          block={displayYear.pagos_saldos_block}
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          colorClass="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30"
        />
      </div>

      {/* Key Insights */}
      {displayYear.key_insights && displayYear.key_insights.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <Info className="h-5 w-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              💡 Insights Clave
            </h3>
          </div>
          <div className="space-y-2">
            {displayYear.key_insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-blue-600 font-bold">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structure Comparison - Cambios Significativos */}
      {structureComparison && structureComparison.cambios_significativos.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <Activity className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                  📊 Cambios Significativos en Estructura
                </h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  {structureComparison.criterio_significancia} • {structureComparison.total_cambios_identificados} cambios detectados
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Campo</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Línea</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">% Anterior</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">% Actual</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Cambio</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Interpretación</th>
                  </tr>
                </thead>
                <tbody>
                  {structureComparison.cambios_significativos.map((change, idx) => {
                    const changeValue = parseFloat(change.cambio_puntos_porcentuales.replace(/[^\d.-]/g, ''))
                    const isPositive = changeValue > 0

                    return (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          {change.campo}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                          {change.linea}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {change.porcentaje_anterior}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {change.porcentaje_actual}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            "font-bold",
                            isPositive ? "text-green-600" : "text-red-600"
                          )}>
                            {change.cambio_puntos_porcentuales}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {change.interpretacion}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tax Coherence Analysis */}
      {displayTaxCoherence && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className={cn(
            "px-6 py-4 border-b border-gray-200 dark:border-gray-700",
            displayTaxCoherence.riesgo_global === 'BAJO' && "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
            displayTaxCoherence.riesgo_global === 'MEDIO' && "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
            displayTaxCoherence.riesgo_global === 'ALTO' && "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
            displayTaxCoherence.riesgo_global === 'CRITICO' && "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  displayTaxCoherence.riesgo_global === 'BAJO' && "bg-green-100 dark:bg-green-900/30",
                  displayTaxCoherence.riesgo_global === 'MEDIO' && "bg-yellow-100 dark:bg-yellow-900/30",
                  displayTaxCoherence.riesgo_global === 'ALTO' && "bg-orange-100 dark:bg-orange-900/30",
                  displayTaxCoherence.riesgo_global === 'CRITICO' && "bg-red-100 dark:bg-red-900/30"
                )}>
                  <Shield className={cn(
                    "h-6 w-6",
                    displayTaxCoherence.riesgo_global === 'BAJO' && "text-green-600",
                    displayTaxCoherence.riesgo_global === 'MEDIO' && "text-yellow-600",
                    displayTaxCoherence.riesgo_global === 'ALTO' && "text-orange-600",
                    displayTaxCoherence.riesgo_global === 'CRITICO' && "text-red-600"
                  )} />
                </div>
                <div>
                  <h3 className={cn(
                    "text-xl font-bold",
                    displayTaxCoherence.riesgo_global === 'BAJO' && "text-green-700 dark:text-green-300",
                    displayTaxCoherence.riesgo_global === 'MEDIO' && "text-yellow-700 dark:text-yellow-300",
                    displayTaxCoherence.riesgo_global === 'ALTO' && "text-orange-700 dark:text-orange-300",
                    displayTaxCoherence.riesgo_global === 'CRITICO' && "text-red-700 dark:text-red-300"
                  )}>
                    🛡️ Coherencia Tributaria {displayTaxCoherence.ano_gravable}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    displayTaxCoherence.riesgo_global === 'BAJO' && "text-green-600 dark:text-green-400",
                    displayTaxCoherence.riesgo_global === 'MEDIO' && "text-yellow-600 dark:text-yellow-400",
                    displayTaxCoherence.riesgo_global === 'ALTO' && "text-orange-600 dark:text-orange-400",
                    displayTaxCoherence.riesgo_global === 'CRITICO' && "text-red-600 dark:text-red-400"
                  )}>
                    Riesgo Global: {displayTaxCoherence.riesgo_global}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Resumen Ejecutivo */}
            <div className={cn(
              "p-4 rounded-lg border",
              displayTaxCoherence.riesgo_global === 'BAJO' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
              displayTaxCoherence.riesgo_global === 'MEDIO' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
              displayTaxCoherence.riesgo_global === 'ALTO' && "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
              displayTaxCoherence.riesgo_global === 'CRITICO' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            )}>
              <p className={cn(
                "text-sm font-medium",
                displayTaxCoherence.riesgo_global === 'BAJO' && "text-green-800 dark:text-green-200",
                displayTaxCoherence.riesgo_global === 'MEDIO' && "text-yellow-800 dark:text-yellow-200",
                displayTaxCoherence.riesgo_global === 'ALTO' && "text-orange-800 dark:text-orange-200",
                displayTaxCoherence.riesgo_global === 'CRITICO' && "text-red-800 dark:text-red-200"
              )}>
                {displayTaxCoherence.resumen_ejecutivo}
              </p>
            </div>

            {/* Evaluaciones */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Evaluaciones de Índices</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayTaxCoherence.evaluaciones.map((evaluation, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-lg border",
                      evaluation.nivel_riesgo === 'BAJO' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                      evaluation.nivel_riesgo === 'MEDIO' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
                      evaluation.nivel_riesgo === 'ALTO' && "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
                      evaluation.nivel_riesgo === 'CRITICO' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{evaluation.icono}</span>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {evaluation.indice}
                        </h5>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Contribuyente:</span> {evaluation.valor_contribuyente}
                          </p>
                          {evaluation.valor_sector && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Sector:</span> {evaluation.valor_sector}
                            </p>
                          )}
                          {evaluation.diferencia && (
                            <p className={cn(
                              "font-semibold",
                              evaluation.nivel_riesgo === 'BAJO' && "text-green-700",
                              evaluation.nivel_riesgo === 'MEDIO' && "text-yellow-700",
                              evaluation.nivel_riesgo === 'ALTO' && "text-orange-700",
                              evaluation.nivel_riesgo === 'CRITICO' && "text-red-700"
                            )}>
                              <span className="font-medium">Diferencia:</span> {evaluation.diferencia}
                            </p>
                          )}
                          <p className="text-gray-600 dark:text-gray-400 italic">
                            {evaluation.explicacion}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendaciones */}
            {displayTaxCoherence.recomendaciones && displayTaxCoherence.recomendaciones.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">📋 Recomendaciones</h4>
                <div className="space-y-2">
                  {displayTaxCoherence.recomendaciones.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-900 dark:text-blue-100">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
