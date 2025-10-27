"use client"

import { cn } from "@/lib/utils"
import { BarChart3, FileCheck, Users, Receipt, Home, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    description: "Panel principal"
  },
  {
    title: "Análisis Eficacia",
    href: "/analisis-eficacia",
    icon: BarChart3,
    description: "Evaluación de procesos y resultados"
  },
  {
    title: "Precrítica",
    href: "/precritica",
    icon: FileCheck,
    description: "Revisión previa de documentos"
  },
  {
    title: "Terceros",
    href: "/terceros",
    icon: Users,
    description: "Gestión de proveedores y clientes"
  },
  {
    title: "Facturas",
    href: "/facturas",
    icon: Receipt,
    description: "Control y seguimiento de facturas"
  }
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-80 bg-sidebar border-r border-sidebar-border shadow-lg transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="calculator-icon-container">
              <BarChart3 className="calculator-icon" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                BPO
              </h2>
              <p className="text-xs text-sidebar-foreground/70">
                Business Process Outsourcing
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  // Close sidebar on mobile when clicking a link
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-200 dark:bg-blue-800"
                      : "bg-sidebar-accent group-hover:bg-sidebar-accent"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-sidebar-foreground"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Section */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="p-3 rounded-lg bg-sidebar-accent">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-sidebar-foreground">
                Estado del Sistema
              </span>
            </div>
            <p className="text-xs text-sidebar-foreground/70">
              Todas las funciones operativas
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}