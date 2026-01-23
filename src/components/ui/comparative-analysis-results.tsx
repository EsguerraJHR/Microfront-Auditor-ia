"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, Building, Calendar, X, Download, FileSpreadsheet, BarChart3, CheckCircle, Sparkles, ArrowUpRight, ArrowDownRight, FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAuthHeaders } from "@/lib/utils/api-helpers"
import { ComparativeAnalysisResponse, VariationAnalysis } from "@/lib/api/comparative-analysis-service"
import { ExcelExportService } from "@/lib/services/excel-export"
import { VerticalAnalysisView } from "./vertical-analysis-view"
import { StructureComparisonView } from "./structure-comparison-view"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100
    }
  }
}

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
  index?: number
}

function AnalysisCard({ title, analysis, icon, index = 0 }: AnalysisCardProps) {
  const isPositive = analysis.relative_variation > 0
  const isNegative = analysis.relative_variation < 0

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={cn(
        "border rounded-xl p-5 space-y-4 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden",
        getVariationBgColor(analysis.relative_variation)
      )}
    >
      {/* Background decoration */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30",
        isPositive ? "bg-green-300" : isNegative ? "bg-red-300" : "bg-gray-300"
      )} />

      <div className="flex items-center gap-3 relative">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
          className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center"
        >
          {icon}
        </motion.div>
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
              isPositive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
              isNegative ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
              "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : isNegative ? <ArrowDownRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {formatCurrency(Math.abs(analysis.nominal_variation))}
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          className={cn("text-lg font-bold", getVariationColor(analysis.relative_variation, analysis.variation_percentage))}
        >
          {analysis.variation_percentage && analysis.variation_percentage.includes('∞') ? (
            <div className="flex flex-col items-end">
              <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                Nuevo
              </span>
            </div>
          ) : (
            formatPercentage(analysis.variation_percentage || '0', analysis)
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export function ComparativeAnalysisResults({ results, onClose }: ComparativeAnalysisResultsProps) {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'details' | 'vertical' | 'structure'>('summary')
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

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
      console.log('Archivo Excel exportado exitosamente')
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
      console.log('Archivo Excel formato Contexto exportado exitosamente')
    } catch (error) {
      console.error('Error al exportar formato Contexto:', error)
      alert('Error al exportar formato Contexto. Por favor, inténtalo de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const tabs = [
    { key: 'summary', label: 'Resumen Ejecutivo', show: true },
    { key: 'details', label: 'Análisis Detallado', show: true },
    { key: 'vertical', label: 'Análisis Vertical', show: !!results.analisis_vertical_declaracion_current },
    { key: 'structure', label: 'Cambios Estructurales', show: !!results.estructura_comparacion }
  ].filter(tab => tab.show)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-14 h-14 rounded-xl bg-green-500/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30"
              >
                <CheckCircle className="h-7 w-7 text-green-400" />
              </motion.div>
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 mb-1"
                >
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">Análisis Completado</span>
                </motion.div>
                <h2 className="text-2xl font-bold text-white">
                  {results.razon_social}
                </h2>
                <p className="text-slate-300 text-sm">
                  NIT: {results.nit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(249, 115, 22, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              </motion.button>
              {onClose && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Año Actual - Primero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-4 text-center border border-blue-500/30"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span className="text-3xl font-bold text-white">{results.current_year}</span>
              </div>
              <p className="text-sm text-blue-300">Año Actual</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-slate-600/50 backdrop-blur-sm flex items-center justify-center border border-slate-500/30">
                <BarChart3 className="h-8 w-8 text-slate-300" />
              </div>
            </motion.div>

            {/* Año Anterior - Segundo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-600/30 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-500/30"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-slate-400" />
                <span className="text-3xl font-bold text-slate-200">{results.previous_year}</span>
              </div>
              <p className="text-sm text-slate-400">Año Anterior</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 bg-green-500/10 backdrop-blur-sm rounded-lg border border-green-500/20"
          >
            <p className="text-sm text-center text-green-300">
              {results.message}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors min-w-[120px]",
              selectedTab === tab.key
                ? "text-orange-600 dark:text-orange-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            {selectedTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {selectedTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnalysisCard
                title="Patrimonio"
                analysis={results.patrimonio_analysis}
                icon={<Building className="h-5 w-5 text-blue-600" />}
                index={0}
              />
              <AnalysisCard
                title="Ingresos"
                analysis={results.ingresos_analysis}
                icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                index={1}
              />
              <AnalysisCard
                title="Gastos"
                analysis={results.gastos_analysis}
                icon={<TrendingDown className="h-5 w-5 text-red-600" />}
                index={2}
              />
              <AnalysisCard
                title="Renta Líquida"
                analysis={results.renta_liquida_analysis}
                icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
                index={3}
              />
              <AnalysisCard
                title="Impuesto"
                analysis={results.impuesto_analysis}
                icon={<FileSpreadsheet className="h-5 w-5 text-yellow-600" />}
                index={4}
              />
            </motion.div>

            {/* Summary Information */}
            {Object.keys(results.summary).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm"
              >
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
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <span className="text-muted-foreground text-sm">Campos analizados</span>
                          <span className="font-bold text-lg">{results.summary.total_fields_analyzed}</span>
                        </motion.div>
                      )}
                      {results.summary.fields_with_increases && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                        >
                          <span className="text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4" />
                            Con incremento
                          </span>
                          <span className="font-bold text-lg text-green-600">{results.summary.fields_with_increases}</span>
                        </motion.div>
                      )}
                      {results.summary.fields_with_decreases && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                        >
                          <span className="text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                            <ArrowDownRight className="h-4 w-4" />
                            Con disminución
                          </span>
                          <span className="font-bold text-lg text-red-600">{results.summary.fields_with_decreases}</span>
                        </motion.div>
                      )}
                      {results.summary.fields_unchanged && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <span className="text-muted-foreground text-sm flex items-center gap-2">
                            <Minus className="h-4 w-4" />
                            Sin cambio
                          </span>
                          <span className="font-bold text-lg text-gray-600">{results.summary.fields_unchanged}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Insights Clave */}
                  {results.summary.key_insights && Array.isArray(results.summary.key_insights) && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground text-sm">Insights Clave</h4>
                      <div className="space-y-3">
                        {results.summary.key_insights.map((insight: string, index: number) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-l-4 border-blue-500"
                          >
                            <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
                          </motion.div>
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
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
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
                        </motion.div>
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
              </motion.div>
            )}
          </motion.div>
        )}

        {selectedTab === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* All Variations Table */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-6 py-5 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border-b border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                    >
                      <FileSpreadsheet className="h-5 w-5 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Análisis Detallado de Variaciones</h3>
                      <p className="text-slate-300 text-sm">{results.all_variations.length} campos analizados</p>
                    </div>
                  </div>
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(249, 115, 22, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExportContexto}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    title="Exportar en formato Contexto.xlsx"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {isExporting ? 'Exportando...' : 'Exportar Excel'}
                  </motion.button>
                </div>
              </motion.div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
                    >
                      <th className="px-5 py-4 text-left font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Campo</th>
                      <th className="px-5 py-4 text-center font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Línea</th>
                      <th className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Año Anterior</th>
                      <th className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Año Actual</th>
                      <th className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">Variación</th>
                      <th className="px-5 py-4 text-right font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">%</th>
                    </motion.tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {results.all_variations.map((variation, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.4 + index * 0.03,
                          type: "spring",
                          stiffness: 100,
                          damping: 15
                        }}
                        whileHover={{
                          backgroundColor: variation.relative_variation > 0
                            ? "rgba(34, 197, 94, 0.08)"
                            : variation.relative_variation < 0
                              ? "rgba(239, 68, 68, 0.08)"
                              : "rgba(107, 114, 128, 0.08)",
                          scale: 1.005,
                          transition: { duration: 0.2 }
                        }}
                        className="group cursor-pointer"
                      >
                        <td className="px-5 py-4">
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 + index * 0.03 }}
                            className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                          >
                            {variation.field_name}
                          </motion.span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.03, type: "spring" }}
                            className="inline-flex items-center justify-center w-10 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300"
                          >
                            {variation.line_number}
                          </motion.span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-mono text-gray-600 dark:text-gray-400">
                            {formatCurrency(variation.previous_value)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + index * 0.03 }}
                            className="font-mono font-semibold text-gray-900 dark:text-gray-100"
                          >
                            {formatCurrency(variation.current_value)}
                          </motion.span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.03, type: "spring" }}
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
                          </motion.div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {variation.variation_percentage && variation.variation_percentage.includes('∞') ? (
                            <motion.span
                              initial={{ scale: 0, rotate: -10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.7 + index * 0.03, type: "spring" }}
                              whileHover={{ scale: 1.1 }}
                              className="inline-flex px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-md"
                            >
                              Nuevo
                            </motion.span>
                          ) : (
                            <motion.span
                              initial={{ scale: 0, rotate: 10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.7 + index * 0.03, type: "spring" }}
                              whileHover={{ scale: 1.1 }}
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
                            </motion.span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer con resumen */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700"
              >
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
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Vertical Analysis Tab */}
        {selectedTab === 'vertical' && results.analisis_vertical_declaracion_current && (
          <motion.div
            key="vertical"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <VerticalAnalysisView
              currentYear={results.analisis_vertical_declaracion_current}
              previousYear={results.analisis_vertical_declaracion_previous}
              structureComparison={results.estructura_comparacion}
              taxCoherenceCurrent={results.coherencia_tributaria_current}
              taxCoherencePrevious={results.coherencia_tributaria_previous}
            />
          </motion.div>
        )}

        {/* Structure Comparison Tab */}
        {selectedTab === 'structure' && results.estructura_comparacion && (
          <motion.div
            key="structure"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StructureComparisonView comparison={results.estructura_comparacion} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-4"
      >
        <p className="text-sm text-muted-foreground">
          Análisis generado el {new Date(results.analysis_timestamp).toLocaleString('es-CO')}
        </p>
      </motion.div>
    </motion.div>
  )
}