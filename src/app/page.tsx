import { BarChart3, FileCheck, Users, Receipt, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Auditorías Completadas",
      value: "234",
      change: "+12%",
      trend: "up",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Documentos Procesados",
      value: "1,847",
      change: "+8%",
      trend: "up",
      icon: FileCheck,
      color: "text-blue-600"
    },
    {
      title: "Alertas Activas",
      value: "7",
      change: "-3",
      trend: "down",
      icon: AlertCircle,
      color: "text-orange-600"
    },
    {
      title: "Terceros Verificados",
      value: "156",
      change: "+5%",
      trend: "up",
      icon: Users,
      color: "text-purple-600"
    }
  ]

  const recentActivities = [
    {
      title: "Análisis de eficacia completado",
      description: "Proceso de auditoría Q4 2024 finalizado exitosamente",
      time: "Hace 2 horas",
      status: "completed"
    },
    {
      title: "Nueva precrítica iniciada",
      description: "Revisión de documentos contables mes de diciembre",
      time: "Hace 4 horas",
      status: "in_progress"
    },
    {
      title: "Validación de terceros",
      description: "Verificación de 23 proveedores nuevos",
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
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-blue-700 dark:text-blue-400">
          Dashboard - BPO
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed max-w-3xl">
          Bienvenido al sistema de gestión de procesos empresariales. Aquí puedes monitorear el estado general
          de todos los procesos de auditoría y contabilidad en tiempo real.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="card-base p-6 hover-lift">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card-base p-6">
          <h3 className="accountingSection mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="btn-primary flex flex-col items-center gap-2 p-4 h-auto">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Nuevo Análisis</span>
            </button>
            <button className="btn-primary flex flex-col items-center gap-2 p-4 h-auto">
              <FileCheck className="h-6 w-6" />
              <span className="text-sm">Precrítica</span>
            </button>
            <button className="btn-primary flex flex-col items-center gap-2 p-4 h-auto">
              <Users className="h-6 w-6" />
              <span className="text-sm">Validar Terceros</span>
            </button>
            <button className="btn-primary flex flex-col items-center gap-2 p-4 h-auto">
              <Receipt className="h-6 w-6" />
              <span className="text-sm">Procesar Facturas</span>
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card-base p-6">
          <h3 className="accountingSection mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={`mt-1 h-2 w-2 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'in_progress' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
        <h3 className="accountingSection mb-4">Rendimiento del Sistema</h3>
        <div className="h-64 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="text-muted-foreground">
              Gráfico de rendimiento del sistema
            </p>
            <p className="text-sm text-muted-foreground">
              Próximamente: Métricas detalladas de performance
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}