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
      type: "spring" as const,
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
  if (percentage === null) return 'text-brand-text-secondary'
  if (percentage < 10) return 'text-success'
  if (percentage < 30) return 'text-warning'
  return 'text-error'
}

const getPercentageBgColor = (percentage: number | null): string => {
  if (percentage === null) return 'bg-brand-bg'
  if (percentage < 10) return 'bg-success-bg'
  if (percentage < 30) return 'bg-warning-bg'
  return 'bg-error-bg'
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
      className="bg-white rounded-xl shadow-lg border border-brand-border overflow-hidden"
    >
      {/* Header */}
      <motion.div
        className={cn("px-6 py-4 border-b border-brand-border cursor-pointer", colorClass)}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 bg-white rounded-lg shadow-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {icon}
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-brand-text">
                {block.block_name}
              </h3>
              <p className="text-sm text-brand-text-secondary">
                Base: {block.base_field} - {formatCurrency(block.base_value)}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="text-brand-text-secondary"
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
                        <span className="text-brand-text-secondary text-xs px-2 py-0.5 bg-brand-bg-alt rounded">
                          Línea {field.line_number}
                        </span>
                        <span className="font-medium text-brand-text">
                          {field.field_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-brand-text-secondary">
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
                      <div className="w-full bg-brand-bg-alt rounded-full h-2.5 overflow-hidden">
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
                  className="mt-4 p-4 bg-warning-bg border border-warning-bg rounded-lg"
                >
                  <div className="flex items-center gap-2 text-warning-foreground">
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
          <div className="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-brand-indigo/10 rounded-full blur-3xl" />
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
              icon={<BarChart3 className="h-5 w-5 text-brand-indigo" />}
              colorClass="bg-brand-indigo/5"
              index={0}
            />

            {/* Resultados Block */}
            <AnalysisBlockCard
              block={displayYear.resultados_block}
              icon={<TrendingUp className="h-5 w-5 text-success" />}
              colorClass="bg-success-bg"
              index={1}
            />

            {/* Impuestos Block */}
            <AnalysisBlockCard
              block={displayYear.impuestos_block}
              icon={<TrendingDown className="h-5 w-5 text-warning" />}
              colorClass="bg-warning-bg"
              index={2}
            />

            {/* Pagos y Saldos Block */}
            <AnalysisBlockCard
              block={displayYear.pagos_saldos_block}
              icon={<BarChart3 className="h-5 w-5 text-brand-indigo" />}
              colorClass="bg-brand-indigo/5"
              index={3}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Key Insights */}
      {displayYear.key_insights && displayYear.key_insights.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-lg border border-brand-border p-6 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <motion.div
              className="p-2 bg-warning-bg rounded-full"
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Info className="h-5 w-5 text-warning" />
            </motion.div>
            <h3 className="text-lg font-bold text-brand-text">
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
                className="flex items-start gap-2 p-3 bg-brand-bg rounded-lg transition-colors cursor-default"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.1 + 0.2, type: "spring" }}
                  className="text-brand-indigo font-bold"
                >
                  ✓
                </motion.span>
                <p className="text-sm text-brand-text">{insight}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Structure Comparison - Cambios Significativos */}
      {structureComparison && structureComparison.cambios_significativos.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-lg border border-brand-border overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-600 via-indigo-700 to-purple-700 px-6 py-4 border-b border-brand-border"
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
                <p className="text-sm text-white/80">
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
                    className="border-b-2 border-brand-border"
                  >
                    <th className="text-left py-3 px-4 font-semibold text-brand-text">Campo</th>
                    <th className="text-center py-3 px-4 font-semibold text-brand-text">Línea</th>
                    <th className="text-right py-3 px-4 font-semibold text-brand-text">% Anterior</th>
                    <th className="text-right py-3 px-4 font-semibold text-brand-text">% Actual</th>
                    <th className="text-right py-3 px-4 font-semibold text-brand-text">Cambio</th>
                    <th className="text-left py-3 px-4 font-semibold text-brand-text">Interpretación</th>
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
                        className="border-b border-brand-border transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-brand-text">
                          {change.campo}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-brand-bg-alt rounded text-brand-text-secondary text-sm">
                            {change.linea}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-brand-text-secondary">
                          {change.porcentaje_anterior}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-brand-text">
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
                                ? "text-success-foreground bg-success-bg"
                                : "text-error-foreground bg-error-bg"
                            )}
                          >
                            {change.cambio_puntos_porcentuales}
                          </motion.span>
                        </td>
                        <td className="py-3 px-4 text-sm text-brand-text-secondary">
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
          className="bg-white rounded-xl shadow-lg border border-brand-border overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "px-6 py-4 border-b border-brand-border",
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
                  displayTaxCoherence.riesgo_global === 'BAJO' && "bg-white text-success-foreground",
                  displayTaxCoherence.riesgo_global === 'MEDIO' && "bg-white text-warning-foreground",
                  displayTaxCoherence.riesgo_global === 'ALTO' && "bg-white text-warning",
                  displayTaxCoherence.riesgo_global === 'CRITICO' && "bg-white text-error-foreground"
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
                displayTaxCoherence.riesgo_global === 'BAJO' && "bg-success-bg border-success-bg",
                displayTaxCoherence.riesgo_global === 'MEDIO' && "bg-warning-bg border-warning-bg",
                displayTaxCoherence.riesgo_global === 'ALTO' && "bg-warning-bg border-warning-bg",
                displayTaxCoherence.riesgo_global === 'CRITICO' && "bg-error-bg border-error-bg"
              )}
            >
              <p className={cn(
                "text-sm font-medium",
                displayTaxCoherence.riesgo_global === 'BAJO' && "text-success-foreground",
                displayTaxCoherence.riesgo_global === 'MEDIO' && "text-warning-foreground",
                displayTaxCoherence.riesgo_global === 'ALTO' && "text-warning-foreground",
                displayTaxCoherence.riesgo_global === 'CRITICO' && "text-error-foreground"
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
                className="text-lg font-bold text-brand-text mb-4"
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
                      evaluation.nivel_riesgo === 'BAJO' && "bg-success-bg border-success-bg",
                      evaluation.nivel_riesgo === 'MEDIO' && "bg-warning-bg border-warning-bg",
                      evaluation.nivel_riesgo === 'ALTO' && "bg-warning-bg border-warning-bg",
                      evaluation.nivel_riesgo === 'CRITICO' && "bg-error-bg border-error-bg"
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
                        <h5 className="font-semibold text-brand-text mb-1">
                          {evaluation.indice}
                        </h5>
                        <div className="space-y-1 text-sm">
                          <p className="text-brand-text">
                            <span className="font-medium">Contribuyente:</span> {evaluation.valor_contribuyente}
                          </p>
                          {evaluation.valor_sector && (
                            <p className="text-brand-text">
                              <span className="font-medium">Sector:</span> {evaluation.valor_sector}
                            </p>
                          )}
                          {evaluation.diferencia && (
                            <p className={cn(
                              "font-semibold",
                              evaluation.nivel_riesgo === 'BAJO' && "text-success-foreground",
                              evaluation.nivel_riesgo === 'MEDIO' && "text-warning-foreground",
                              evaluation.nivel_riesgo === 'ALTO' && "text-warning-foreground",
                              evaluation.nivel_riesgo === 'CRITICO' && "text-error-foreground"
                            )}>
                              <span className="font-medium">Diferencia:</span> {evaluation.diferencia}
                            </p>
                          )}
                          <p className="text-brand-text-secondary italic">
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
                  className="text-lg font-bold text-brand-text mb-4"
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
                      className="flex items-start gap-2 p-3 bg-brand-indigo/5 rounded-lg border border-brand-indigo/20 transition-colors cursor-default"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 + 0.7, type: "spring" }}
                      >
                        <CheckCircle className="h-5 w-5 text-brand-indigo flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <p className="text-sm text-brand-indigo">{rec}</p>
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
