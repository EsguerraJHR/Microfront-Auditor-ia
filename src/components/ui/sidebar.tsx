"use client"

import { cn } from "@/lib/utils"
import { BarChart3, FileCheck, Users, Receipt, Home, X, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
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
    title: "Diagnostico Tributario",
    href: "/precritica",
    icon: FileCheck,
    description: "Análisis y revisión de declaraciones"
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

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
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
          "fixed top-0 left-0 z-50 h-screen bg-sidebar border-r border-sidebar-border shadow-lg transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "lg:w-20 w-80" : "w-80",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300",
          isCollapsed ? "lg:justify-center lg:p-4 justify-between p-6" : "justify-between p-6"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "lg:justify-center"
          )}>
            <div className="calculator-icon-container flex-shrink-0">
              <BarChart3 className="calculator-icon" />
            </div>
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
            )}>
              <h2 className="text-lg font-semibold text-sidebar-foreground whitespace-nowrap">
                BPO
              </h2>
              <p className="text-xs text-sidebar-foreground/70 whitespace-nowrap">
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

          {/* Collapse toggle for desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-5 w-5" />
            ) : (
              <ChevronsLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 space-y-2 overflow-y-auto transition-all duration-300",
          isCollapsed ? "lg:p-2 p-4" : "p-4"
        )}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 group",
                  isCollapsed ? "lg:justify-center lg:p-3 gap-3 p-3" : "gap-3 p-3",
                  isActive
                    ? "bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors flex-shrink-0",
                    isActive
                      ? "bg-brand-indigo/20"
                      : "bg-sidebar-accent group-hover:bg-sidebar-accent"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive
                        ? "text-brand-indigo"
                        : "text-sidebar-foreground"
                    )}
                  />
                </div>
                <div className={cn(
                  "flex-1 min-w-0 overflow-hidden transition-all duration-300",
                  isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
                )}>
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <div className={cn(
                    "w-2 h-2 bg-brand-indigo rounded-full flex-shrink-0",
                    isCollapsed && "lg:hidden"
                  )}></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Section */}
        <div className={cn(
          "mt-auto border-t border-sidebar-border transition-all duration-300",
          isCollapsed ? "lg:p-2 p-4" : "p-4"
        )}>
          {/* System status - hidden when collapsed on desktop */}
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            isCollapsed ? "lg:h-0 lg:opacity-0 lg:mb-0" : "h-auto opacity-100 mb-3"
          )}>
            <div className="p-3 rounded-lg bg-sidebar-accent">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-brand-indigo rounded-full"></div>
                <span className="text-sm font-medium text-sidebar-foreground">
                  Estado del Sistema
                </span>
              </div>
              <p className="text-xs text-sidebar-foreground/70">
                Todas las funciones operativas
              </p>
            </div>
          </div>

        </div>
      </aside>
    </>
  )
}
