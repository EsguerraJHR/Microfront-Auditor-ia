"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, AlertCircle, Info, PieChart, Activity, Shield, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import {
  VerticalAnalysisYear,
  VerticalAnalysisBlock,
  VerticalAnalysisField,
  StructureComparison,
  TaxCoherenceData
} from '@/lib/api/comparative-analysis-service'
import { cn } from '@/lib/utils'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
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
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  })
}

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
  index: number
}

const AnalysisBlockCard: React.FC<AnalysisBlockCardProps> = ({ block, icon, colorClass, index }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ scale: 1.01 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <motion.div
        className={cn("px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer", colorClass)}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {icon}
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {block.block_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Base: {block.base_field} - {formatCurrency(block.base_value)}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="text-gray-500"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6">
              {/* Progress Bars */}
              <div className="space-y-4">
                {block.fields.map((field, fieldIndex) => (
                  <motion.div
                    key={field.line_number}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: fieldIndex * 0.05,
                      type: "spring",
                      stiffness: 100
                    }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
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
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: fieldIndex * 0.05 + 0.2, type: "spring" }}
                          className={cn(
                            "font-bold min-w-[70px] text-right px-2 py-0.5 rounded",
                            getPercentageColor(field.percentage),
                            getPercentageBgColor(field.percentage)
                          )}
                        >
                          {field.percentage_formatted || 'N/A'}
                        </motion.span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {field.percentage !== null && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(field.percentage, 100)}%` }}
                          transition={{
                            delay: fieldIndex * 0.05 + 0.1,
                            duration: 0.8,
                            ease: "easeOut"
                          }}
                          className={cn(
                            "h-2.5 rounded-full",
                            field.percentage < 10 && "bg-gradient-to-r from-green-400 to-green-500",
                            field.percentage >= 10 && field.percentage < 30 && "bg-gradient-to-r from-yellow-400 to-yellow-500",
                            field.percentage >= 30 && "bg-gradient-to-r from-red-400 to-red-500"
                          )}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Table View for Base = 0 */}
              {block.base_value === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      No se puede calcular análisis vertical (base = 0)
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header with Year Tabs */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-slate-600 via-slate-700 to-blue-800 rounded-xl p-6 border border-slate-500 shadow-xl overflow-hidden relative"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex items-center gap-3"
            >
              <motion.div
                className="p-3 bg-white/10 backdrop-blur-sm rounded-xl"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <PieChart className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Análisis Vertical
                </h2>
                <p className="text-sm text-slate-300">
                  {displayYear.razon_social || displayYear.nit}
                </p>
              </div>
            </motion.div>

            {/* Year Selector */}
            {previousYear && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1"
              >
                <button
                  onClick={() => setSelectedYear('current')}
                  className={cn(
                    "relative px-4 py-2 rounded-md font-medium transition-colors",
                    selectedYear === 'current'
                      ? "text-slate-800"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  {selectedYear === 'current' && (
                    <motion.div
                      layoutId="yearTabIndicator"
                      className="absolute inset-0 bg-white rounded-md shadow-lg"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{currentYear.year}</span>
                </button>
                <button
                  onClick={() => setSelectedYear('previous')}
                  className={cn(
                    "relative px-4 py-2 rounded-md font-medium transition-colors",
                    selectedYear === 'previous'
                      ? "text-slate-800"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  {selectedYear === 'previous' && (
                    <motion.div
                      layoutId="yearTabIndicator"
                      className="absolute inset-0 bg-white rounded-md shadow-lg"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{previousYear.year}</span>
                </button>
              </motion.div>
            )}
          </div>

          {/* Info Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-2 text-sm text-slate-200"
          >
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              El análisis vertical muestra la composición porcentual de cada partida respecto a su base.
              Ayuda a identificar la estructura financiera y evaluar la importancia relativa de cada componente.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Analysis Blocks */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedYear}
            initial={{ opacity: 0, x: selectedYear === 'current' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: selectedYear === 'current' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Patrimonio Block */}
            <AnalysisBlockCard
              block={displayYear.patrimonio_block}
              icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
              colorClass="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30"
              index={0}
            />

            {/* Resultados Block */}
            <AnalysisBlockCard
              block={displayYear.resultados_block}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              colorClass="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30"
              index={1}
            />

            {/* Impuestos Block */}
            <AnalysisBlockCard
              block={displayYear.impuestos_block}
              icon={<TrendingDown className="h-5 w-5 text-orange-600" />}
              colorClass="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/30"
              index={2}
            />

            {/* Pagos y Saldos Block */}
            <AnalysisBlockCard
              block={displayYear.pagos_saldos_block}
              icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
              colorClass="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30"
              index={3}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Key Insights */}
      {displayYear.key_insights && displayYear.key_insights.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <motion.div
              className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full"
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Info className="h-5 w-5 text-yellow-600" />
            </motion.div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              💡 Insights Clave
            </h3>
          </motion.div>
          <div className="space-y-2">
            {displayYear.key_insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: idx * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ x: 5, backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors cursor-default"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.1 + 0.2, type: "spring" }}
                  className="text-blue-600 font-bold"
                >
                  ✓
                </motion.span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Structure Comparison - Cambios Significativos */}
      {structureComparison && structureComparison.cambios_significativos.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-600 via-indigo-700 to-purple-700 px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-white/10 backdrop-blur-sm rounded-full"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <Activity className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  📊 Cambios Significativos en Estructura
                </h3>
                <p className="text-sm text-indigo-200">
                  {structureComparison.criterio_significancia} • {structureComparison.total_cambios_identificados} cambios detectados
                </p>
              </div>
            </div>
          </motion.div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b-2 border-gray-200 dark:border-gray-700"
                  >
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Campo</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Línea</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">% Anterior</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">% Actual</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Cambio</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">Interpretación</th>
                  </motion.tr>
                </thead>
                <tbody>
                  {structureComparison.cambios_significativos.map((change, idx) => {
                    const changeValue = parseFloat(change.cambio_puntos_porcentuales.replace(/[^\d.-]/g, ''))
                    const isPositive = changeValue > 0

                    return (
                      <motion.tr
                        key={idx}
                        custom={idx}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{
                          backgroundColor: isPositive
                            ? "rgba(34, 197, 94, 0.05)"
                            : "rgba(239, 68, 68, 0.05)"
                        }}
                        className="border-b border-gray-100 dark:border-gray-800 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          {change.campo}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 text-sm">
                            {change.linea}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {change.porcentaje_anterior}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {change.porcentaje_actual}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.05 + 0.3, type: "spring" }}
                            className={cn(
                              "font-bold px-2 py-1 rounded inline-block",
                              isPositive
                                ? "text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400"
                                : "text-red-700 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400"
                            )}
                          >
                            {change.cambio_puntos_porcentuales}
                          </motion.span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {change.interpretacion}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tax Coherence Analysis */}
      {displayTaxCoherence && (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "px-6 py-4 border-b border-gray-200 dark:border-gray-700",
              displayTaxCoherence.riesgo_global === 'BAJO' && "bg-gradient-to-r from-green-500 to-emerald-600",
              displayTaxCoherence.riesgo_global === 'MEDIO' && "bg-gradient-to-r from-yellow-500 to-amber-600",
              displayTaxCoherence.riesgo_global === 'ALTO' && "bg-gradient-to-r from-orange-500 to-red-500",
              displayTaxCoherence.riesgo_global === 'CRITICO' && "bg-gradient-to-r from-red-600 to-rose-700"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Shield className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    🛡️ Coherencia Tributaria {displayTaxCoherence.ano_gravable}
                  </h3>
                  <p className="text-sm text-white/80">
                    Riesgo Global: <span className="font-bold">{displayTaxCoherence.riesgo_global}</span>
                  </p>
                </div>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className={cn(
                  "px-4 py-2 rounded-full font-bold text-sm",
                  displayTaxCoherence.riesgo_global === 'BAJO' && "bg-white text-green-700",
                  displayTaxCoherence.riesgo_global === 'MEDIO' && "bg-white text-yellow-700",
                  displayTaxCoherence.riesgo_global === 'ALTO' && "bg-white text-orange-700",
                  displayTaxCoherence.riesgo_global === 'CRITICO' && "bg-white text-red-700"
                )}
              >
                {displayTaxCoherence.riesgo_global}
              </motion.div>
            </div>
          </motion.div>

          <div className="p-6 space-y-6">
            {/* Resumen Ejecutivo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "p-4 rounded-lg border",
                displayTaxCoherence.riesgo_global === 'BAJO' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                displayTaxCoherence.riesgo_global === 'MEDIO' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
                displayTaxCoherence.riesgo_global === 'ALTO' && "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
                displayTaxCoherence.riesgo_global === 'CRITICO' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              )}
            >
              <p className={cn(
                "text-sm font-medium",
                displayTaxCoherence.riesgo_global === 'BAJO' && "text-green-800 dark:text-green-200",
                displayTaxCoherence.riesgo_global === 'MEDIO' && "text-yellow-800 dark:text-yellow-200",
                displayTaxCoherence.riesgo_global === 'ALTO' && "text-orange-800 dark:text-orange-200",
                displayTaxCoherence.riesgo_global === 'CRITICO' && "text-red-800 dark:text-red-200"
              )}>
                {displayTaxCoherence.resumen_ejecutivo}
              </p>
            </motion.div>

            {/* Evaluaciones */}
            <div>
              <motion.h4
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4"
              >
                Evaluaciones de Índices
              </motion.h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayTaxCoherence.evaluaciones.map((evaluation, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: idx * 0.1 + 0.4,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={cn(
                      "p-4 rounded-lg border transition-shadow hover:shadow-md",
                      evaluation.nivel_riesgo === 'BAJO' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                      evaluation.nivel_riesgo === 'MEDIO' && "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
                      evaluation.nivel_riesgo === 'ALTO' && "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
                      evaluation.nivel_riesgo === 'CRITICO' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 + 0.5, type: "spring" }}
                        className="text-2xl"
                      >
                        {evaluation.icono}
                      </motion.span>
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
                              evaluation.nivel_riesgo === 'BAJO' && "text-green-700 dark:text-green-400",
                              evaluation.nivel_riesgo === 'MEDIO' && "text-yellow-700 dark:text-yellow-400",
                              evaluation.nivel_riesgo === 'ALTO' && "text-orange-700 dark:text-orange-400",
                              evaluation.nivel_riesgo === 'CRITICO' && "text-red-700 dark:text-red-400"
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
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recomendaciones */}
            {displayTaxCoherence.recomendaciones && displayTaxCoherence.recomendaciones.length > 0 && (
              <div>
                <motion.h4
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4"
                >
                  📋 Recomendaciones
                </motion.h4>
                <div className="space-y-2">
                  {displayTaxCoherence.recomendaciones.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: idx * 0.1 + 0.6,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ x: 5, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                      className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-default"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 + 0.7, type: "spring" }}
                      >
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <p className="text-sm text-blue-900 dark:text-blue-100">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
