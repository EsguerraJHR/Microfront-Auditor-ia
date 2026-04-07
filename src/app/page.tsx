"use client"

import { BarChart3, FileCheck, Users, Receipt, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { animations } from "@/lib/design-tokens"

export default function DashboardPage() {
  const stats = [
    {
      title: "Auditorias Completadas",
      value: "234",
      change: "+12%",
      trend: "up",
      icon: CheckCircle,
    },
    {
      title: "Documentos Procesados",
      value: "1,847",
      change: "+8%",
      trend: "up",
      icon: FileCheck,
    },
    {
      title: "Alertas Activas",
      value: "7",
      change: "-3",
      trend: "down",
      icon: AlertCircle,
    },
    {
      title: "Terceros Verificados",
      value: "156",
      change: "+5%",
      trend: "up",
      icon: Users,
    }
  ]

  const recentActivities = [
    {
      title: "Analisis de eficacia completado",
      description: "Proceso de auditoria Q4 2024 finalizado exitosamente",
      time: "Hace 2 horas",
      status: "completed"
    },
    {
      title: "Nueva precritica iniciada",
      description: "Revision de documentos contables mes de diciembre",
      time: "Hace 4 horas",
      status: "in_progress"
    },
    {
      title: "Validacion de terceros",
      description: "Verificacion de 23 proveedores nuevos",
      time: "Hace 6 horas",
      status: "pending"
    },
    {
      title: "Procesamiento de facturas",
      description: "145 facturas procesadas y validadas",
      time: "Ayer",
      status: "completed"
    }
  ]

  return (
    <motion.div className="space-y-8 pb-8" {...animations.pageTransition}>
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
          Dashboard - BPO
        </h1>
        <p className="text-sm text-brand-text-secondary leading-relaxed max-w-3xl">
          Bienvenido al sistema de gestion de procesos empresariales. Aqui puedes monitorear el estado general
          de todos los procesos de auditoria y contabilidad en tiempo real.
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={animations.staggerContainer.variants}
        initial="initial"
        animate="animate"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              className="card-base p-6"
              variants={animations.staggerItem.variants}
              {...animations.cardHover}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-xs text-brand-text-secondary font-medium">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-brand-text">
                      {stat.value}
                    </p>
                    <span className={`text-xs font-medium ${
                      stat.trend === 'up' ? 'text-success' : 'text-error'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-brand-indigo/10">
                  <Icon className="h-6 w-6 text-brand-indigo" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card-base p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Acciones Rapidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary flex flex-col items-center gap-2 p-4 h-auto rounded-xl">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Nuevo Analisis</span>
            </button>
            <button className="btn-primary flex flex-col items-center gap-2 p-4 h-auto rounded-xl">
              <FileCheck className="h-6 w-6" />
              <span className="text-sm">Precritica</span>
            </button>
            <button className="btn-primary flex flex-col items-center gap-2 p-4 h-auto rounded-xl">
              <Users className="h-6 w-6" />
              <span className="text-sm">Validar Terceros</span>
            </button>
            <button className="btn-primary flex flex-col items-center gap-2 p-4 h-auto rounded-xl">
              <Receipt className="h-6 w-6" />
              <span className="text-sm">Procesar Facturas</span>
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card-base p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-brand-bg-alt transition-colors">
                <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  activity.status === 'completed' ? 'bg-success' :
                  activity.status === 'in_progress' ? 'bg-info' :
                  'bg-warning'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-brand-text">
                    {activity.title}
                  </p>
                  <p className="text-xs text-brand-text-secondary mb-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-brand-text-secondary">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card-base p-6">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Rendimiento del Sistema</h3>
        <div className="h-64 bg-brand-bg-alt rounded-xl flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-brand-indigo mx-auto mb-2" />
            <p className="text-sm text-brand-text-secondary">
              Grafico de rendimiento del sistema
            </p>
            <p className="text-xs text-brand-text-secondary">
              Proximamente: Metricas detalladas de performance
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
