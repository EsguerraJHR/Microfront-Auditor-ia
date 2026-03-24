"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, Building, Calendar, X, Download, FileSpreadsheet, BarChart3, CheckCircle, Sparkles, ArrowUpRight, ArrowDownRight, FileText, Loader2, ChevronDown, AlertTriangle, Shield, Calculator, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAuthHeaders } from "@/lib/utils/api-helpers"
import { ComparativeAnalysisResponse, VariationAnalysis } from "@/lib/api/comparative-analysis-service"
import { ExcelExportService } from "@/lib/services/excel-export"
import { VerticalAnalysisView } from "./vertical-analysis-view"
import { StructureComparisonView } from "./structure-comparison-view"

interface ComparativeAnalysisResultsProps {
  results: ComparativeAnalysisResponse
  onClose?: () => void
}

// Singleton formatter — evita crear instancias en cada llamada
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

const formatPercentage = (percentage: string, analysis?: any) => {
  if (!percentage) return 'N/A'
  const numValue = parseFloat(percentage)
  if (isNaN(numValue)) return percentage
  if (percentage.includes('∞') || numValue === Infinity || numValue === -Infinity) {
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
  const isPositive = analysis.relative_variation > 0
  const isNegative = analysis.relative_variation < 0

  return (
    <div
      className={cn(
        "border rounded-xl p-5 space-y-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative overflow-hidden",
        getVariationBgColor(analysis.relative_variation)
      )}
    >
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Línea {analysis.line_number}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm relative">
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Año Anterior</p>
          <p className="font-semibold text-foreground">{formatCurrency(analysis.previous_value)}</p>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Año Actual</p>
          <p className="font-semibold text-foreground">{formatCurrency(analysis.current_value)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50 relative">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
              isPositive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
              isNegative ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
              "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : isNegative ? <ArrowDownRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {formatCurrency(Math.abs(analysis.nominal_variation))}
          </div>
        </div>
        <div className={cn("text-lg font-bold", getVariationColor(analysis.relative_variation, analysis.variation_percentage))}>
          {analysis.variation_percentage && analysis.variation_percentage.includes('∞') ? (
            <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
              Nuevo
            </span>
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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false)
  const [isVerticalInfoCollapsed, setIsVerticalInfoCollapsed] = useState(false)

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005'}/api/v1/compliance`
      const response = await fetch(`${baseUrl}/analyze/declaration/comparative/report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(results)
      })

      if (!response.ok) {
        let errorText = 'Error desconocido'
        try {
          const errorData = await response.json()
          errorText = errorData.detail || errorData.message || `HTTP ${response.status}`
        } catch {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        throw new Error(errorText)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informe_tributario_${results.nit}_${results.current_year}.docx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al generar reporte:', error)
      alert(`Error al generar el reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await ExcelExportService.exportComparativeAnalysis(results)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al exportar a Excel. Por favor, inténtalo de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportContexto = async () => {
    setIsExporting(true)
    try {
      await ExcelExportService.exportContextoFormat(results)
    } catch (error) {
      console.error('Error al exportar formato Contexto:', error)
      alert('Error al exportar formato Contexto. Por favor, inténtalo de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const tabs = [
    { key: 'summary', label: 'Resumen Ejecutivo', show: true },
    { key: 'details', label: 'Análisis Horizontal', show: true },
    { key: 'vertical', label: 'Análisis Vertical', show: !!results.analisis_vertical_declaracion_current },
    { key: 'structure', label: 'Cambios Estructurales', show: !!results.estructura_comparacion }
  ].filter(tab => tab.show)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                <CheckCircle className="h-7 w-7 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">Análisis Completado</span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {results.razon_social}
                </h2>
                <p className="text-slate-300 text-sm">
                  NIT: {results.nit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Generar Reporte
                  </>
                )}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-500/20 rounded-xl p-4 text-center border border-blue-500/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span className="text-3xl font-bold text-white">{results.current_year}</span>
              </div>
              <p className="text-sm text-blue-300">Año Actual</p>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-600/50 flex items-center justify-center border border-slate-500/30">
                <BarChart3 className="h-8 w-8 text-slate-300" />
              </div>
            </div>

            <div className="bg-slate-600/30 rounded-xl p-4 text-center border border-slate-500/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-slate-400" />
                <span className="text-3xl font-bold text-slate-200">{results.previous_year}</span>
              </div>
              <p className="text-sm text-slate-400">Año Anterior</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-center text-green-300">
              {results.message}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs — CSS only, sin motion layout */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
            className={cn(
              "relative flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 min-w-[120px]",
              selectedTab === tab.key
                ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content — sin AnimatePresence, solo CSS transitions */}
      {selectedTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnalysisCard
              title="Patrimonio"
              analysis={results.patrimonio_analysis}
              icon={<Building className="h-5 w-5 text-blue-600" />}
            />
            <AnalysisCard
              title="Ingresos"
              analysis={results.ingresos_analysis}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            />
            <AnalysisCard
              title="Gastos"
              analysis={results.gastos_analysis}
              icon={<TrendingDown className="h-5 w-5 text-red-600" />}
            />
            <AnalysisCard
              title="Renta Líquida"
              analysis={results.renta_liquida_analysis}
              icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
            />
            <AnalysisCard
              title="Impuesto"
              analysis={results.impuesto_analysis}
              icon={<FileSpreadsheet className="h-5 w-5 text-yellow-600" />}
            />
          </div>

          {/* Summary Information */}
          {Object.keys(results.summary).length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Resumen Ejecutivo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estadísticas Generales */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground text-sm">Estadísticas Generales</h4>
                  <div className="space-y-3">
                    {results.summary.total_fields_analyzed && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-muted-foreground text-sm">Campos analizados</span>
                        <span className="font-bold text-lg">{results.summary.total_fields_analyzed}</span>
                      </div>
                    )}
                    {results.summary.fields_with_increases && (
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4" />
                          Con incremento
                        </span>
                        <span className="font-bold text-lg text-green-600">{results.summary.fields_with_increases}</span>
                      </div>
                    )}
                    {results.summary.fields_with_decreases && (
                      <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                          <ArrowDownRight className="h-4 w-4" />
                          Con disminución
                        </span>
                        <span className="font-bold text-lg text-red-600">{results.summary.fields_with_decreases}</span>
                      </div>
                    )}
                    {results.summary.fields_unchanged && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-muted-foreground text-sm flex items-center gap-2">
                          <Minus className="h-4 w-4" />
                          Sin cambio
                        </span>
                        <span className="font-bold text-lg text-gray-600">{results.summary.fields_unchanged}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insights Clave */}
                {results.summary.key_insights && Array.isArray(results.summary.key_insights) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground text-sm">Insights Clave</h4>
                    <div className="space-y-3">
                      {results.summary.key_insights.map((insight: string, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-l-4 border-blue-500"
                        >
                          <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cambios Principales */}
              {results.summary.major_changes && Array.isArray(results.summary.major_changes) && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-foreground text-sm">Cambios Principales</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {results.summary.major_changes.map((change: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">{change.field}</p>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-bold",
                            change.change.includes('-')
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600'
                          )}>
                            {change.change}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{change.impact}</p>
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
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sección informativa del Análisis Horizontal */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg">
            <button
              onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
              className="w-full px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-indigo border-b border-gray-200 dark:border-gray-700 text-left cursor-pointer hover:brightness-110 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Análisis Horizontal (Comparativo entre años)</h3>
                    <p className="text-blue-200 text-sm">Compara campo a campo los valores de dos declaraciones de renta (año actual vs año anterior) del mismo contribuyente.</p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 text-white/70 flex-shrink-0 ml-4 transition-transform duration-200",
                  isInfoCollapsed && "-rotate-90"
                )} />
              </div>
            </button>

            {!isInfoCollapsed && (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Datos requeridos */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileSpreadsheet className="h-4 w-4 text-brand-indigo" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Datos requeridos</p>
                  <p className="text-sm text-muted-foreground">2 PDFs de declaraciones de renta (Formulario 210) de años consecutivos.</p>
                </div>
              </div>

              {/* Campos analizados */}
              <div>
                <p className="font-semibold text-sm text-foreground mb-3">Campos analizados (17 en total)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">Bloque</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">Campos</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">Renglones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">Patrimonio</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">Patrimonio Bruto, Deudas, Patrimonio Líquido</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">44, 45, 46</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">Ingresos</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">Ingresos Brutos Ordinarios, Ingresos Financieros, Total Ingresos Netos</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">47, 48, 61</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">Gastos</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">Gastos de Administración, Gastos Financieros, Total Costos y Gastos</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">63, 65, 67</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">Renta/Impuestos</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">Renta Líquida Ordinaria, Renta Líquida, Renta Líquida Gravable, Impuesto sobre Renta</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">72, 75, 79, 91</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">Retenciones/Pagos</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">Autorretenciones, Total Retenciones, Valor a Pagar, Saldo a Favor</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">105, 107, 113, 114</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fórmulas */}
              <div>
                <p className="font-semibold text-sm text-foreground mb-3">Fórmulas</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-muted-foreground mb-1">Variación Nominal</p>
                    <code className="text-sm font-mono text-foreground">Valor_Actual - Valor_Anterior</code>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-muted-foreground mb-1">Variación Relativa (%)</p>
                    <code className="text-sm font-mono text-foreground">(Actual - Anterior) / Anterior × 100</code>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Si el valor anterior es <strong>0</strong> y el actual {'>'} 0, se marca como <span className="inline-flex px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded text-xs font-medium">∞ (valor nuevo)</span>
                </p>
              </div>

              {/* Resumen ejecutivo */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">Resumen ejecutivo</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Cuenta campos con incrementos, decrementos e iguales. Se marca como <strong>cambio significativo</strong> cualquier variación relativa {'>'} 20%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* All Variations Table */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Análisis Detallado de Variaciones</h3>
                    <p className="text-slate-300 text-sm">{results.all_variations.length} campos analizados</p>
                  </div>
                </div>
                <button
                  onClick={handleExportContexto}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  title="Exportar en formato Contexto.xlsx"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {isExporting ? 'Exportando...' : 'Exportar Excel'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <th className="px-5 py-4 text-left font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Campo</th>
                    <th className="px-5 py-4 text-center font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Línea</th>
                    <th className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Año Anterior</th>
                    <th className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Año Actual</th>
                    <th className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Variación</th>
                    <th className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {results.all_variations.map((variation, index) => (
                    <tr
                      key={index}
                      className="group cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {variation.field_name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {variation.line_number}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono text-gray-600 dark:text-gray-400">
                          {formatCurrency(variation.previous_value)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(variation.current_value)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm",
                            variation.relative_variation > 0
                              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                              : variation.relative_variation < 0
                                ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          )}
                        >
                          {getVariationIcon(variation.relative_variation, variation.variation_percentage)}
                          <span className="font-mono">{formatCurrency(variation.nominal_variation)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {variation.variation_percentage && variation.variation_percentage.includes('∞') ? (
                          <span className="inline-flex px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-md">
                            Nuevo
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex px-3 py-1.5 rounded-full text-xs font-bold shadow-sm",
                              variation.relative_variation > 0
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                : variation.relative_variation < 0
                                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            )}
                          >
                            {formatPercentage(variation.variation_percentage || '0', variation)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer con resumen */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Mostrando {results.all_variations.length} variaciones
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    {results.all_variations.filter(v => v.relative_variation > 0).length} incrementos
                  </span>
                  <span className="flex items-center gap-1.5 text-red-600">
                    <ArrowDownRight className="h-4 w-4" />
                    {results.all_variations.filter(v => v.relative_variation < 0).length} decrementos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Analysis Tab */}
      {selectedTab === 'vertical' && results.analisis_vertical_declaracion_current && (
        <div className="space-y-4 animate-in fade-in duration-200">

          {/* Sección informativa del Análisis Vertical */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg">
            <button
              onClick={() => setIsVerticalInfoCollapsed(!isVerticalInfoCollapsed)}
              className="w-full px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 border-b border-gray-200 dark:border-gray-700 text-left cursor-pointer hover:brightness-110 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Análisis Vertical (Estructura porcentual por año)</h3>
                    <p className="text-emerald-200 text-sm">Expresa cada partida como porcentaje de una base dentro del mismo año, para entender la composición de la declaración.</p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 text-white/70 flex-shrink-0 ml-4 transition-transform duration-200",
                  isVerticalInfoCollapsed && "-rotate-90"
                )} />
              </div>
            </button>

            {!isVerticalInfoCollapsed && (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">

              {/* Bases utilizadas */}
              <div>
                <p className="font-semibold text-sm text-foreground mb-3">Bases utilizadas</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">Bloque</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">Base (100%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">Patrimonio</span></td>
                        <td className="px-4 py-2.5 text-muted-foreground">Patrimonio Bruto (R44)</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">Resultados</span></td>
                        <td className="px-4 py-2.5 text-muted-foreground">Ingresos Netos (R61)</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">Impuestos</span></td>
                        <td className="px-4 py-2.5 text-muted-foreground">Ingresos Netos (R61)</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">Pagos y Saldos</span></td>
                        <td className="px-4 py-2.5 text-muted-foreground">Ingresos Netos (R61)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-muted-foreground"><strong>Fórmula:</strong> <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">(Valor del campo / Base) × 100</code></p>
                </div>
              </div>

              {/* Campos por bloque */}
              <div>
                <p className="font-semibold text-sm text-foreground mb-3">Campos por bloque</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/50">
                    <p className="font-semibold text-xs text-blue-700 dark:text-blue-300 mb-1.5">Patrimonio</p>
                    <p className="text-xs text-muted-foreground">Patrimonio Bruto, Deudas, Patrimonio Líquido</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/50">
                    <p className="font-semibold text-xs text-green-700 dark:text-green-300 mb-1.5">Resultados</p>
                    <p className="text-xs text-muted-foreground">Ingresos Netos, Total Costos y Gastos, Renta Líquida Ordinaria, Recuperación Deducciones, Pérdida Líquida, Compensaciones, Renta Exenta, Renta Líquida Gravable</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800/50">
                    <p className="font-semibold text-xs text-purple-700 dark:text-purple-300 mb-1.5">Impuestos</p>
                    <p className="text-xs text-muted-foreground">Impuesto sobre Renta Líquida, Descuentos Tributarios, Impuesto Neto de Renta, Ganancia Ocasional Gravable, Impuesto Ganancia Ocasional, Total Impuesto a Cargo</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800/50">
                    <p className="font-semibold text-xs text-orange-700 dark:text-orange-300 mb-1.5">Pagos y Saldos</p>
                    <p className="text-xs text-muted-foreground">Anticipo Año Anterior, Saldo a Favor Año Anterior, Retenciones, Anticipo Año Siguiente, Anticipo Puntos Adicionales, Valor a Pagar, Saldo a Favor</p>
                  </div>
                </div>
              </div>

              {/* Comparación estructural */}
              <div className="p-4 bg-teal-50 dark:bg-teal-900/10 rounded-lg border border-teal-200 dark:border-teal-800/50">
                <div className="flex items-start gap-2">
                  <BarChart3 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-teal-800 dark:text-teal-200">Comparación estructural</p>
                    <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
                      Se compara la estructura vertical del año actual con la del anterior. Se marcan como <strong>cambios significativos</strong> las diferencias mayores a <strong>5 puntos porcentuales</strong>, con interpretación automática (ej: &quot;Reducción significativa en costos/gastos - mejora en eficiencia operativa&quot;).
                    </p>
                  </div>
                </div>
              </div>

              {/* Coherencia Tributaria */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Insights / Coherencia Tributaria</p>
                    <p className="text-xs text-muted-foreground">8 índices + 2 cruces de verificación + 1 validación legal, cada uno con nivel de riesgo</p>
                  </div>
                </div>

                {/* Niveles de riesgo */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">BAJO</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium">MEDIO</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium">ALTO</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">CRITICO</span>
                </div>

                {/* Índices calculados */}
                <div className="mb-4">
                  <p className="font-semibold text-xs text-foreground mb-2">Índices calculados</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">#</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Índice</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Fórmula</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Criterio de alerta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono">1</td>
                          <td className="px-3 py-2 font-medium text-foreground">Margen de Utilidad Fiscal</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">R72 / R61</td>
                          <td className="px-3 py-2 text-muted-foreground">Comparación vs promedio sectorial DIAN. Riesgo si {'>'} 60% por debajo</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono">2</td>
                          <td className="px-3 py-2 font-medium text-foreground">Absorción de Ingresos</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">R67 / R61</td>
                          <td className="px-3 py-2 text-muted-foreground">BAJO {'<'}80%, MEDIO 80-95%, ALTO 95-100%, CRITICO {'≥'}100%</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono">3</td>
                          <td className="px-3 py-2 font-medium text-foreground">Verificación de Tarifa</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">R91 / R79</td>
                          <td className="px-3 py-2 text-muted-foreground">Debe estar entre 34.5% y 40%</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono">4</td>
                          <td className="px-3 py-2 font-medium text-foreground">Tasa Efectiva</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">R99 / R79</td>
                          <td className="px-3 py-2 text-muted-foreground">Informativo</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono">5</td>
                          <td className="px-3 py-2 font-medium text-foreground">Proporción Compensaciones</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">R74 / R72</td>
                          <td className="px-3 py-2 text-muted-foreground">Alerta si {'>'} 20%. CRITICO si {'>'} 40%</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono">6</td>
                          <td className="px-3 py-2 font-medium text-foreground">Proporción Rentas Exentas</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">R77 / R72</td>
                          <td className="px-3 py-2 text-muted-foreground">Alerta si {'>'} 30%. CRITICO si {'>'} 50%</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono">7</td>
                          <td className="px-3 py-2 font-medium text-foreground">Nivel de Endeudamiento</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">R45 / R44</td>
                          <td className="px-3 py-2 text-muted-foreground">Informativo</td>
                        </tr>
                        <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="px-3 py-2 font-mono">8</td>
                          <td className="px-3 py-2 font-medium text-foreground">Retenciones vs Impuesto</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">R107 / R99</td>
                          <td className="px-3 py-2 text-muted-foreground">Informativo</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cruces de verificación */}
                <div className="mb-4">
                  <p className="font-semibold text-xs text-foreground mb-2">Cruces de verificación</p>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-xs text-foreground mb-1">9. Saldo a Favor vs Activos</p>
                      <p className="text-xs text-muted-foreground">Si Otros Activos (R43) {'<'} Saldo a Favor (R114) → el saldo no fue incluido en activos.</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-xs text-foreground mb-1">10. Autorretenciones vs Tarifa CIIU</p>
                      <p className="text-xs text-muted-foreground">(R61 + R70 + R80) × tarifa_CIIU vs R105. Verificación directa + inversa con tolerancia del 5%. Requiere tarifa de autorretención por código CIIU.</p>
                    </div>
                  </div>
                </div>

                {/* Validación legal */}
                <div className="mb-4">
                  <p className="font-semibold text-xs text-foreground mb-2">Validación legal</p>
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/50">
                    <p className="font-medium text-xs text-red-700 dark:text-red-300 mb-1">11. Gastos No Explicados (Art. 663 E.T.)</p>
                    <p className="text-xs text-muted-foreground">Fuentes = Ingresos Netos (R61) + (Pasivos actuales R45 − Pasivos anteriores R45). Si Fuentes {'<'} Total Costos y Gastos (R67) → existen gastos sin fuente de ingreso que los explique.</p>
                  </div>
                </div>

                {/* Datos externos */}
                <div className="mb-4">
                  <p className="font-semibold text-xs text-foreground mb-2">Datos externos requeridos</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                      <FileSpreadsheet className="h-3 w-3" />
                      Datos sectoriales DIAN (promedio utilidad por CIIU)
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                      <Calculator className="h-3 w-3" />
                      Tarifas de autorretención por CIIU
                    </span>
                  </div>
                </div>

                {/* Riesgo Global */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/50">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">Riesgo Global</p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1 list-disc list-inside">
                        <li>Si hay algún índice <strong>CRITICO</strong> → Global CRITICO</li>
                        <li>Si hay ≥2 ALTO → Global ALTO</li>
                        <li>Si hay ≥1 ALTO o ≥3 MEDIO → Global MEDIO</li>
                        <li>De lo contrario → Global BAJO</li>
                      </ul>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">Se generan recomendaciones automáticas solo para índices con riesgo ALTO o CRITICO.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          <VerticalAnalysisView
            currentYear={results.analisis_vertical_declaracion_current}
            previousYear={results.analisis_vertical_declaracion_previous}
            structureComparison={results.estructura_comparacion}
            taxCoherenceCurrent={results.coherencia_tributaria_current}
            taxCoherencePrevious={results.coherencia_tributaria_previous}
          />
        </div>
      )}

      {/* Structure Comparison Tab */}
      {selectedTab === 'structure' && results.estructura_comparacion && (
        <div className="animate-in fade-in duration-200">
          <StructureComparisonView comparison={results.estructura_comparacion} />
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Análisis generado el {new Date(results.analysis_timestamp).toLocaleString('es-CO')}
        </p>
      </div>
    </div>
  )
}
