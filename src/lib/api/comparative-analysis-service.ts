import { getAuthHeaders } from '@/lib/utils/api-helpers'
import { FEATURES } from '@/config/features'

// Types for SSE Progress Events
export interface SSEProgressEvent {
  percentage: number
  message: string
}

// Types for Comparative Analysis API response
export interface VariationAnalysis {
  field_name: string
  line_number: string
  current_value: number
  previous_value: number
  nominal_variation: number
  relative_variation: number
  variation_percentage: string | null
}

// Vertical Analysis Types
export interface VerticalAnalysisField {
  field_name: string
  line_number: string
  value: number | null
  base_value: number | null
  percentage: number | null
  percentage_formatted: string | null
  base_field: string
}

export interface VerticalAnalysisBlock {
  block_name: string
  base_field: string
  base_value: number | null
  fields: VerticalAnalysisField[]
}

export interface VerticalAnalysisYear {
  year: number
  nit: string
  razon_social: string | null
  patrimonio_block: VerticalAnalysisBlock
  resultados_block: VerticalAnalysisBlock
  impuestos_block: VerticalAnalysisBlock
  pagos_saldos_block: VerticalAnalysisBlock
  key_insights: string[]
}

export interface StructureChange {
  campo: string
  linea: string
  porcentaje_actual: string
  porcentaje_anterior: string
  cambio_puntos_porcentuales: string
  interpretacion: string
}

export interface StructureComparison {
  cambios_significativos: StructureChange[]
  total_cambios_identificados: number
  criterio_significancia: string
}

export interface ComparativeAnalysisResponse {
  nit: string
  razon_social: string
  current_year: number
  previous_year: number
  patrimonio_analysis: VariationAnalysis
  ingresos_analysis: VariationAnalysis
  gastos_analysis: VariationAnalysis
  renta_liquida_analysis: VariationAnalysis
  impuesto_analysis: VariationAnalysis
  all_variations: VariationAnalysis[]
  summary: Record<string, any>

  // Vertical Analysis Fields
  analisis_vertical_declaracion_current?: VerticalAnalysisYear
  analisis_vertical_declaracion_previous?: VerticalAnalysisYear
  estructura_comparacion?: StructureComparison

  analysis_timestamp: string
  message: string
}

export interface ComparativeAnalysisError {
  detail: Array<{
    loc: (string | number)[]
    msg: string
    type: string
  }>
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

class ComparativeAnalysisService {
  private baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005'}/api/v1/compliance`

  /**
   * Analiza declaraciones comparativas con soporte para SSE (Server-Sent Events)
   * Si FEATURES.USE_SSE_PROGRESS está habilitado, usa el endpoint /stream
   * Si está deshabilitado, usa el endpoint original
   */
  async analyzeDeclarationComparative(
    currentYearFile: File,
    previousYearFile: File,
    onProgress?: (progress: UploadProgress) => void,
    onSSEProgress?: (progress: SSEProgressEvent) => void
  ): Promise<ComparativeAnalysisResponse> {
    if (!currentYearFile) {
      throw new Error('No se ha proporcionado el archivo del año actual')
    }

    if (!previousYearFile) {
      throw new Error('No se ha proporcionado el archivo del año anterior')
    }

    const formData = new FormData()
    formData.append('current_year_file', currentYearFile)
    formData.append('previous_year_file', previousYearFile)

    // Elegir endpoint según feature flag
    if (FEATURES.USE_SSE_PROGRESS && onSSEProgress) {
      return await this.analyzeWithSSE(formData, onSSEProgress)
    } else {
      return await this.analyzeWithoutSSE(formData)
    }
  }

  /**
   * Análisis usando SSE (Server-Sent Events) para mostrar progreso en tiempo real
   */
  private async analyzeWithSSE(
    formData: FormData,
    onProgress: (progress: SSEProgressEvent) => void
  ): Promise<ComparativeAnalysisResponse> {
    const authHeaders = getAuthHeaders()
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>

    const response = await fetch(`${this.baseUrl}/analyze/declaration/comparative/stream`, {
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
    let result: ComparativeAnalysisResponse | null = null
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
                throw new Error(error.error || 'Error en el análisis')
              } catch (e) {
                if (e instanceof Error) throw e
                throw new Error('Error desconocido en el análisis')
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (!result) {
      throw new Error('No se recibió resultado del análisis')
    }

    return result
  }

  /**
   * Análisis tradicional sin SSE (endpoint original)
   */
  private async analyzeWithoutSSE(
    formData: FormData
  ): Promise<ComparativeAnalysisResponse> {
    try {
      const authHeaders = getAuthHeaders()
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>

      const response = await fetch(`${this.baseUrl}/analyze/declaration/comparative`, {
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

      const data: ComparativeAnalysisResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error analyzing comparative declaration:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido durante el análisis comparativo')
    }
  }

  async analyzeDeclarationComparativeWithProgress(
    currentYearFile: File,
    previousYearFile: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ComparativeAnalysisResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      const formData = new FormData()
      formData.append('current_year_file', currentYearFile)
      formData.append('previous_year_file', previousYearFile)

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
            const data: ComparativeAnalysisResponse = JSON.parse(xhr.responseText)
            resolve(data)
          } catch (error) {
            reject(new Error('Error al procesar la respuesta del servidor'))
          }
        } else {
          let errorMessage = `Error HTTP ${xhr.status}: ${xhr.statusText}`
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            if (errorResponse.detail && Array.isArray(errorResponse.detail)) {
              errorMessage = errorResponse.detail.map((err: any) => err.msg).join(', ')
            } else if (errorResponse.detail || errorResponse.message) {
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
        reject(new Error('Tiempo de espera agotado (10 minutos)'))
      })

      // Setup request
      xhr.open('POST', `${this.baseUrl}/analyze/declaration/comparative`, true)
      xhr.timeout = 600000 // 10 minutes timeout

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

export const comparativeAnalysisService = new ComparativeAnalysisService()