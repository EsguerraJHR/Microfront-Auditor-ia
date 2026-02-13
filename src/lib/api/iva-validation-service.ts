import { getAuthHeaders } from '@/lib/utils/api-helpers'
import { FEATURES } from '@/config/features'
import { IvaDeclarationData } from './iva-declaration-service'
import { DeclarationExtractionResponse } from './declaration-service'

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/compliance`

// URL para SSE (puede ser directa al backend si el gateway no soporta streaming)
const getSSEBaseUrl = () => {
  if (FEATURES.SSE_DIRECT_URL) {
    return `${FEATURES.SSE_DIRECT_URL}/api/v1/compliance`
  }
  return BASE_URL
}

// ============================================
// TYPES
// ============================================

// Datos opcionales de pago F490
export interface Pago490 {
  numero_formulario: string
  fecha_pago: string
  valor_pagado: number
  periodo: string
  estado: 'pagado' | 'pendiente'
}

// Datos opcionales de retenciones F350
export interface Retencion350 {
  numero_formulario: string
  periodo: string
  r132_iva_exterior: number
  fecha: string
}

// Request para el endpoint de validación
export interface IvaValidationRequest {
  iva_declarations: IvaDeclarationData[]
  renta_declaration?: DeclarationExtractionResponse
  pagos_490?: Pago490[]
  retenciones_350?: Retencion350[]
}

// Estado de una validación individual
export type ValidationStatus = 'pass' | 'fail' | 'warning' | 'skipped'

// Item de validación individual
export interface ValidationItem {
  id: number
  name: string
  description: string
  formula?: string
  status: ValidationStatus
  expected_value?: string | number
  actual_value?: string | number
  tolerance?: string
  difference?: number
  details?: string
  requires_renta?: boolean
  requires_f490?: boolean
  requires_f350?: boolean
}

// Resumen de validaciones
export interface ValidationSummary {
  total: number
  passed: number
  failed: number
  warnings: number
  skipped: number
}

// Respuesta completa de validación
export interface IvaValidationResponse {
  success: boolean
  timestamp: string
  nit: string
  razon_social: string
  periods_validated: number[]
  ano_gravable: number
  validations: ValidationItem[]
  summary: ValidationSummary
  message?: string
}

// Evento de progreso SSE para validación
export interface IvaValidationProgress {
  current_validation: number
  total_validations: number
  validation_name: string
  percentage: number
  message: string
}

// ============================================
// SERVICE
// ============================================

class IvaValidationService {
  /**
   * Ejecuta el checklist de validación de IVA
   * Elige automáticamente entre SSE y endpoint síncrono según feature flag
   */
  async validateChecklist(
    request: IvaValidationRequest,
    onProgress?: (progress: IvaValidationProgress) => void
  ): Promise<IvaValidationResponse> {
    if (!request.iva_declarations || request.iva_declarations.length === 0) {
      throw new Error('Se requiere al menos una declaración de IVA para validar')
    }

    // Elegir endpoint según feature flag
    if (FEATURES.USE_SSE_PROGRESS && onProgress) {
      return await this.validateWithSSE(request, onProgress)
    } else {
      return await this.validateWithoutSSE(request)
    }
  }

  /**
   * Validación usando SSE (Server-Sent Events) para mostrar progreso en tiempo real
   */
  private async validateWithSSE(
    request: IvaValidationRequest,
    onProgress: (progress: IvaValidationProgress) => void
  ): Promise<IvaValidationResponse> {
    const headers = getAuthHeaders() as Record<string, string>

    // Usar URL directa para SSE si está configurada (bypass del gateway)
    const sseUrl = getSSEBaseUrl()
    console.log('IVA Validation SSE URL:', `${sseUrl}/validate/iva/checklist/stream`)

    const response = await fetch(`${sseUrl}/validate/iva/checklist/stream`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      let errorText = 'Error desconocido'
      try {
        const errorData = await response.json()
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorText = errorData.detail.map((err: any) => err.msg).join(', ')
        } else {
          errorText = errorData.detail || errorData.message || `HTTP ${response.status} ${response.statusText}`
        }
      } catch {
        errorText = `HTTP ${response.status} ${response.statusText}`
      }
      throw new Error(`Error HTTP ${response.status}: ${errorText}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let result: IvaValidationResponse | null = null
    let buffer = ''

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Procesar eventos completos separados por doble salto de línea
        const events = buffer.split('\n\n')

        // El último elemento podría estar incompleto, mantenerlo en el buffer
        buffer = events.pop() || ''

        for (const eventText of events) {
          const lines = eventText.split('\n')
          let accumulatedData = ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('data:')) {
              accumulatedData += trimmedLine.substring(5).trim()
            }
          }

          if (!accumulatedData) continue

          try {
            const data = JSON.parse(accumulatedData)
            console.log('IVA Validation SSE Event:', data.event_type, data)

            // El backend envía event_type dentro del JSON
            if (data.event_type === 'checklist_validacion') {
              // Evento de progreso individual
              onProgress({
                current_validation: data.validacion_numero || 0,
                total_validations: 11,
                validation_name: data.nombre || '',
                percentage: data.progress || Math.round((data.validacion_numero / 11) * 100),
                message: data.mensaje || `Validando ${data.nombre || ''}...`
              })
            } else if (data.event_type === 'checklist_completado') {
              // Evento de finalización - transformar al formato esperado
              const checklistData = data.data?.checklist_validacion
              if (checklistData) {
                result = this.transformBackendResponse(checklistData, data.data)
                console.log('IVA Validation Complete - Transformed result:', result)
              }
            } else if (data.event_type === 'error') {
              throw new Error(data.mensaje || data.error || 'Error en la validación')
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Error en la validación') {
              console.error('Error parsing SSE data:', e, 'Raw data:', accumulatedData)
            } else {
              throw e
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (!result) {
      throw new Error('No se recibió resultado de la validación')
    }

    return result
  }

  /**
   * Validación tradicional sin SSE (endpoint síncrono)
   */
  private async validateWithoutSSE(
    request: IvaValidationRequest
  ): Promise<IvaValidationResponse> {
    const headers = getAuthHeaders() as Record<string, string>

    const response = await fetch(`${BASE_URL}/validate/iva/checklist`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      let errorText = 'Error desconocido'
      try {
        const errorData = await response.json()
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorText = errorData.detail.map((err: any) => err.msg).join(', ')
        } else {
          errorText = errorData.detail || errorData.message || `HTTP ${response.status} ${response.statusText}`
        }
      } catch {
        errorText = `HTTP ${response.status} ${response.statusText}`
      }
      throw new Error(`Error HTTP ${response.status}: ${errorText}`)
    }

    const data: IvaValidationResponse = await response.json()
    return data
  }

  /**
   * Transforma la respuesta del backend al formato esperado por el frontend
   */
  private transformBackendResponse(
    checklistData: any,
    fullData: any
  ): IvaValidationResponse {
    // Mapear estados del backend a ValidationStatus del frontend
    const mapStatus = (estado: string): ValidationStatus => {
      switch (estado) {
        case 'OK': return 'pass'
        case 'ERROR': return 'fail'
        case 'ADVERTENCIA': return 'warning'
        case 'NO_APLICA': return 'skipped'
        default: return 'skipped'
      }
    }

    // Transformar items de validación
    const validations: ValidationItem[] = (checklistData.items || []).map((item: any) => ({
      id: item.numero,
      name: item.nombre,
      description: item.descripcion,
      status: mapStatus(item.estado),
      expected_value: item.valores_comparados?.tasa_esperada || item.valores_comparados?.total_ingresos_renta,
      actual_value: item.valores_comparados?.tasa_calculada || item.valores_comparados?.total_ingresos_iva,
      tolerance: item.tolerancia_aplicada,
      difference: item.valores_comparados?.diferencia,
      details: item.recomendacion || item.mensaje_error,
      requires_renta: item.numero === 4, // Cruce IVA vs Renta
      requires_f490: item.numero === 10,
      requires_f350: item.numero === 11
    }))

    // Extraer periodos del formato "2024-01" -> número del mes
    const periodsValidated = (checklistData.periodos_analizados || []).map((p: string) => {
      const parts = p.split('-')
      return parseInt(parts[1], 10)
    })

    return {
      success: checklistData.validaciones_error === 0,
      timestamp: checklistData.fecha_validacion || new Date().toISOString(),
      nit: checklistData.nit || '',
      razon_social: fullData?.documentos_procesados?.razon_social || '',
      periods_validated: periodsValidated,
      ano_gravable: checklistData.ano_gravable || new Date().getFullYear(),
      validations,
      summary: {
        total: checklistData.total_validaciones || 11,
        passed: checklistData.validaciones_ok || 0,
        failed: checklistData.validaciones_error || 0,
        warnings: checklistData.validaciones_advertencia || 0,
        skipped: checklistData.validaciones_no_aplica || 0
      },
      message: checklistData.resumen_ejecutivo
    }
  }
}

