"use client"

import { Calculator, Heart, Shield, Clock } from "lucide-react"
import { useState, useEffect } from "react"

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2024)
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    // Set current year on client side to avoid hydration mismatch
    setCurrentYear(new Date().getFullYear())

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="mt-auto bg-white/90 backdrop-blur-md border-t border-gray-200 dark:bg-gray-900/90 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="calculator-icon-container">
                <Calculator className="calculator-icon" />
              </div>
              <div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  BPO
                </h3>
                <p className="text-sm text-muted-foreground">
                  Business Process Outsourcing
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Soluciones integrales de externalización de procesos empresariales para optimizar tu operación contable y administrativa.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Características</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Auditoría segura y confiable</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Procesamiento en tiempo real</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span>Análisis contable automatizado</span>
              </div>
            </div>
          </div>

          {/* Status and Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Estado del Sistema</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Servicios operativos</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Última actualización: {currentTime || "--:--:--"}</p>
                <p>Versión: 1.0.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>&copy; {currentYear} Louis Frontend - BPO.</span>
              <span className="hidden sm:inline">Todos los derechos reservados.</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Desarrollado con</span>
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <span>para la excelencia contable</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}