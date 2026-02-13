"use client"

import { motion } from "framer-motion"
import { FileText, Receipt, ShoppingCart, Database, ArrowRight, BarChart3, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

interface AnalysisOption {
  title: string
  description: string
  href: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  available: boolean
}

const analysisOptions: AnalysisOption[] = [
  {
    title: "Declaración de Renta",
    description: "Extracción y análisis de declaraciones de renta. Incluye validación de pagos, calendario tributario y comparación año a año.",
    href: "/analisis-eficacia/analisis-declaraciones-renta",
    icon: FileText,
    color: "text-brand-navy",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    borderColor: "border-indigo-200 dark:border-indigo-800 hover:border-brand-indigo dark:hover:border-indigo-600",
    available: true
  },
  {
    title: "Declaración de IVA",
    description: "Análisis y validación de declaraciones de IVA. Verificación de bases gravables, tarifas aplicadas y cruce con información exógena.",
    href: "/analisis-eficacia/analisis-declaraciones-iva",
    icon: Receipt,
    color: "text-brand-indigo",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    borderColor: "border-indigo-200 dark:border-indigo-800 hover:border-brand-indigo dark:hover:border-indigo-600",
    available: true
  },
  {
    title: "Declaración del Impuesto al Consumo",
    description: "Revisión de declaraciones del impuesto al consumo. Control de productos gravados, tarifas especiales y retenciones.",
    href: "/analisis-eficacia/analisis-impuesto-consumo",
    icon: ShoppingCart,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600",
    available: false
  },
  {
    title: "Información Exógena",
    description: "Análisis y validación de reportes de información exógena. Cruce de datos con terceros, detección de inconsistencias y alertas.",
    href: "/analisis-eficacia/analisis-informacion-exogena",
    icon: Database,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600",
    available: false
  }
]

export default function AnalisisEficaciaPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12"
      >
        {/* Hero Section */}
        <motion.section
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-indigo to-indigo-500 rounded-2xl p-8 md:p-12 shadow-xl"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
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
            className="absolute top-8 right-8 md:right-16 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <BarChart3 className="h-8 w-8 text-white" />
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
            className="absolute bottom-8 right-24 md:right-32 w-12 h-12 bg-indigo-400/30 backdrop-blur-sm rounded-lg flex items-center justify-center"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.div>

          {/* Content */}
          <div className="relative z-10 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Análisis con Inteligencia Artificial
            </motion.div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Análisis de Eficacia
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl">
              Evaluación integral de la eficiencia de los procesos contables y tributarios.
              Selecciona el tipo de análisis que deseas realizar.
            </p>
          </div>
        </motion.section>

        {/* Analysis Options Grid */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-navy to-brand-indigo flex items-center justify-center shadow-lg shadow-brand-navy/25">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Tipos de Análisis</h2>
              <p className="text-muted-foreground text-sm">Selecciona el módulo de análisis que deseas utilizar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysisOptions.map((option, index) => {
              const Icon = option.icon

              if (option.available) {
                return (
                  <Link key={option.title} href={option.href}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group bg-white dark:bg-gray-900 border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg",
                        option.borderColor
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                          option.bgColor
                        )}>
                          <Icon className={cn("h-7 w-7", option.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-brand-indigo dark:group-hover:text-indigo-400 transition-colors">
                              {option.title}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-indigo group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                )
              }

              return (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={cn(
                    "relative bg-white dark:bg-gray-900 border-2 rounded-xl p-6 opacity-60",
                    option.borderColor.split(' ')[0],
                    "dark:border-gray-700"
                  )}
                >
                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      Próximamente
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                      "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <Icon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        {option.title}
                      </h3>
                      <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Info Section */}
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-indigo/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-brand-indigo" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy dark:text-indigo-100 mb-2">
                  Análisis impulsado por IA
                </h3>
                <p className="text-brand-text dark:text-indigo-300 text-sm leading-relaxed">
                  Nuestros módulos de análisis utilizan inteligencia artificial para extraer, validar y analizar
                  información de documentos tributarios. Cada módulo está optimizado para su tipo específico de
                  declaración, garantizando precisión y eficiencia en el proceso de auditoría.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
