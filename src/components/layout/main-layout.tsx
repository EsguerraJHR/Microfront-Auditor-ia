"use client"

import { useState, useCallback, memo } from "react"
import { Header } from "@/components/ui/header"
import { Sidebar } from "@/components/ui/sidebar"
import { Footer } from "@/components/ui/footer"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
}

// Memoizar el área de contenido para evitar re-renders cuando cambia el sidebar
const MainContent = memo(function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-8rem)] p-4 lg:p-6 bg-brand-bg">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  )
})

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div className={cn(
        "min-h-screen",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
      )} style={{ transition: "margin-left 0.3s ease" }}>
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Main Content — memoizado */}
        <MainContent>{children}</MainContent>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}