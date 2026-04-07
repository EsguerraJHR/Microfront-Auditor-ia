"use client"

import { BarChart3, Shield, Clock, Calculator } from "lucide-react"
import { useState, useEffect } from "react"

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2024)
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="mt-auto bg-white border-t border-brand-border">
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
                <h3 className="font-bold text-lg bg-gradient-to-r from-brand-navy to-brand-indigo bg-clip-text text-transparent">
                  BPO
                </h3>
                <p className="text-xs text-brand-text-secondary">
                  Business Process Outsourcing
                </p>
              </div>
            </div>
            <p className="text-sm text-brand-text-secondary max-w-sm">
              Soluciones integrales de externalizacion de procesos empresariales para optimizar tu operacion contable y administrativa.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-semibold text-brand-text">Caracteristicas</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
                <Shield className="h-4 w-4 text-brand-indigo" />
                <span>Auditoria segura y confiable</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
                <Clock className="h-4 w-4 text-brand-indigo" />
                <span>Procesamiento en tiempo real</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
                <Calculator className="h-4 w-4 text-brand-indigo" />
                <span>Analisis contable automatizado</span>
              </div>
            </div>
          </div>

          {/* Status and Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-brand-text">Estado del Sistema</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-brand-indigo rounded-full"></div>
                <span className="text-sm text-brand-text-secondary">Servicios operativos</span>
              </div>
              <div className="text-sm text-brand-text-secondary">
                <p>Ultima actualizacion: {currentTime || "--:--:--"}</p>
                <p>Version: 1.0.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-brand-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
              <span>&copy; {currentYear} Louis Frontend - BPO.</span>
              <span className="hidden sm:inline">Todos los derechos reservados.</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
              <span>Desarrollado para la excelencia contable</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
