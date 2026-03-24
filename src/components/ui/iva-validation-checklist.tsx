"use client"

import React, { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  ChevronDown,
  ClipboardCheck,
  Info,
  Calculator,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  IvaValidationResponse,
  ValidationItem,
  ValidationStatus,
  VALIDATION_DESCRIPTIONS
} from "@/lib/api/iva-validation-service"

interface IvaValidationChecklistProps {
  result: IvaValidationResponse
  onClose?: () => void
}

// Configuración de estilos por estado
const statusConfig: Record<ValidationStatus, {
  bg: string
  border: string
  icon: React.ReactNode
  label: string
  textColor: string
}> = {
  pass: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    label: 'Aprobado',
    textColor: 'text-green-600'
  },
  fail: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    label: 'Fallido',
    textColor: 'text-red-600'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    label: 'Advertencia',
    textColor: 'text-yellow-600'
  },
  skipped: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    icon: <MinusCircle className="h-5 w-5 text-gray-400" />,
    label: 'Omitido',
    textColor: 'text-gray-400'
  }
}

export function IvaValidationChecklist({ result, onClose }: IvaValidationChecklistProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const toggleItem = (id: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setExpandedItems(new Set(result.validations.map(v => v.id)))
  }

  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header con resumen */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-indigo/20 flex items-center justify-center border border-brand-indigo/30">
              <ClipboardCheck className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Checklist de Validación IVA
              </h2>
              <p className="text-slate-300">
                {result.razon_social} - NIT: {result.nit}
              </p>
              <p className="text-slate-400 text-sm">
                {result.periods_validated.length} período{result.periods_validated.length > 1 ? 's' : ''} validado{result.periods_validated.length > 1 ? 's' : ''} - Año {result.ano_gravable}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex gap-3 flex-wrap">
            <SummaryBadge
              icon={<CheckCircle2 className="h-4 w-4" />}
              value={result.summary.passed}
              label="Aprobadas"
              color="green"
            />
            <SummaryBadge
              icon={<XCircle className="h-4 w-4" />}
              value={result.summary.failed}
              label="Fallidas"
              color="red"
            />
            <SummaryBadge
              icon={<AlertTriangle className="h-4 w-4" />}
              value={result.summary.warnings}
              label="Advertencias"
              color="yellow"
            />
            <SummaryBadge
              icon={<MinusCircle className="h-4 w-4" />}
              value={result.summary.skipped}
              label="Omitidas"
              color="gray"
            />
          </div>
        </div>

        {/* Progress bar visual */}
        <div className="mt-6 pt-4 border-t border-slate-600/50">
          <div className="flex gap-1">
            {result.validations.map((validation) => (
              <div
                key={validation.id}
                className={cn(
                  "flex-1 h-2 rounded-full transition-colors",
                  validation.status === 'pass' && "bg-green-500",
                  validation.status === 'fail' && "bg-red-500",
                  validation.status === 'warning' && "bg-yellow-500",
                  validation.status === 'skipped' && "bg-gray-500"
                )}
                title={`${validation.id}. ${validation.name}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">
          Detalle de Validaciones ({result.validations.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-brand-indigo hover:text-brand-indigo-hover dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Expandir todo
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-brand-indigo hover:text-brand-indigo-hover dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Lista de validaciones */}
      <div className="space-y-3">
        {result.validations.map((validation, index) => (
          <ValidationItemCard
            key={validation.id}
            validation={validation}
            index={index}
            isExpanded={expandedItems.has(validation.id)}
            onToggle={() => toggleItem(validation.id)}
          />
        ))}
      </div>

      {/* Footer con timestamp */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-gray-200 dark:border-gray-800">
        Validación ejecutada el {new Date(result.timestamp).toLocaleString('es-CO')}
      </div>
    </div>
  )
}

// Componente de badge de resumen
function SummaryBadge({
  icon,
  value,
  label,
  color
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: 'green' | 'red' | 'yellow' | 'gray'
}) {
  const colorClasses = {
    green: 'bg-green-500/20 border-green-500/30 text-green-400',
    red: 'bg-red-500/20 border-red-500/30 text-red-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    gray: 'bg-gray-500/20 border-gray-500/30 text-gray-400'
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border",
      colorClasses[color]
    )}>
      {icon}
      <span className="font-bold text-lg">{value}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  )
}

// Componente de item de validación
function ValidationItemCard({
  validation,
  index,
  isExpanded,
  onToggle
}: {
  validation: ValidationItem
  index: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const config = statusConfig[validation.status]
  const description = VALIDATION_DESCRIPTIONS[validation.id]

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        config.bg,
        config.border
      )}
    >
      {/* Header clickeable */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground w-6">
            {validation.id}.
          </span>
          {config.icon}
          <span className="font-medium text-foreground">
            {validation.name}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            validation.status === 'pass' && "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
            validation.status === 'fail' && "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
            validation.status === 'warning' && "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
            validation.status === 'skipped' && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          )}>
            {config.label}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 pb-4 space-y-3 border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
              {/* Descripción */}
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {validation.description || description?.description}
                </p>
              </div>

              {/* Fórmula */}
              {(validation.formula || description?.formula) && (
                <div className="flex items-start gap-2">
                  <Calculator className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                    {validation.formula || description?.formula}
                  </code>
                </div>
              )}

              {/* Valores */}
              {(validation.expected_value !== undefined || validation.actual_value !== undefined) && (
                <div className="grid grid-cols-2 gap-4 bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  {validation.expected_value !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Valor esperado</p>
                      <p className="font-mono font-semibold text-foreground">
                        {typeof validation.expected_value === 'number'
                          ? validation.expected_value.toLocaleString('es-CO')
                          : validation.expected_value}
                      </p>
                    </div>
                  )}
                  {validation.actual_value !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Valor encontrado</p>
                      <p className={cn(
                        "font-mono font-semibold",
                        validation.status === 'pass' ? "text-green-600" :
                        validation.status === 'fail' ? "text-red-600" : "text-foreground"
                      )}>
                        {typeof validation.actual_value === 'number'
                          ? validation.actual_value.toLocaleString('es-CO')
                          : validation.actual_value}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tolerancia */}
              {validation.tolerance && (
                <p className="text-xs text-muted-foreground">
                  Tolerancia: {validation.tolerance}
                </p>
              )}

              {/* Diferencia */}
              {validation.difference !== undefined && validation.difference !== 0 && (
                <p className={cn(
                  "text-sm font-medium",
                  validation.difference > 0 ? "text-red-600" : "text-brand-indigo"
                )}>
                  Diferencia: {validation.difference > 0 ? '+' : ''}{validation.difference.toLocaleString('es-CO')}
                </p>
              )}

              {/* Detalles adicionales */}
              {validation.details && (
                <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                  <FileText className="h-4 w-4 text-brand-indigo mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-brand-navy dark:text-indigo-200">
                    {validation.details}
                  </p>
                </div>
              )}

              {/* Indicadores de dependencias */}
              {validation.status === 'skipped' && (
                <div className="flex flex-wrap gap-2">
                  {validation.requires_renta && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      Requiere declaración de Renta
                    </span>
                  )}
                  {validation.requires_f490 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      Requiere formulario F490
                    </span>
                  )}
                  {validation.requires_f350 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      Requiere formulario F350
                    </span>
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  )
}

export default IvaValidationChecklist
