import { getAuthHeaders } from '@/lib/utils/api-helpers'
import { FEATURES } from '@/config/features'

// Types for SSE Progress Events
export interface SSEProgressEvent {
  percentage: number
  message: string
}

// Types for Declaration extraction API response
export interface ContribuyenteInfo {
  clasificacion: string
  vigencia_periodo: string
  numero_consecutivo: number
  razon_social_oficial: string
}

export interface PagoDetalle {
  numero_formulario: string
  fecha_pago: string
  cuota_numero: number
  valor_impuesto: number
  valor_intereses: number
  valor_sancion: number
  total_pago: number
  concepto: string
  periodo: string
}

export interface PagoAnalizado {
  cuota: number
  fecha_pago: string
  fecha_limite: string
  pago_oportuno: boolean
  dias_mora: number | null
}

export interface CumplimientoFechas {
  analisis_disponible: boolean
  es_gran_contribuyente: boolean
  tipo_contribuyente: string
  ano_gravable: number
  ultimo_digito_nit: number
  pagos_analizados: PagoAnalizado[]
  todos_pagos_oportunos: boolean
  observaciones: string | null
}

export interface AnalisisPagos {
  total_declarado: number
  total_pagado: number
  saldo_pendiente: number
  sobrepago: number
  estado_pago: 'PAGO_PARCIAL' | 'PAGADO_COMPLETO' | 'SOBREPAGO' | 'SIN_PAGOS'
  porcentaje_pagado: number
  numero_pagos: number
  pagos_detalle: PagoDetalle[]
  cumplimiento_fechas: CumplimientoFechas
}

export interface DeclarationExtractionResponse {
  nit: string
  razon_social: string
  ano_gravable: number
  numero_formulario: string
  codigo_direccion_seccional: string
  actividad_economica_principal: string
  submission_date: string
  submission_date_only: string
  efectivo_equivalentes: number
  inversiones_instrumentos_financieros: number
  cuentas_documentos_arrendamientos: number
  inventarios: number
  activos_intangibles: number
  activos_biologicos: number
  propiedades_planta_equipo: number
  otros_activos: number
  patrimonio_bruto: number
  deudas: number
  patrimonio_liquido: number
  ingresos_brutos_actividades_ordinarias: number
  ingresos_financieros: number
  otros_ingresos: number
  total_ingresos_brutos: number
  devoluciones_rebajas_descuentos: number
  ingresos_no_constitutivos_renta: number
  ingresos_netos: number
  costos: number
  gastos_administracion: number
  gastos_distribucion_ventas: number
  gastos_financieros: number
  otros_gastos_deducciones: number
  total_costos_gastos: number
  total_costos_gastos_nomina: number
  aportes_sistema_seguridad_social: number
  aportes_sena_icbf_cajas: number
  inversiones_efectuadas_ano: number
  inversiones_liquidadas_periodos_anteriores: number
  renta_recuperacion_deducciones: number
  renta_pasiva_ece: number
  renta_liquida_ordinaria_ejercicio: number
  compensaciones: number
  renta_liquida: number
  renta_presuntiva: number
  renta_exenta: number
  rentas_gravables: number
  renta_liquida_gravable: number
  ingresos_ganancias_ocasionales: number
  costos_ganancias_ocasionales: number
  ganancias_ocasionales_no_gravadas: number
  ganancias_ocasionales_gravables: number
  subtotal_renta_impuesto: number
  impuesto_renta_liquida: number
  valor_adicionar_vaa: number
  descuentos_tributarios: number
  impuesto_neto_renta_sin_adicionado: number
  impuesto_adicionar_ia: number
  impuesto_neto_renta_con_adicionado: number
  impuesto_ganancias_ocasionales: number
  descuento_impuestos_exterior_ganancias: number
  total_impuesto_cargo: number
  valor_inversion_obras_impuestos_50: number
  descuento_efectivo_inversion_obras: number
  credito_fiscal_articulo_256: number
  anticipo_renta_liquidado_anterior: number
  saldo_favor_anterior_sin_solicitud: number
  autorretenciones: number
  otras_retenciones: number
  retenciones_autorretenciones: number
  anticipo_renta_ano_siguiente: number
  anticipo_puntos_adicionales_anterior: number
  anticipo_puntos_adicionales_siguiente: number
  saldo_pagar_impuesto: number
  sanciones: number
  valor_pagar: number
  saldo_favor: number
  fecha_presentacion: string
  hora_presentacion: string
  liquidacion_tipo: string
  codigo_contador_revisor: string
  numero_tarjeta_profesional: string
  es_gran_contribuyente: boolean
  contribuyente_info: ContribuyenteInfo | Record<string, any>
  additional_fields: Record<string, any>
  extraction_timestamp: string
  message: string
}

export interface DetailedDeclarationResponse {
  declaracion: DeclarationExtractionResponse
  analisis_pagos: AnalisisPagos | null
  tiene_pagos: boolean
  es_gran_contribuyente: boolean
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

class DeclarationService {
  private baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005'}/api/v1/compliance`

  /**
   * Extrae declaración detallada con soporte para SSE (Server-Sent Events)
   * Si FEATURES.USE_SSE_PROGRESS está habilitado, usa el endpoint /stream
   * Si está deshabilitado, usa el endpoint original
   */
  async extractDetailedDeclaration(
    declarationFile: File,
    paymentFiles?: File[],
    onProgress?: (progress: UploadProgress) => void,
    onSSEProgress?: (progress: SSEProgressEvent) => void
  ): Promise<DetailedDeclarationResponse> {
    if (!declarationFile) {
      throw new Error('No se ha proporcionado archivo de declaración')
    }

    const formData = new FormData()
    formData.append('declaration_file', declarationFile)

    // Agregar archivos de pago opcionales
    if (paymentFiles && paymentFiles.length > 0) {
      paymentFiles.forEach(file => {
        formData.append('payment_files', file)
      })
    }

    // Elegir endpoint según feature flag
    if (FEATURES.USE_SSE_PROGRESS && onSSEProgress) {
      return await this.extractDetailedWithSSE(formData, onSSEProgress)
    } else {
      return await this.extractDetailedWithoutSSE(formData, onProgress)
    }
  }

