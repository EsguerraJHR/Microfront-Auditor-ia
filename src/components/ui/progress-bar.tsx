'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  percentage: number
  message: string
  className?: string
}

/**
 * Componente de barra de progreso con animación
 * Muestra el progreso del análisis comparativo en tiempo real usando SSE
 */
export function ProgressBar({ percentage, message, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar Container */}
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        {/* Animated Progress Fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut'
          }}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>
      </div>

      {/* Progress Info */}
      <div className="mt-2 flex justify-between items-center">
        <motion.p
          className="text-sm text-gray-700 dark:text-gray-300 flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={message} // Re-animate cuando cambie el mensaje
        >
          {message}
        </motion.p>
        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 ml-3">
          {percentage}%
        </span>
      </div>
    </div>
  )
}

/**
 * Variante compacta de la barra de progreso
 */
export function ProgressBarCompact({ percentage, message }: ProgressBarProps) {
  return (
    <div className="inline-flex items-center gap-3">
      {/* Mini Progress Bar */}
      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-orange-600 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Percentage */}
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">
        {percentage}%
      </span>

      {/* Message */}
      <span className="text-xs text-gray-500 dark:text-gray-500 truncate max-w-[200px]">
        {message}
      </span>
    </div>
  )
}

/**
 * Barra de progreso circular
 */
export function ProgressCircular({ percentage, message }: ProgressBarProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-orange-600"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              strokeDasharray: circumference
            }}
          />
        </svg>

        {/* Percentage in Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-orange-600">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700 dark:text-gray-300 text-center max-w-xs">
        {message}
      </p>
    </div>
  )
}
