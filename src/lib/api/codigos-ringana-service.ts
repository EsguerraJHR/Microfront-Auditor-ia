import { authenticatedFetch } from '@/lib/utils/api-helpers'

export interface CodigoRinganaRecord {
  id: number
  cod_ringana: number
  no_documento: string
  apellidos: string
  nombres: string
  correo: string
  created_at?: string
  updated_at?: string
}

export interface CodigoRinganaListResponse {
  items: CodigoRinganaRecord[]
  total: number
  page: number
  size: number
  pages: number
}

export interface CreateCodigoRinganaPayload {
  cod_ringana: number
  no_documento: string
  apellidos: string
  nombres: string
  correo: string
}

export type UpdateCodigoRinganaPayload = Partial<CreateCodigoRinganaPayload>

class CodigosRinganaService {
  private baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005'}/api/v1/terceros-codigos-ringana`

  async list(page = 1, size = 20, search = ''): Promise<CodigoRinganaListResponse> {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (search) params.set('search', search)

    const response = await authenticatedFetch(`${this.baseUrl}/?${params}`)
    if (!response.ok) throw new Error('Error al listar codigos Ringana')
    const data = await response.json()

    // Normalizar respuesta — el backend puede retornar diferentes estructuras
    const items = data.items || data.results || data
    const total = data.total ?? data.count ?? (Array.isArray(items) ? items.length : 0)
    const pages = data.pages ?? data.total_pages ?? (Math.ceil(total / size) || 1)

    return {
      items: Array.isArray(items) ? items : [],
      total,
      page: data.page ?? page,
      size: data.size ?? size,
      pages,
    }
  }

  async getById(id: number): Promise<CodigoRinganaRecord> {
    const response = await authenticatedFetch(`${this.baseUrl}/${id}`)
    if (!response.ok) throw new Error('Registro no encontrado')
    return response.json()
  }

  async create(data: CreateCodigoRinganaPayload): Promise<CodigoRinganaRecord> {
    const response = await authenticatedFetch(this.baseUrl + '/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Error al crear registro')
    }
    return response.json()
  }

  async update(id: number, data: UpdateCodigoRinganaPayload): Promise<CodigoRinganaRecord> {
    const response = await authenticatedFetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || 'Error al actualizar registro')
    }
    return response.json()
  }

  async delete(id: number): Promise<void> {
    const response = await authenticatedFetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Error al eliminar registro')
  }
}

export const codigosRinganaService = new CodigosRinganaService()
