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
    bg: 'bg-success-bg',
    border: 'border-success-bg',
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    label: 'Aprobado',
    textColor: 'text-success'
  },
  fail: {
    bg: 'bg-error-bg',
    border: 'border-error-bg',
    icon: <XCircle className="h-5 w-5 text-error" />,
    label: 'Fallido',
    textColor: 'text-error'
  },
  warning: {
    bg: 'bg-warning-bg',
    border: 'border-warning-bg',
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
    label: 'Advertencia',
    textColor: 'text-warning'
  },
  skipped: {
    bg: 'bg-brand-bg',
    border: 'border-brand-border',
    icon: <MinusCircle className="h-5 w-5 text-brand-text-secondary" />,
    label: 'Omitido',
    textColor: 'text-brand-text-secondary'
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
              <ClipboardCheck className="h-7 w-7 text-brand-indigo" />
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
                  validation.status === 'pass' && "bg-success",
                  validation.status === 'fail' && "bg-error",
                  validation.status === 'warning' && "bg-warning",
                  validation.status === 'skipped' && "bg-brand-text-secondary"
                )}
                title={`${validation.id}. ${validation.name}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-brand-text">
          Detalle de Validaciones ({result.validations.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-brand-indigo hover:text-brand-indigo-hover"
          >
            Expandir todo
          </button>
          <span className="text-brand-text-secondary">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-brand-indigo hover:text-brand-indigo-hover"
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
      <div className="text-center text-xs text-brand-text-secondary pt-4 border-t border-brand-border">
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
    green: 'bg-success/20 border-success/30 text-success',
    red: 'bg-error/20 border-error/30 text-error',
    yellow: 'bg-warning/20 border-warning/30 text-warning',
    gray: 'bg-brand-text-secondary/20 border-brand-text-secondary/30 text-brand-text-secondary'
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
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-brand-text-secondary w-6">
            {validation.id}.
          </span>
          {config.icon}
          <span className="font-medium text-brand-text">
            {validation.name}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            validation.status === 'pass' && "bg-success-bg text-success-foreground",
            validation.status === 'fail' && "bg-error-bg text-error-foreground",
            validation.status === 'warning' && "bg-warning-bg text-warning-foreground",
            validation.status === 'skipped' && "bg-brand-bg-alt text-brand-text-secondary"
          )}>
            {config.label}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-brand-text-secondary transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 pb-4 space-y-3 border-t border-brand-border pt-3">
              {/* Descripción */}
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-brand-text-secondary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-brand-text-secondary">
                  {validation.description || description?.description}
                </p>
              </div>

              {/* Fórmula */}
              {(validation.formula || description?.formula) && (
                <div className="flex items-start gap-2">
                  <Calculator className="h-4 w-4 text-brand-text-secondary mt-0.5 flex-shrink-0" />
                  <code className="text-xs bg-brand-bg-alt px-2 py-1 rounded font-mono">
                    {validation.formula || description?.formula}
                  </code>
                </div>
              )}

              {/* Valores */}
              {(validation.expected_value !== undefined || validation.actual_value !== undefined) && (
                <div className="grid grid-cols-2 gap-4 bg-white/50 rounded-lg p-3">
                  {validation.expected_value !== undefined && (
                    <div>
                      <p className="text-xs text-brand-text-secondary">Valor esperado</p>
                      <p className="font-mono font-semibold text-brand-text">
                        {typeof validation.expected_value === 'number'
                          ? validation.expected_value.toLocaleString('es-CO')
                          : validation.expected_value}
                      </p>
                    </div>
                  )}
                  {validation.actual_value !== undefined && (
                    <div>
                      <p className="text-xs text-brand-text-secondary">Valor encontrado</p>
                      <p className={cn(
                        "font-mono font-semibold",
                        validation.status === 'pass' ? "text-success" :
                        validation.status === 'fail' ? "text-error" : "text-brand-text"
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
                <p className="text-xs text-brand-text-secondary">
                  Tolerancia: {validation.tolerance}
                </p>
              )}

              {/* Diferencia */}
              {validation.difference !== undefined && validation.difference !== 0 && (
                <p className={cn(
                  "text-sm font-medium",
                  validation.difference > 0 ? "text-error" : "text-brand-indigo"
                )}>
                  Diferencia: {validation.difference > 0 ? '+' : ''}{validation.difference.toLocaleString('es-CO')}
                </p>
              )}

              {/* Detalles adicionales */}
              {validation.details && (
                <div className="flex items-start gap-2 bg-brand-indigo/5 p-3 rounded-lg">
                  <FileText className="h-4 w-4 text-brand-indigo mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-brand-navy">
                    {validation.details}
                  </p>
                </div>
              )}

              {/* Indicadores de dependencias */}
              {validation.status === 'skipped' && (
                <div className="flex flex-wrap gap-2">
                  {validation.requires_renta && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-warning-bg text-warning-foreground rounded">
                      <AlertTriangle className="h-3 w-3" />
                      Requiere declaración de Renta
                    </span>
                  )}
                  {validation.requires_f490 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-warning-bg text-warning-foreground rounded">
                      <AlertTriangle className="h-3 w-3" />
                      Requiere formulario F490
                    </span>
                  )}
                  {validation.requires_f350 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-warning-bg text-warning-foreground rounded">
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
