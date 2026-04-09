import { getAuthHeaders } from '@/lib/utils/api-helpers'

// Types for RUT extraction API response
export interface RepresentanteLegal {
  tipo_representacion: string
  tipo_documento: string
  numero_identificacion: string
  dv: string | null
  primer_apellido: string
  segundo_apellido: string
  primer_nombre: string
  otros_nombres: string
  numero_tarjeta_profesional: string | null
  fecha_inicio_ejercicio: string
}

export interface RutData {
  nit: string
  dv: string
  numero_formulario: string
  razon_social: string
  nombre_comercial: string
  sigla: string
  tipo_contribuyente: string
  tipo_documento: string
  pais: string
  departamento: string
  ciudad_municipio: string
  direccion_principal: string
  codigo_postal: string
  telefono_1: string
  telefono_2: string
  correo_electronico: string
  actividad_principal_codigo: string
  actividad_principal_fecha_inicio: string
  actividad_secundaria_codigo: string
  actividad_secundaria_fecha_inicio: string
  responsabilidades: string[]
  representantes_legales: RepresentanteLegal[]
  fecha_expedicion: string
  fecha_generacion_pdf: string
  direccion_seccional: string
  buzon_electronico: string
  composicion_capital: string | null
  estado_actual: string | null
  fecha_cambio_estado: string | null
  extraction_timestamp: string
  message: string
}

export interface ExtractionResult {
  filename: string
  success: boolean
  data: RutData | null
  error: string | null
  excel_written: boolean
}

export interface RutExtractionResponse {
  total_files: number
  successful_extractions: number
  failed_extractions: number
  results: ExtractionResult[]
  total_excel_entries: number
  processing_time_seconds: number
  extraction_timestamp: string
  common_errors: string[]
  message: string
}

export interface ClientProviderInfo {
  id: number
  nombre_comercial: string
  tipo_entidad: string
  categoria: string
  razon_social_principal: string | null
}

export interface AsociacionInfo {
  id: number
  es_principal: boolean
  rol_en_relacion: string | null
  fecha_asociacion: string
  observaciones: string
}

// Metadata de detección automática de tipo de contribuyente
export interface DeteccionTipo {
  tipo_contribuyente_detectado: 'JURIDICA' | 'NATURAL'
  agente_usado: string
  deteccion_automatica: boolean
  fallback?: boolean
  agente_principal_fallido?: string
}

export interface CodigoRingana {
  cod_ringana: number
  no_documento: string
  nombres: string
  apellidos: string
  correo: string
  encontrado: boolean
}

export interface ExtractionResultWithClient {
  filename: string
  success: boolean
  data: {
    rut_data: RutData
    cliente_proveedor: ClientProviderInfo
    asociacion: AsociacionInfo
    codigo_ringana?: CodigoRingana | null
    message: string
    deteccion_tipo?: DeteccionTipo | null
  } | null
  error: string | null
  excel_written: boolean
}

export interface RutExtractionWithClientResponse {
  total_files: number
  successful_extractions: number
  failed_extractions: number
  processing_time_seconds: number
  cliente_proveedor: ClientProviderInfo
  total_excel_entries: number
  total_associations_created: number
  extraction_timestamp: string
  common_errors: string[]
  message: string
  results: ExtractionResultWithClient[]
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// SSE streaming events
export interface SSEProgressEvent {
  message: string
  percentage: number
  current_file: string
  files_processed: number
  total_files: number
}

export interface SSEFileResultEvent {
  filename: string
  success: boolean
  index: number
  total: number
  error: string | null
}

export interface SSECallbacks {
  onProgress?: (data: SSEProgressEvent) => void
  onFileResult?: (data: SSEFileResultEvent) => void
  onComplete: (data: RutExtractionWithClientResponse) => void
  onError: (error: string) => void
}

class RutService {
  private baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005'}/api/v1/contabilidad`

