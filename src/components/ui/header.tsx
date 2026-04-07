"use client"

import { Menu, Settings, User, Bell, Search, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  onMenuToggle: () => void
  isSidebarOpen: boolean
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  return (
    <header className="navbar-base h-16 flex items-center justify-between px-4 lg:px-6 hidden">
      <div className="flex items-center gap-4">
        {/* Menu Toggle Button */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-md hover:bg-brand-bg-alt transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-brand-text" />
        </button>

        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="calculator-icon-container">
            <Calculator className="calculator-icon" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold bg-gradient-to-r from-brand-navy to-brand-indigo bg-clip-text text-transparent">
              BPO
            </h1>
            <p className="text-xs text-brand-text-secondary">Business Process Outsourcing</p>
          </div>
        </div>
      </div>

      {/* Search Bar - Hidden on mobile */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-text-secondary" />
          <input
            type="text"
            placeholder="Buscar en procesos..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search button for mobile */}
        <button className="p-2 rounded-md hover:bg-brand-bg-alt transition-colors md:hidden">
          <Search className="h-5 w-5 text-brand-text" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-md hover:bg-brand-bg-alt transition-colors relative">
          <Bell className="h-5 w-5 text-brand-text" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-brand-indigo rounded-full"></span>
        </button>

        {/* Settings */}
        <button className="p-2 rounded-md hover:bg-brand-bg-alt transition-colors">
          <Settings className="h-5 w-5 text-brand-text" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-2 ml-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-brand-navy to-brand-indigo flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium text-brand-text">Auditor</p>
            <p className="text-xs text-brand-text-secondary">admin@louis.com</p>
          </div>
        </div>
      </div>
    </header>
  )
}
