"use client"

import { motion } from "framer-motion"
import { FileText, Receipt, ShoppingCart, Database, ArrowRight, BarChart3, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { animations } from "@/lib/design-tokens"

interface AnalysisOption {
  title: string
  description: string
  href: string
  icon: React.ElementType
  available: boolean
}

const analysisOptions: AnalysisOption[] = [
  {
    title: "Declaracion de Renta",
    description: "Extraccion y analisis de declaraciones de renta. Incluye validacion de pagos, calendario tributario y comparacion ano a ano.",
    href: "/analisis-eficacia/analisis-declaraciones-renta",
    icon: FileText,
    available: true
  },
  {
    title: "Declaracion de IVA",
    description: "Analisis y validacion de declaraciones de IVA. Verificacion de bases gravables, tarifas aplicadas y cruce con informacion exogena.",
    href: "/analisis-eficacia/analisis-declaraciones-iva",
    icon: Receipt,
    available: true
  },
  {
    title: "Declaracion del Impuesto al Consumo",
    description: "Revision de declaraciones del impuesto al consumo. Control de productos gravados, tarifas especiales y retenciones.",
    href: "/analisis-eficacia/analisis-impuesto-consumo",
    icon: ShoppingCart,
    available: false
  },
  {
    title: "Informacion Exogena",
    description: "Analisis y validacion de reportes de informacion exogena. Cruce de datos con terceros, deteccion de inconsistencias y alertas.",
    href: "/analisis-eficacia/analisis-informacion-exogena",
    icon: Database,
    available: false
  }
]

export default function AnalisisEficaciaPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-12">
      <motion.div
        variants={animations.staggerContainer.variants}
        initial="initial"
        animate="animate"
        className="space-y-12"
      >
        {/* Hero Section */}
        <motion.section
          variants={animations.staggerItem.variants}
          className="relative overflow-hidden bg-gradient-to-br from-brand-navy to-brand-indigo rounded-2xl p-8 md:p-12"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/5 rounded-full blur-2xl" />
          </div>

          {/* Static floating elements */}
          <div className="absolute top-8 right-8 md:right-16 w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>

          <div className="absolute bottom-8 right-24 md:right-32 w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Analisis con Inteligencia Artificial
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Analisis de Eficacia
            </h1>
            <p className="text-lg text-white/90 leading-relaxed max-w-2xl">
              Evaluacion integral de la eficiencia de los procesos contables y tributarios.
              Selecciona el tipo de analisis que deseas realizar.
            </p>
          </div>
        </motion.section>

        {/* Analysis Options Grid */}
        <motion.section variants={animations.staggerItem.variants} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-navy to-brand-indigo flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-text">Tipos de Analisis</h2>
              <p className="text-brand-text-secondary text-sm">Selecciona el modulo de analisis que deseas utilizar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysisOptions.map((option, index) => {
              const Icon = option.icon

              if (option.available) {
                return (
                  <Link key={option.title} href={option.href}>
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={animations.cardHover.whileHover}
                      className="group card-base border-2 p-6 cursor-pointer transition-shadow duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-brand-indigo/10 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-200">
                          <Icon className="h-7 w-7 text-brand-indigo" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-brand-text group-hover:text-brand-indigo transition-colors">
                              {option.title}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-brand-text-secondary group-hover:text-brand-indigo group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-brand-text-secondary text-sm leading-relaxed">
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.06, duration: 0.25, ease: "easeOut" }}
                  className="relative card-base border-2 p-6 opacity-60"
                >
                  {/* Coming Soon Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-brand-bg-alt text-brand-text-secondary">
                      Proximamente
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-brand-bg-alt flex items-center justify-center flex-shrink-0">
                      <Icon className="h-7 w-7 text-brand-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-brand-text-secondary mb-2">
                        {option.title}
                      </h3>
                      <p className="text-brand-text-secondary text-sm leading-relaxed">
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
        <motion.section variants={animations.staggerItem.variants}>
          <div className="bg-brand-indigo/5 border border-brand-indigo/20 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-indigo/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-brand-indigo" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy mb-2">
                  Analisis impulsado por IA
                </h3>
                <p className="text-brand-text-secondary text-sm leading-relaxed">
                  Nuestros modulos de analisis utilizan inteligencia artificial para extraer, validar y analizar
                  informacion de documentos tributarios. Cada modulo esta optimizado para su tipo especifico de
                  declaracion, garantizando precision y eficiencia en el proceso de auditoria.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