  /**
   * Extraccion de RUTs via SSE streaming — muestra progreso en tiempo real
   */
  async extractRutFromFilesWithClientStream(
    files: File[],
    clientProviderId: number,
    callbacks: SSECallbacks
  ): Promise<void> {
    if (!files.length) {
      callbacks.onError('No se han proporcionado archivos')
      return
    }

    if (!clientProviderId) {
      callbacks.onError('Debe seleccionar un cliente/proveedor')
      return
    }

    const formData = new FormData()
    formData.append('codigo_empresa', clientProviderId.toString())
    files.forEach((file) => formData.append('files', file))

    try {
      const authHeaders = getAuthHeaders()
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>

      const response = await fetch(`${this.baseUrl}/extraer/rut/lote/con-cliente/stream`, {
        method: 'POST',
        body: formData,
        headers: headersWithoutContentType
      })

      if (!response.ok) {
        let errorText = 'Error en el servidor'
        try {
          const errorData = await response.json()
          errorText = errorData.detail || errorData.message || `HTTP ${response.status} ${response.statusText}`
        } catch {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        callbacks.onError(`Error HTTP ${response.status}: ${errorText}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError('El navegador no soporta streaming')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (eventType === 'progress') {
                callbacks.onProgress?.(data)
              } else if (eventType === 'file_result') {
                callbacks.onFileResult?.(data)
              } else if (eventType === 'complete') {
                callbacks.onComplete(data)
              } else if (eventType === 'error') {
                callbacks.onError(data.error || 'Error desconocido')
              }
            } catch {
              // Linea de datos incompleta, ignorar
            }
          }
        }
      }
    } catch (error) {
      console.error('Error en SSE streaming:', error)
      callbacks.onError(error instanceof Error ? error.message : 'Error de conexion')
    }
  }

  /**
   * Extraccion de RUTs — endpoint legacy sin streaming
   */
  async extractRutFromFilesWithClient(
    files: File[],
    clientProviderId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<RutExtractionWithClientResponse> {
    if (!files.length) {
      throw new Error('No se han proporcionado archivos')
    }

    if (!clientProviderId) {
      throw new Error('Debe seleccionar un cliente/proveedor')
    }

    const formData = new FormData()
    formData.append('codigo_empresa', clientProviderId.toString())
    files.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const authHeaders = getAuthHeaders()
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>

      const response = await fetch(`${this.baseUrl}/extraer/rut/lote/con-cliente`, {
        method: 'POST',
        body: formData,
        headers: headersWithoutContentType
      })

      if (!response.ok) {
        let errorText = 'Error en el servidor'
        try {
          const errorData = await response.json()
          errorText = errorData.detail || errorData.message || `HTTP ${response.status} ${response.statusText}`
        } catch {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        throw new Error(`Error HTTP ${response.status}: ${errorText}`)
      }

      const data: RutExtractionWithClientResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error extracting RUT data with client:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido durante la extracción')
    }
  }

  async extractRutFromFiles(
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<RutExtractionResponse> {
    if (!files.length) {
      throw new Error('No se han proporcionado archivos')
    }

    const formData = new FormData()

    // Add all files to form data
    files.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const authHeaders = getAuthHeaders()
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders as Record<string, string>

      const response = await fetch(`${this.baseUrl}/extraer/rut/lote`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        headers: headersWithoutContentType
      })

      if (!response.ok) {
        let errorText = 'Error desconocido'
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        throw new Error(`Error HTTP ${response.status}: ${errorText}`)
      }

      const data: RutExtractionResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error extracting RUT data:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido al procesar los archivos')
    }
  }

  async extractRutFromFilesWithProgress(
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<RutExtractionResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

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
            const data: RutExtractionResponse = JSON.parse(xhr.responseText)
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
      xhr.open('POST', `${this.baseUrl}/extraer/rut/lote`, true)
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

  async getRutList(page: number = 1, pageSize: number = 20): Promise<RutListResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ruts?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`)
      }

      const data: RutListResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching RUT list:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido al obtener la lista de RUTs')
    }
  }

  async updateRutState(nit: string, newState: string): Promise<RutStateUpdateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ruts/${nit}/estado`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          new_state: newState
        })
      })

      if (!response.ok) {
        let errorText = 'Error desconocido'
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        throw new Error(`Error HTTP ${response.status}: ${errorText}`)
      }

      const data: RutStateUpdateResponse = await response.json()
      return data
    } catch (error) {
      console.error('Error updating RUT state:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido al actualizar el estado del RUT')
    }
  }

  async getRutDetails(nit: string): Promise<RutDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/ruts/${nit}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        let errorText = 'Error desconocido'
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        throw new Error(`Error HTTP ${response.status}: ${errorText}`)
      }

      const data: RutDetails = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching RUT details:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido al obtener los detalles del RUT')
    }
  }
}

// Types for RUT list API response
export interface RutItem {
  id: number
  nit: string
  dv: string
  numero_formulario: string
  razon_social: string
  nombre_comercial: string
  tipo_contribuyente: string
  pais: string
  departamento: string
  ciudad_municipio: string
  direccion_principal: string
  telefono_1: string
  correo_electronico: string
  actividad_principal_codigo: string
  processing_state: string
  representantes_legales: RepresentanteLegal[]
  created_at: string
  updated_at: string | null
  original_filename: string
}

export interface RutListResponse {
  total_count: number
  page: number
  page_size: number
  total_pages: number
  ruts: RutItem[]
  state_counts: {
    EXTRAIDO: number
    LISTO: number
    PROCESADO: number
  }
}

export interface RutStateUpdateResponse {
  success: boolean
  message: string
  nit: string
  new_state: string
}

export interface RutDetails {
  id: number
  nit: string
  dv: string
  numero_formulario: string
  razon_social: string
  nombre_comercial: string
  tipo_contribuyente: string
  pais: string
  departamento: string
  ciudad_municipio: string
  direccion_principal: string
  telefono_1: string
  correo_electronico: string
  actividad_principal_codigo: string
  processing_state: string
  representantes_legales: RepresentanteLegal[]
  created_at: string
  updated_at: string | null
  original_filename: string
}

export const rutService = new RutService()