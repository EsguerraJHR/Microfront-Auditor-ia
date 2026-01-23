"use client"

import React, { useState } from "react"
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
  Target
} from "lucide-react"
import { ComparativeAnalysisModal } from "@/components/ui/comparative-analysis-modal"
import { ComparativeAnalysisResults } from "@/components/ui/comparative-analysis-results"
import { ComparativeAnalysisResponse } from "@/lib/api/comparative-analysis-service"

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
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30"
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
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30"
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

  const handleComparativeAnalysisComplete = (result: ComparativeAnalysisResponse) => {
    setComparativeAnalysisResult(result)
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
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-500 p-8 md:p-12"
            >
              {/* Background decorations */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl" />
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
                  Pre-Crítica de
                  <br />
                  <span className="text-yellow-200">Declaraciones de Renta</span>
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
                  className="group inline-flex items-center gap-3 bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-orange-700/25 hover:shadow-xl hover:shadow-orange-700/30 transition-shadow"
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
                  <stat.icon className="h-6 w-6 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
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
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
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