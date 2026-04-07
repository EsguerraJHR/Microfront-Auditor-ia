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
    return <TrendingUp className="h-4 w-4 text-brand-indigo" />
  }
  if (variation > 0) return <TrendingUp className="h-4 w-4 text-success" />
  if (variation < 0) return <TrendingDown className="h-4 w-4 text-error" />
  return <Minus className="h-4 w-4 text-brand-text-secondary" />
}

const getVariationColor = (variation: number, percentage?: string | null) => {
  if (percentage && (percentage.includes('∞') || variation === Infinity || variation === -Infinity)) {
    return "text-brand-indigo"
  }
  if (variation > 0) return "text-success"
  if (variation < 0) return "text-error"
  return "text-brand-text-secondary"
}

const getVariationBgColor = (variation: number) => {
  if (variation > 0) return "bg-success-bg border-success-bg"
  if (variation < 0) return "bg-error-bg border-error-bg"
  return "bg-brand-bg border-brand-border"
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
        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-brand-text">{title}</h3>
          <p className="text-xs text-brand-text-secondary">
            Línea {analysis.line_number}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm relative">
        <div className="bg-white/50/50 rounded-lg p-3">
          <p className="text-xs text-brand-text-secondary mb-1">Año Anterior</p>
          <p className="font-semibold text-brand-text">{formatCurrency(analysis.previous_value)}</p>
        </div>
        <div className="bg-white/50/50 rounded-lg p-3">
          <p className="text-xs text-brand-text-secondary mb-1">Año Actual</p>
          <p className="font-semibold text-brand-text">{formatCurrency(analysis.current_value)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-brand-border relative">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
              isPositive ? "bg-success-bg text-success-foreground" :
              isNegative ? "bg-error-bg text-error-foreground" :
              "bg-brand-bg-alt text-brand-text"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : isNegative ? <ArrowDownRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {formatCurrency(Math.abs(analysis.nominal_variation))}
          </div>
        </div>
        <div className={cn("text-lg font-bold", getVariationColor(analysis.relative_variation, analysis.variation_percentage))}>
          {analysis.variation_percentage && analysis.variation_percentage.includes('∞') ? (
            <span className="px-3 py-1 bg-brand-indigo text-white rounded-full text-sm">
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
          <div className="absolute -top-1/2 -right-1/4 w-64 h-64 bg-brand-indigo/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-brand-indigo/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center border border-success/30">
                <CheckCircle className="h-7 w-7 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-brand-indigo" />
                  <span className="text-brand-indigo text-sm font-medium">Análisis Completado</span>
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
            <div className="bg-brand-indigo/20 rounded-xl p-4 text-center border border-brand-indigo/30">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-brand-indigo" />
                <span className="text-3xl font-bold text-white">{results.current_year}</span>
              </div>
              <p className="text-sm text-brand-indigo">Año Actual</p>
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

          <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
            <p className="text-sm text-center text-success">
              {results.message}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs — CSS only, sin motion layout */}
      <div className="flex flex-wrap gap-1 bg-brand-bg-alt p-1.5 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
            className={cn(
              "relative flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 min-w-[120px]",
              selectedTab === tab.key
                ? "bg-white text-warning shadow-sm"
                : "text-brand-text-secondary hover:text-brand-text"
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
              icon={<Building className="h-5 w-5 text-brand-indigo" />}
            />
            <AnalysisCard
              title="Ingresos"
              analysis={results.ingresos_analysis}
              icon={<TrendingUp className="h-5 w-5 text-success" />}
            />
            <AnalysisCard
              title="Gastos"
              analysis={results.gastos_analysis}
              icon={<TrendingDown className="h-5 w-5 text-error" />}
            />
            <AnalysisCard
              title="Renta Líquida"
              analysis={results.renta_liquida_analysis}
              icon={<BarChart3 className="h-5 w-5 text-brand-indigo" />}
            />
            <AnalysisCard
              title="Impuesto"
              analysis={results.impuesto_analysis}
              icon={<FileSpreadsheet className="h-5 w-5 text-warning" />}
            />
          </div>

          {/* Summary Information */}
          {Object.keys(results.summary).length > 0 && (
            <div className="bg-white border border-brand-border rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-brand-text mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-warning" />
                Resumen Ejecutivo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estadísticas Generales */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-brand-text text-sm">Estadísticas Generales</h4>
                  <div className="space-y-3">
                    {results.summary.total_fields_analyzed && (
                      <div className="flex justify-between items-center p-3 bg-brand-bg rounded-lg">
                        <span className="text-brand-text-secondary text-sm">Campos analizados</span>
                        <span className="font-bold text-lg">{results.summary.total_fields_analyzed}</span>
                      </div>
                    )}
                    {results.summary.fields_with_increases && (
                      <div className="flex justify-between items-center p-3 bg-success-bg rounded-lg border border-success-bg">
                        <span className="text-success-foreground text-sm flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4" />
                          Con incremento
                        </span>
                        <span className="font-bold text-lg text-success">{results.summary.fields_with_increases}</span>
                      </div>
                    )}
                    {results.summary.fields_with_decreases && (
                      <div className="flex justify-between items-center p-3 bg-error-bg rounded-lg border border-error-bg">
                        <span className="text-error-foreground text-sm flex items-center gap-2">
                          <ArrowDownRight className="h-4 w-4" />
                          Con disminución
                        </span>
                        <span className="font-bold text-lg text-error">{results.summary.fields_with_decreases}</span>
                      </div>
                    )}
                    {results.summary.fields_unchanged && (
                      <div className="flex justify-between items-center p-3 bg-brand-bg rounded-lg">
                        <span className="text-brand-text-secondary text-sm flex items-center gap-2">
                          <Minus className="h-4 w-4" />
                          Sin cambio
                        </span>
                        <span className="font-bold text-lg text-brand-text-secondary">{results.summary.fields_unchanged}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insights Clave */}
                {results.summary.key_insights && Array.isArray(results.summary.key_insights) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-brand-text text-sm">Insights Clave</h4>
                    <div className="space-y-3">
                      {results.summary.key_insights.map((insight: string, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-brand-bg rounded-lg border-l-4 border-brand-indigo"
                        >
                          <p className="text-sm text-brand-indigo">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cambios Principales */}
              {results.summary.major_changes && Array.isArray(results.summary.major_changes) && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-brand-text text-sm">Cambios Principales</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {results.summary.major_changes.map((change: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-white rounded-xl border border-brand-border shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">{change.field}</p>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-bold",
                            change.change.includes('-')
                              ? 'bg-error-bg text-error'
                              : 'bg-success-bg text-success'
                          )}>
                            {change.change}
                          </span>
                        </div>
                        <p className="text-xs text-brand-text-secondary">{change.impact}</p>
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
                  <div key={key} className="flex justify-between text-sm mt-4 pt-4 border-t border-brand-border">
                    <span className="text-brand-text-secondary">{key}:</span>
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
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-lg">
            <button
              onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
              className="w-full px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-indigo border-b border-brand-border text-left cursor-pointer hover:brightness-110 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Análisis Horizontal (Comparativo entre años)</h3>
                    <p className="text-white/80 text-sm">Compara campo a campo los valores de dos declaraciones de renta (año actual vs año anterior) del mismo contribuyente.</p>
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
                <div className="w-8 h-8 rounded-lg bg-brand-indigo/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileSpreadsheet className="h-4 w-4 text-brand-indigo" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-brand-text">Datos requeridos</p>
                  <p className="text-sm text-brand-text-secondary">2 PDFs de declaraciones de renta (Formulario 210) de años consecutivos.</p>
                </div>
              </div>

              {/* Campos analizados */}
              <div>
                <p className="font-semibold text-sm text-brand-text mb-3">Campos analizados (17 en total)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-brand-bg/50">
                        <th className="px-4 py-2.5 text-left font-semibold text-brand-text text-xs uppercase tracking-wider">Bloque</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-brand-text text-xs uppercase tracking-wider">Campos</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-brand-text text-xs uppercase tracking-wider">Renglones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-indigo/10 text-brand-indigo text-xs font-medium">Patrimonio</span>
                        </td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Patrimonio Bruto, Deudas, Patrimonio Líquido</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-brand-text-secondary">44, 45, 46</td>
                      </tr>
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-success-bg text-success-foreground text-xs font-medium">Ingresos</span>
                        </td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Ingresos Brutos Ordinarios, Ingresos Financieros, Total Ingresos Netos</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-brand-text-secondary">47, 48, 61</td>
                      </tr>
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-error-bg text-error-foreground text-xs font-medium">Gastos</span>
                        </td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Gastos de Administración, Gastos Financieros, Total Costos y Gastos</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-brand-text-secondary">63, 65, 67</td>
                      </tr>
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-indigo/10 text-brand-indigo text-xs font-medium">Renta/Impuestos</span>
                        </td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Renta Líquida Ordinaria, Renta Líquida, Renta Líquida Gravable, Impuesto sobre Renta</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-brand-text-secondary">72, 75, 79, 91</td>
                      </tr>
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-warning-bg text-warning-foreground text-xs font-medium">Retenciones/Pagos</span>
                        </td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Autorretenciones, Total Retenciones, Valor a Pagar, Saldo a Favor</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-brand-text-secondary">105, 107, 113, 114</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fórmulas */}
              <div>
                <p className="font-semibold text-sm text-brand-text mb-3">Fórmulas</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                    <p className="text-xs text-brand-text-secondary mb-1">Variación Nominal</p>
                    <code className="text-sm font-mono text-brand-text">Valor_Actual - Valor_Anterior</code>
                  </div>
                  <div className="p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                    <p className="text-xs text-brand-text-secondary mb-1">Variación Relativa (%)</p>
                    <code className="text-sm font-mono text-brand-text">(Actual - Anterior) / Anterior × 100</code>
                  </div>
                </div>
                <p className="text-xs text-brand-text-secondary mt-2">
                  Si el valor anterior es <strong>0</strong> y el actual {'>'} 0, se marca como <span className="inline-flex px-1.5 py-0.5 bg-brand-indigo/10 text-brand-indigo rounded text-xs font-medium">∞ (valor nuevo)</span>
                </p>
              </div>

              {/* Resumen ejecutivo */}
              <div className="p-4 bg-warning-bg rounded-lg border border-warning-bg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-warning-foreground">Resumen ejecutivo</p>
                    <p className="text-sm text-warning mt-1">
                      Cuenta campos con incrementos, decrementos e iguales. Se marca como <strong>cambio significativo</strong> cualquier variación relativa {'>'} 20%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* All Variations Table */}
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-lg">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-b border-brand-border">
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
                  <tr className="bg-brand-bg">
                    <th className="px-5 py-4 text-left font-bold text-brand-text uppercase text-xs tracking-wider">Campo</th>
                    <th className="px-5 py-4 text-center font-bold text-brand-text uppercase text-xs tracking-wider">Línea</th>
                    <th className="px-5 py-4 text-right font-bold text-brand-text uppercase text-xs tracking-wider">Año Anterior</th>
                    <th className="px-5 py-4 text-right font-bold text-brand-text uppercase text-xs tracking-wider">Año Actual</th>
                    <th className="px-5 py-4 text-right font-bold text-brand-text uppercase text-xs tracking-wider">Variación</th>
                    <th className="px-5 py-4 text-right font-bold text-brand-text uppercase text-xs tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {results.all_variations.map((variation, index) => (
                    <tr
                      key={index}
                      className="group cursor-pointer hover:bg-brand-bg transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium text-brand-text group-hover:text-brand-indigo transition-colors">
                          {variation.field_name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-7 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                          {variation.line_number}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono text-brand-text-secondary">
                          {formatCurrency(variation.previous_value)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-semibold text-brand-text">
                          {formatCurrency(variation.current_value)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm",
                            variation.relative_variation > 0
                              ? "bg-success-bg text-success-foreground"
                              : variation.relative_variation < 0
                                ? "bg-error-bg text-error-foreground"
                                : "bg-brand-bg text-brand-text-secondary"
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
                                  : "bg-brand-bg-alt text-brand-text-secondary"
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
            <div className="px-6 py-4 bg-brand-bg border-t border-brand-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-text-secondary">
                  Mostrando {results.all_variations.length} variaciones
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-success">
                    <ArrowUpRight className="h-4 w-4" />
                    {results.all_variations.filter(v => v.relative_variation > 0).length} incrementos
                  </span>
                  <span className="flex items-center gap-1.5 text-error">
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
          <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-lg">
            <button
              onClick={() => setIsVerticalInfoCollapsed(!isVerticalInfoCollapsed)}
              className="w-full px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 border-b border-brand-border text-left cursor-pointer hover:brightness-110 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Análisis Vertical (Estructura porcentual por año)</h3>
                    <p className="text-white/80 text-sm">Expresa cada partida como porcentaje de una base dentro del mismo año, para entender la composición de la declaración.</p>
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
                <p className="font-semibold text-sm text-brand-text mb-3">Bases utilizadas</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-brand-bg/50">
                        <th className="px-4 py-2.5 text-left font-semibold text-brand-text text-xs uppercase tracking-wider">Bloque</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-brand-text text-xs uppercase tracking-wider">Base (100%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-md bg-brand-indigo/10 text-brand-indigo text-xs font-medium">Patrimonio</span></td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Patrimonio Bruto (R44)</td>
                      </tr>
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-md bg-success-bg text-success-foreground text-xs font-medium">Resultados</span></td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Ingresos Netos (R61)</td>
                      </tr>
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-md bg-brand-indigo/10 text-brand-indigo text-xs font-medium">Impuestos</span></td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Ingresos Netos (R61)</td>
                      </tr>
                      <tr className="hover:bg-brand-bg">
                        <td className="px-4 py-2.5"><span className="inline-flex px-2 py-0.5 rounded-md bg-warning-bg text-warning-foreground text-xs font-medium">Pagos y Saldos</span></td>
                        <td className="px-4 py-2.5 text-brand-text-secondary">Ingresos Netos (R61)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                  <p className="text-xs text-brand-text-secondary"><strong>Fórmula:</strong> <code className="font-mono bg-brand-bg-alt px-1.5 py-0.5 rounded">(Valor del campo / Base) × 100</code></p>
                </div>
              </div>

              {/* Campos por bloque */}
              <div>
                <p className="font-semibold text-sm text-brand-text mb-3">Campos por bloque</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20">
                    <p className="font-semibold text-xs text-brand-indigo mb-1.5">Patrimonio</p>
                    <p className="text-xs text-brand-text-secondary">Patrimonio Bruto, Deudas, Patrimonio Líquido</p>
                  </div>
                  <div className="p-3 bg-success-bg rounded-lg border border-success-bg">
                    <p className="font-semibold text-xs text-success-foreground mb-1.5">Resultados</p>
                    <p className="text-xs text-brand-text-secondary">Ingresos Netos, Total Costos y Gastos, Renta Líquida Ordinaria, Recuperación Deducciones, Pérdida Líquida, Compensaciones, Renta Exenta, Renta Líquida Gravable</p>
                  </div>
                  <div className="p-3 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20">
                    <p className="font-semibold text-xs text-brand-indigo mb-1.5">Impuestos</p>
                    <p className="text-xs text-brand-text-secondary">Impuesto sobre Renta Líquida, Descuentos Tributarios, Impuesto Neto de Renta, Ganancia Ocasional Gravable, Impuesto Ganancia Ocasional, Total Impuesto a Cargo</p>
                  </div>
                  <div className="p-3 bg-warning-bg rounded-lg border border-warning-bg">
                    <p className="font-semibold text-xs text-warning-foreground mb-1.5">Pagos y Saldos</p>
                    <p className="text-xs text-brand-text-secondary">Anticipo Año Anterior, Saldo a Favor Año Anterior, Retenciones, Anticipo Año Siguiente, Anticipo Puntos Adicionales, Valor a Pagar, Saldo a Favor</p>
                  </div>
                </div>
              </div>

              {/* Comparación estructural */}
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <div className="flex items-start gap-2">
                  <BarChart3 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-teal-800">Comparación estructural</p>
                    <p className="text-sm text-teal-700 mt-1">
                      Se compara la estructura vertical del año actual con la del anterior. Se marcan como <strong>cambios significativos</strong> las diferencias mayores a <strong>5 puntos porcentuales</strong>, con interpretación automática (ej: &quot;Reducción significativa en costos/gastos - mejora en eficiencia operativa&quot;).
                    </p>
                  </div>
                </div>
              </div>

              {/* Coherencia Tributaria */}
              <div className="border-t border-brand-border pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-brand-text">Insights / Coherencia Tributaria</p>
                    <p className="text-xs text-brand-text-secondary">8 índices + 2 cruces de verificación + 1 validación legal, cada uno con nivel de riesgo</p>
                  </div>
                </div>

                {/* Niveles de riesgo */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-success-bg text-success-foreground text-xs font-medium">BAJO</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-warning-bg text-warning-foreground text-xs font-medium">MEDIO</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-warning-bg text-warning-foreground text-xs font-medium">ALTO</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-error-bg text-error-foreground text-xs font-medium">CRITICO</span>
                </div>

                {/* Índices calculados */}
                <div className="mb-4">
                  <p className="font-semibold text-xs text-brand-text mb-2">Índices calculados</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-brand-bg/50">
                          <th className="px-3 py-2 text-left font-semibold text-brand-text uppercase tracking-wider">#</th>
                          <th className="px-3 py-2 text-left font-semibold text-brand-text uppercase tracking-wider">Índice</th>
                          <th className="px-3 py-2 text-left font-semibold text-brand-text uppercase tracking-wider">Fórmula</th>
                          <th className="px-3 py-2 text-left font-semibold text-brand-text uppercase tracking-wider">Criterio de alerta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        <tr className="hover:bg-brand-bg">
                          <td className="px-3 py-2 font-mono">1</td>
                          <td className="px-3 py-2 font-medium text-brand-text">Margen de Utilidad Fiscal</td>
                          <td className="px-3 py-2 text-brand-text-secondary font-mono">R72 / R61</td>
                          <td className="px-3 py-2 text-brand-text-secondary">Comparación vs promedio sectorial DIAN. Riesgo si {'>'} 60% por debajo</td>
                        </tr>
                        <tr className="hover:bg-brand-bg">
                          <td className="px-3 py-2 font-mono">2</td>
                          <td className="px-3 py-2 font-medium text-brand-text">Absorción de Ingresos</td>
                          <td className="px-3 py-2 text-brand-text-secondary font-mono">R67 / R61</td>
                          <td className="px-3 py-2 text-brand-text-secondary">BAJO {'<'}80%, MEDIO 80-95%, ALTO 95-100%, CRITICO {'≥'}100%</td>
                        </tr>
                        <tr className="hover:bg-brand-bg">
                          <td className="px-3 py-2 font-mono">3</td>
                          <td className="px-3 py-2 font-medium text-brand-text">Verificación de Tarifa</td>
                          <td className="px-3 py-2 text-brand-text-secondary font-mono">R91 / R79</td>
                          <td className="px-3 py-2 text-brand-text-secondary">Debe estar entre 34.5% y 40%</td>
                        </tr>
                        <tr className="hover:bg-brand-bg">
                          <td className="px-3 py-2 font-mono">4</td>
                          <td className="px-3 py-2 font-medium text-brand-text">Tasa Efectiva</td>
                          <td className="px-3 py-2 text-brand-text-secondary font-mono">R99 / R79</td>
                          <td className="px-3 py-2 text-brand-text-secondary">Informativo</td>
                        </tr>
                        <tr className="hover:bg-brand-bg">
                          <td className="px-3 py-2 font-mono">5</td>
                          <td className="px-3 py-2 font-medium text-brand-text">Proporción Compensaciones</td>
                          <td className="px-3 py-2 text-brand-text-secondary font-mono">R74 / R72</td>
                          <td className="px-3 py-2 text-brand-text-secondary">Alerta si {'>'} 20%. CRITICO si {'>'} 40%</td>
                        </tr>
                        <tr className="hover:bg-brand-bg">
                          <td className="px-3 py-2 font-mono">6</td>
                          <td className="px-3 py-2 font-medium text-brand-text">Proporción Rentas Exentas</td>
                          <td className="px-3 py-2 text-brand-text-secondary font-mono">R77 / R72</td>
                          <td className="px-3 py-2 text-brand-text-secondary">Alerta si {'>'} 30%. CRITICO si {'>'} 50%</td>
                        </tr>
                        <tr className="hover:bg-brand-bg">
                          <td className="px-3 py-2 font-mono">7</td>
                          <td className="px-3 py-2 font-medium text-brand-text">Nivel de Endeudamiento</td>
                          <td className="px-3 py-2 text-brand-text-secondary font-mono">R45 / R44</td>
                          <td className="px-3 py-2 text-brand-text-secondary">Informativo</td>
                        </tr>
                        <tr className="hover:bg-brand-bg">
                          <td className="px-3 py-2 font-mono">8</td>
                          <td className="px-3 py-2 font-medium text-brand-text">Retenciones vs Impuesto</td>
                          <td className="px-3 py-2 text-brand-text-secondary font-mono">R107 / R99</td>
                          <td className="px-3 py-2 text-brand-text-secondary">Informativo</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cruces de verificación */}
                <div className="mb-4">
                  <p className="font-semibold text-xs text-brand-text mb-2">Cruces de verificación</p>
                  <div className="space-y-2">
                    <div className="p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                      <p className="font-medium text-xs text-brand-text mb-1">9. Saldo a Favor vs Activos</p>
                      <p className="text-xs text-brand-text-secondary">Si Otros Activos (R43) {'<'} Saldo a Favor (R114) → el saldo no fue incluido en activos.</p>
                    </div>
                    <div className="p-3 bg-brand-bg/50 rounded-lg border border-brand-border">
                      <p className="font-medium text-xs text-brand-text mb-1">10. Autorretenciones vs Tarifa CIIU</p>
                      <p className="text-xs text-brand-text-secondary">(R61 + R70 + R80) × tarifa_CIIU vs R105. Verificación directa + inversa con tolerancia del 5%. Requiere tarifa de autorretención por código CIIU.</p>
                    </div>
                  </div>
                </div>

                {/* Validación legal */}
                <div className="mb-4">
                  <p className="font-semibold text-xs text-brand-text mb-2">Validación legal</p>
                  <div className="p-3 bg-error-bg rounded-lg border border-error-bg">
                    <p className="font-medium text-xs text-error-foreground mb-1">11. Gastos No Explicados (Art. 663 E.T.)</p>
                    <p className="text-xs text-brand-text-secondary">Fuentes = Ingresos Netos (R61) + (Pasivos actuales R45 − Pasivos anteriores R45). Si Fuentes {'<'} Total Costos y Gastos (R67) → existen gastos sin fuente de ingreso que los explique.</p>
                  </div>
                </div>

                {/* Datos externos */}
                <div className="mb-4">
                  <p className="font-semibold text-xs text-brand-text mb-2">Datos externos requeridos</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-brand-indigo/5 text-brand-indigo rounded-md border border-brand-indigo/20">
                      <FileSpreadsheet className="h-3 w-3" />
                      Datos sectoriales DIAN (promedio utilidad por CIIU)
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-brand-indigo/5 text-brand-indigo rounded-md border border-brand-indigo/20">
                      <Calculator className="h-3 w-3" />
                      Tarifas de autorretención por CIIU
                    </span>
                  </div>
                </div>

                {/* Riesgo Global */}
                <div className="p-4 bg-warning-bg rounded-lg border border-warning-bg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-warning-foreground">Riesgo Global</p>
                      <ul className="text-xs text-warning mt-1 space-y-1 list-disc list-inside">
                        <li>Si hay algún índice <strong>CRITICO</strong> → Global CRITICO</li>
                        <li>Si hay ≥2 ALTO → Global ALTO</li>
                        <li>Si hay ≥1 ALTO o ≥3 MEDIO → Global MEDIO</li>
                        <li>De lo contrario → Global BAJO</li>
                      </ul>
                      <p className="text-xs text-warning mt-2">Se generan recomendaciones automáticas solo para índices con riesgo ALTO o CRITICO.</p>
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
        <p className="text-sm text-brand-text-secondary">
          Análisis generado el {new Date(results.analysis_timestamp).toLocaleString('es-CO')}
        </p>
      </div>
    </div>
  )
}