  /**
   * Extracción usando SSE (Server-Sent Events) para mostrar progreso en tiempo real
   */
  private async extractDetailedWithSSE(
    formData: FormData,
    onProgress: (progress: SSEProgressEvent) => void
  ): Promise<DetailedDeclarationResponse> {
    const authHeaders = getAuthHeaders()
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>

    const response = await fetch(`${this.baseUrl}/extract/declaration/detailed/stream`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      headers: headersWithoutContentType
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
    let result: DetailedDeclarationResponse | null = null
    let buffer = ''

    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Mantener la última línea incompleta en el buffer
        buffer = lines.pop() || ''

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()

          if (line.startsWith('event: progress')) {
            // La siguiente línea contiene el data
            const dataLine = lines[i + 1]
            if (dataLine && dataLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(dataLine.substring(6))
                onProgress({
                  percentage: data.percentage,
                  message: data.message
                })
              } catch (e) {
                console.error('Error parsing progress data:', e)
              }
            }
          } else if (line.startsWith('event: complete')) {
            const dataLine = lines[i + 1]
            if (dataLine && dataLine.startsWith('data: ')) {
              try {
                result = JSON.parse(dataLine.substring(6))
              } catch (e) {
                console.error('Error parsing complete data:', e)
              }
            }
          } else if (line.startsWith('event: error')) {
            const dataLine = lines[i + 1]
            if (dataLine && dataLine.startsWith('data: ')) {
              try {
                const error = JSON.parse(dataLine.substring(6))
                throw new Error(error.error || 'Error en la extracción')
              } catch (e) {
                if (e instanceof Error) throw e
                throw new Error('Error desconocido en la extracción')
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (!result) {
      throw new Error('No se recibió resultado de la extracción')
    }

    return result
  }

  /**
   * Extracción tradicional sin SSE (endpoint original)
   */
  private async extractDetailedWithoutSSE(
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DetailedDeclarationResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Upload progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          }
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data: DetailedDeclarationResponse = JSON.parse(xhr.responseText)
            resolve(data)
          } catch (error) {
            reject(new Error('Error al procesar la respuesta del servidor'))
          }
        } else {
          let errorMessage = `Error HTTP ${xhr.status}: ${xhr.statusText}`
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            if (errorResponse.detail) {
              errorMessage = errorResponse.detail
            }
          } catch (e) {
            // Keep default error message
          }
          reject(new Error(errorMessage))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Error de conexión al servidor'))
      })

      xhr.addEventListener('timeout', () => {
        reject(new Error('Tiempo de espera agotado (2 minutos)'))
      })

      // Setup request
      xhr.open('POST', `${this.baseUrl}/extract/declaration/detailed`, true)
      xhr.timeout = 120000 // 2 minutes timeout

      // Add headers for CORS and Authentication
      const authHeaders = getAuthHeaders() as Record<string, string>
      Object.entries(authHeaders).forEach(([key, value]) => {
        if (key !== 'Content-Type') {
          xhr.setRequestHeader(key, value)
        }
      })

      // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      xhr.send(formData)
    })
  }

  async extractDeclarationData(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DeclarationExtractionResponse> {
    if (!file) {
      throw new Error('No se ha proporcionado archivo')
    }

    const formData = new FormData()
    formData.append('declaration_file', file)

    try {
      const authHeaders = getAuthHeaders()
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>

      const response = await fetch(`${this.baseUrl}/extract/declaration/detailed`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        headers: headersWithoutContentType
      })

      if (!response.ok) {
        let errorText = 'Error desconocido'
        try {
          const errorData = await response.json()
          errorText = errorData.detail || errorData.message || `HTTP ${response.status} ${response.statusText}`
        } catch {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        throw new Error(`Error HTTP ${response.status}: ${errorText}`)
      }

      const data: DeclarationExtractionResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error extracting declaration data:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido durante la extracción')
    }
  }

  async extractDeclarationWithProgress(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DeclarationExtractionResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      const formData = new FormData()
      formData.append('declaration_file', file)

      // Upload progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          }
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data: DeclarationExtractionResponse = JSON.parse(xhr.responseText)
            resolve(data)
          } catch (error) {
            reject(new Error('Error al procesar la respuesta del servidor'))
          }
        } else {
          let errorMessage = `Error HTTP ${xhr.status}: ${xhr.statusText}`
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            if (errorResponse.detail || errorResponse.message) {
              errorMessage = errorResponse.detail || errorResponse.message
            }
          } catch (e) {
            // Keep default error message
          }
          reject(new Error(errorMessage))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Error de conexión al servidor. Verifica que el servidor esté ejecutándose en http://localhost:8001'))
      })

      xhr.addEventListener('timeout', () => {
        reject(new Error('Tiempo de espera agotado (5 minutos)'))
      })

      // Setup request
      xhr.open('POST', `${this.baseUrl}/extract/declaration/detailed`, true)
      xhr.timeout = 300000 // 5 minutes timeout

      // Add headers for CORS and Authentication
      const authHeaders = getAuthHeaders() as Record<string, string>
      Object.entries(authHeaders).forEach(([key, value]) => {
        if (key !== 'Content-Type') {
          xhr.setRequestHeader(key, value)
        }
      })

      // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      xhr.send(formData)
    })
  }
}

export const declarationService = new DeclarationService()