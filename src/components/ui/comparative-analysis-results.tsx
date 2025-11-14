"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, Building, Calendar, X, Download, FileSpreadsheet, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ComparativeAnalysisResponse, VariationAnalysis } from "@/lib/api/comparative-analysis-service"
import { ExcelExportService } from "@/lib/services/excel-export"
import { VerticalAnalysisView } from "./vertical-analysis-view"
import { StructureComparisonView } from "./structure-comparison-view"

interface ComparativeAnalysisResultsProps {
  results: ComparativeAnalysisResponse
  onClose?: () => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatPercentage = (percentage: string, analysis?: any) => {
  if (!percentage) return 'N/A'
  const numValue = parseFloat(percentage)
  if (isNaN(numValue)) return percentage
  if (percentage.includes('∞') || numValue === Infinity || numValue === -Infinity) {
    if (analysis && analysis.previous_value === 0 && analysis.current_value > 0) {
      return 'Nuevo valor'
    }
    return 'Nuevo valor'
  }
  return `${numValue > 0 ? '+' : ''}${numValue.toFixed(2)}%`
}

const getVariationIcon = (variation: number, percentage?: string | null) => {
  if (percentage && (percentage.includes('∞') || variation === Infinity || variation === -Infinity)) {
    return <TrendingUp className="h-4 w-4 text-blue-600" />
  }
  if (variation > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
  if (variation < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
  return <Minus className="h-4 w-4 text-gray-600" />
}

const getVariationColor = (variation: number, percentage?: string | null) => {
  if (percentage && (percentage.includes('∞') || variation === Infinity || variation === -Infinity)) {
    return "text-blue-600"
  }
  if (variation > 0) return "text-green-600"
  if (variation < 0) return "text-red-600"
  return "text-gray-600"
}

const getVariationBgColor = (variation: number) => {
  if (variation > 0) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
  if (variation < 0) return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
  return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
}

interface AnalysisCardProps {
  title: string
  analysis: VariationAnalysis
  icon: React.ReactNode
}

function AnalysisCard({ title, analysis, icon }: AnalysisCardProps) {
  return (
    <div className={cn(
      "border rounded-lg p-4 space-y-3",
      getVariationBgColor(analysis.relative_variation)
    )}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Línea {analysis.line_number} - {analysis.field_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Año Anterior</p>
          <p className="font-medium">{formatCurrency(analysis.previous_value)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Año Actual</p>
          <p className="font-medium">{formatCurrency(analysis.current_value)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {getVariationIcon(analysis.relative_variation, analysis.variation_percentage)}
          <span className={cn("font-medium", getVariationColor(analysis.relative_variation, analysis.variation_percentage))}>
            {formatCurrency(analysis.nominal_variation)}
          </span>
        </div>
        <div className={cn("font-bold", getVariationColor(analysis.relative_variation, analysis.variation_percentage))}>
          {analysis.variation_percentage && analysis.variation_percentage.includes('∞') ? (
            <div className="flex flex-col items-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                {formatPercentage(analysis.variation_percentage, analysis)}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                De $0 → {formatCurrency(analysis.current_value)}
              </span>
            </div>
          ) : (
            formatPercentage(analysis.variation_percentage || '0', analysis)
          )}
        </div>
      </div>
    </div>
  )
}

export function ComparativeAnalysisResults({ results, onClose }: ComparativeAnalysisResultsProps) {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'details' | 'vertical' | 'structure'>('summary')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await ExcelExportService.exportComparativeAnalysis(results)
      // Opcional: mostrar mensaje de éxito
      console.log('Archivo Excel exportado exitosamente')
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      // Opcional: mostrar mensaje de error al usuario
      alert('Error al exportar a Excel. Por favor, inténtalo de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-orange-700 dark:text-orange-300">
                Análisis Comparativo Completado
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                {results.razon_social} - NIT: {results.nit}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{results.current_year}</span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">Año Actual</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">VS</span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">Comparación</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{results.previous_year}</span>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">Año Anterior</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-center text-gray-700 dark:text-gray-300">
            <strong>Estado:</strong> {results.message}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { key: 'summary', label: 'Resumen Ejecutivo', show: true },
          { key: 'details', label: 'Análisis Detallado', show: true },
          { key: 'vertical', label: 'Análisis Vertical', show: !!results.analisis_vertical_declaracion_current },
          { key: 'structure', label: 'Cambios Estructurales', show: !!results.estructura_comparacion }
        ].filter(tab => tab.show).map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors min-w-[120px]",
              selectedTab === tab.key
                ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedTab === 'summary' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnalysisCard
              title="Patrimonio"
              analysis={results.patrimonio_analysis}
              icon={<Building className="h-4 w-4 text-blue-600" />}
            />
            <AnalysisCard
              title="Ingresos"
              analysis={results.ingresos_analysis}
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
            />
            <AnalysisCard
              title="Gastos"
              analysis={results.gastos_analysis}
              icon={<TrendingDown className="h-4 w-4 text-red-600" />}
            />
            <AnalysisCard
              title="Renta Líquida"
              analysis={results.renta_liquida_analysis}
              icon={<BarChart3 className="h-4 w-4 text-purple-600" />}
            />
            <AnalysisCard
              title="Impuesto"
              analysis={results.impuesto_analysis}
              icon={<FileSpreadsheet className="h-4 w-4 text-yellow-600" />}
            />
          </div>

          {/* Summary Information */}
          {Object.keys(results.summary).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Resumen Ejecutivo Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estadísticas Generales */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-sm">Estadísticas Generales</h4>
                  <div className="space-y-2 text-sm">
                    {results.summary.total_fields_analyzed && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campos analizados:</span>
                        <span className="font-medium">{results.summary.total_fields_analyzed}</span>
                      </div>
                    )}
                    {results.summary.fields_with_increases && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campos con incremento:</span>
                        <span className="font-medium text-green-600">{results.summary.fields_with_increases}</span>
                      </div>
                    )}
                    {results.summary.fields_with_decreases && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campos con disminución:</span>
                        <span className="font-medium text-red-600">{results.summary.fields_with_decreases}</span>
                      </div>
                    )}
                    {results.summary.fields_unchanged && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campos sin cambio:</span>
                        <span className="font-medium text-gray-600">{results.summary.fields_unchanged}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insights Clave */}
                {results.summary.key_insights && Array.isArray(results.summary.key_insights) && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground text-sm">Insights Clave</h4>
                    <div className="space-y-2">
                      {results.summary.key_insights.map((insight: string, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
                          <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cambios Principales */}
              {results.summary.major_changes && Array.isArray(results.summary.major_changes) && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-foreground text-sm">Cambios Principales</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {results.summary.major_changes.map((change: any, index: number) => (
                      <div key={index} className="p-3 bg-white dark:bg-gray-900 rounded border">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{change.field}</p>
                          <span className={`text-sm font-bold ${
                            change.change.includes('-') ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {change.change}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{change.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Otros campos del resumen */}
              {Object.entries(results.summary).map(([key, value]) => {
                if (['total_fields_analyzed', 'fields_with_increases', 'fields_with_decreases', 'fields_unchanged', 'key_insights', 'major_changes'].includes(key)) {
                  return null;
                }
                return (
                  <div key={key} className="flex justify-between text-sm mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{JSON.stringify(value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'details' && (
        <div className="space-y-4">
          {/* All Variations Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Análisis Detallado de Variaciones</h3>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exportando...' : 'Exportar'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">Campo</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100">Línea</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">Año Anterior</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">Año Actual</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">Variación</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.all_variations.map((variation, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium">{variation.field_name}</td>
                      <td className="px-4 py-3 text-center">{variation.line_number}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(variation.previous_value)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(variation.current_value)}</td>
                      <td className={cn("px-4 py-3 text-right font-medium", getVariationColor(variation.relative_variation, variation.variation_percentage))}>
                        <div className="flex items-center justify-end gap-1">
                          {getVariationIcon(variation.relative_variation, variation.variation_percentage)}
                          {formatCurrency(variation.nominal_variation)}
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 text-right font-bold", getVariationColor(variation.relative_variation, variation.variation_percentage))}>
                        {variation.variation_percentage && variation.variation_percentage.includes('∞') ? (
                          <div className="flex flex-col items-end">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                              {formatPercentage(variation.variation_percentage, variation)}
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              De {formatCurrency(variation.previous_value)} → {formatCurrency(variation.current_value)}
                            </span>
                          </div>
                        ) : (
                          formatPercentage(variation.variation_percentage || '0', variation)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Analysis Tab */}
      {selectedTab === 'vertical' && results.analisis_vertical_declaracion_current && (
        <VerticalAnalysisView
          currentYear={results.analisis_vertical_declaracion_current}
          previousYear={results.analisis_vertical_declaracion_previous}
        />
      )}

      {/* Structure Comparison Tab */}
      {selectedTab === 'structure' && results.estructura_comparacion && (
        <StructureComparisonView comparison={results.estructura_comparacion} />
      )}

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground">
        Análisis generado el {new Date(results.analysis_timestamp).toLocaleString('es-CO')}
      </div>
    </div>
  )
}