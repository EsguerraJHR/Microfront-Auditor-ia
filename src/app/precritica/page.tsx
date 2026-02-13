"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  FileSearch,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  Trash2,
  Eye,
  Loader2,
  History,
  AlertCircle
} from "lucide-react"
import { ComparativeAnalysisModal } from "@/components/ui/comparative-analysis-modal"
import { ComparativeAnalysisResults } from "@/components/ui/comparative-analysis-results"
import { ComparativeAnalysisResponse, RevisionResponse, comparativeAnalysisService } from "@/lib/api/comparative-analysis-service"

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

const features = [
  {
    icon: TrendingUp,
    title: "Análisis de Variaciones",
    description: "Detecta cambios significativos en patrimonio, ingresos, gastos y renta líquida",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  {
    icon: FileSearch,
    title: "Comparación Detallada",
    description: "Compara campo por campo las declaraciones de dos años consecutivos",
    color: "text-brand-indigo",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30"
  },
  {
    icon: Shield,
    title: "Detección de Anomalías",
    description: "Identifica inconsistencias y variaciones atípicas para revisión",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30"
  },
  {
    icon: Target,
    title: "Análisis Vertical",
    description: "Evalúa la estructura porcentual y coherencia tributaria",
    color: "text-brand-navy",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30"
  }
]

const stats = [
  { value: "100%", label: "Precisión en cálculos", icon: CheckCircle2 },
  { value: "<30s", label: "Tiempo de análisis", icon: Clock },
  { value: "50+", label: "Campos analizados", icon: BarChart3 }
]

export default function PrecriticaPage() {
  const [showComparativeModal, setShowComparativeModal] = useState(false)
  const [comparativeAnalysisResult, setComparativeAnalysisResult] = useState<ComparativeAnalysisResponse | null>(null)

  // Revision history
  const [revisions, setRevisions] = useState<RevisionResponse[]>([])
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false)
  const [deletingRevisionId, setDeletingRevisionId] = useState<string | null>(null)
  const [loadingRevisionId, setLoadingRevisionId] = useState<string | null>(null)
  const [revisionError, setRevisionError] = useState<string | null>(null)

  const loadRevisions = useCallback(async () => {
    setIsLoadingRevisions(true)
    setRevisionError(null)
    try {
      const data = await comparativeAnalysisService.listRevisions()
      setRevisions(data)
    } catch (error) {
      console.error('Error loading revisions:', error)
      setRevisionError('No se pudieron cargar las revisiones')
    } finally {
      setIsLoadingRevisions(false)
    }
  }, [])

  useEffect(() => {
    loadRevisions()
  }, [loadRevisions])

  const handleDeleteRevision = async (id: number | string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta revisión?')) return

    const idStr = String(id)
    setDeletingRevisionId(idStr)
    try {
      await comparativeAnalysisService.deleteRevision(idStr)
      setRevisions(prev => prev.filter(r => String(r.id) !== idStr))
    } catch (error) {
      console.error('Error deleting revision:', error)
      alert('Error al eliminar la revisión')
    } finally {
      setDeletingRevisionId(null)
    }
  }

  const handleViewRevision = async (revision: RevisionResponse) => {
    const idStr = String(revision.id)
    setLoadingRevisionId(idStr)
    try {
      // Always fetch full revision to get analysis_data
      const fullRevision = await comparativeAnalysisService.getRevision(idStr)
      if (fullRevision.analysis_data) {
        setComparativeAnalysisResult(fullRevision.analysis_data)
      } else {
        alert('Esta revisión aún no tiene resultados de análisis.')
      }
    } catch (error) {
      console.error('Error fetching revision:', error)
      alert('Error al cargar los resultados de la revisión')
    } finally {
      setLoadingRevisionId(null)
    }
  }

  const handleComparativeAnalysisComplete = (result: ComparativeAnalysisResponse) => {
    setComparativeAnalysisResult(result)
    loadRevisions()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <AnimatePresence mode="wait">
        {!comparativeAnalysisResult ? (
          <motion.div
            key="landing"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95 }}
            variants={containerVariants}
            className="space-y-12"
          >
            {/* Hero Section */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-brand-indigo to-indigo-500 p-8 md:p-12"
            >
              {/* Background decorations */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium mb-6"
                >
                  <Sparkles className="h-4 w-4" />
                  Análisis Inteligente con IA
                </motion.div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                  <span className="text-indigo-200">Diagnostico Tributario</span>
                </h1>

                <p className="text-lg text-white/90 max-w-2xl mb-8">
                  Compara y analiza declaraciones de renta de dos años consecutivos.
                  Detecta variaciones significativas, anomalías y genera reportes detallados
                  para una revisión fiscal eficiente.
                </p>

                <motion.button
                  onClick={() => setShowComparativeModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group inline-flex items-center gap-3 bg-white text-brand-indigo px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-brand-navy/25 hover:shadow-xl hover:shadow-brand-navy/30 transition-shadow"
                >
                  <BarChart3 className="h-5 w-5" />
                  Iniciar Análisis Comparativo
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-8 right-8 hidden lg:block"
              >
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute bottom-8 right-32 hidden lg:block"
              >
                <div className="w-16 h-16 bg-yellow-300/30 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </motion.div>
            </motion.div>

            {/* Stats Section */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <stat.icon className="h-6 w-6 text-brand-indigo mx-auto mb-3" />
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Revision History Section */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <History className="h-6 w-6 text-brand-indigo" />
                  <h2 className="text-2xl font-bold text-foreground">
                    Historial de Revisiones
                  </h2>
                </div>
                {!isLoadingRevisions && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadRevisions}
                    className="text-sm text-brand-indigo hover:text-brand-indigo-hover font-medium"
                  >
                    Actualizar
                  </motion.button>
                )}
              </div>

              {isLoadingRevisions ? (
                <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <Loader2 className="h-6 w-6 text-brand-indigo animate-spin mr-3" />
                  <span className="text-muted-foreground">Cargando revisiones...</span>
                </div>
              ) : revisionError ? (
                <div className="flex items-center justify-center gap-3 py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-muted-foreground">{revisionError}</span>
                </div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                  <History className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay revisiones aún.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inicia un análisis comparativo para crear tu primera revisión.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Cliente</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">NIT</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Mes</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Fecha</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Estado</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {revisions.map((revision) => (
                          <motion.tr
                            key={revision.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-foreground">{revision.nombre_cliente}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{revision.nit}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{revision.mes}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{revision.fecha_revision}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                revision.status === 'completed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : revision.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}>
                                {revision.status === 'completed' ? 'Completado' : revision.status === 'pending' ? 'Pendiente' : revision.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleViewRevision(revision)}
                                  disabled={loadingRevisionId === String(revision.id)}
                                  className="p-2 text-brand-indigo hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50"
                                  title="Ver resultados"
                                >
                                  {loadingRevisionId === String(revision.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteRevision(revision.id)}
                                  disabled={deletingRevisionId === String(revision.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                  title="Eliminar revisión"
                                >
                                  {deletingRevisionId === String(revision.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Features Section */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                ¿Qué incluye el análisis?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-xl font-bold text-foreground mb-3">
                ¿Listo para comenzar?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Sube las declaraciones de renta de dos años consecutivos y obtén un análisis
                detallado en segundos.
              </p>
              <motion.button
                onClick={() => setShowComparativeModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo-hover text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                <BarChart3 className="h-5 w-5" />
                Comenzar Análisis
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setComparativeAnalysisResult(null)}
              className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Volver al inicio
            </motion.button>

            <ComparativeAnalysisResults
              results={comparativeAnalysisResult}
              onClose={() => setComparativeAnalysisResult(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparative Analysis Modal */}
      <ComparativeAnalysisModal
        isOpen={showComparativeModal}
        onClose={() => setShowComparativeModal(false)}
        onAnalysisComplete={handleComparativeAnalysisComplete}
      />
    </div>
  )
}