// Exportar instancia singleton
export const ivaValidationService = new IvaValidationService()

// ============================================
// VALIDATION DESCRIPTIONS (for UI)
// ============================================

export const VALIDATION_DESCRIPTIONS: Record<number, { name: string; description: string; formula?: string }> = {
  1: {
    name: 'Marca de agua "Recibido"',
    description: 'Verifica que el documento tenga la marca de agua oficial de presentación ante la DIAN.'
  },
  2: {
    name: 'Tarifa IVA Generado 5%',
    description: 'Valida que el IVA generado al 5% corresponda correctamente a los ingresos gravados.',
    formula: '(R58+R62+R64)/(R27+R36+R38) = 5% ±0.1%'
  },
  3: {
    name: 'Tarifa IVA Generado 19%',
    description: 'Valida que el IVA generado al 19% corresponda correctamente a los ingresos gravados.',
    formula: '(R59+R61+R63)/(R28+R34+R37) = 19% ±0.1%'
  },
  4: {
    name: 'Cruce IVA vs Renta',
    description: 'Verifica consistencia entre los ingresos declarados en IVA y en Renta.',
    formula: 'Suma R43 = R61+R70+R80 (tolerancia $1.000)'
  },
  5: {
    name: 'Tarifa IVA Descontable 5%',
    description: 'Valida que el IVA descontable al 5% corresponda correctamente a las compras.',
    formula: '(R68+R71+R73+R74)/(R44+R50+R52) = 5% ±0.1%'
  },
  6: {
    name: 'Tarifa IVA Descontable 19%',
    description: 'Valida que el IVA descontable al 19% corresponda correctamente a las compras.',
    formula: '(R69+R72+R75+R78)/(R45+R51+R53+R49) = 19% ±0.1%'
  },
  7: {
    name: 'Devoluciones Compras',
    description: 'Verifica que las devoluciones en compras no excedan el IVA máximo aplicable.',
    formula: 'Si R66>0, R56>0 y R66/R56 ≤ 19%'
  },
  8: {
    name: 'Devoluciones Ventas',
    description: 'Verifica que las devoluciones en ventas no excedan el IVA máximo aplicable.',
    formula: 'Si R79>0, R42>0 y R79/R42 ≤ 19%'
  },
  9: {
    name: 'Saldo Favor Anterior',
    description: 'Verifica que el saldo a favor del periodo anterior coincida con el imputado.',
    formula: 'R84 actual = R93 periodo anterior'
  },
  10: {
    name: 'Pago vs F490',
    description: 'Verifica que el saldo a pagar tenga soporte de pago en formulario 490.',
    formula: 'Si R86>0, debe existir F490 con estado "Pagado"'
  },
  11: {
    name: 'IVA Exterior vs Retenciones',
    description: 'Verifica consistencia entre IVA de operaciones del exterior y retenciones F350.',
    formula: 'R78 F300 = Suma R132 F350'
  }
}
