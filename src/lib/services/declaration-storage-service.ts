import { DetailedDeclarationResponse, DeclarationExtractionResponse, AnalisisPagos } from '@/lib/api/declaration-service'
import { IvaDeclarationData } from '@/lib/api/iva-declaration-service'

// Tipos para datos almacenados
export interface StoredRentaDeclaration {
  declaracion: DeclarationExtractionResponse
  analisis_pagos: AnalisisPagos | null
  tiene_pagos: boolean
  es_gran_contribuyente: boolean
  timestamp: number
}

export interface StoredIvaDeclarations {
  declarations: IvaDeclarationData[]
  timestamp: number
}

// Claves de almacenamiento
const STORAGE_KEYS = {
  RENTA_DECLARATION: 'declaration_renta_data',
  IVA_DECLARATIONS: 'declaration_iva_data'
} as const

class DeclarationStorageService {
  private listeners: ((type: 'renta' | 'iva', data: StoredRentaDeclaration | StoredIvaDeclarations | null) => void)[] = []

  // ============================================
  // RENTA DECLARATION METHODS
  // ============================================

  /**
   * Guarda los datos de declaración de renta en sessionStorage
   */
  saveRentaDeclaration(data: DetailedDeclarationResponse): void {
    try {
      const storedData: StoredRentaDeclaration = {
        declaracion: data.declaracion,
        analisis_pagos: data.analisis_pagos,
        tiene_pagos: data.tiene_pagos,
        es_gran_contribuyente: data.es_gran_contribuyente,
        timestamp: Date.now()
      }

      sessionStorage.setItem(STORAGE_KEYS.RENTA_DECLARATION, JSON.stringify(storedData))
      console.log('✅ Declaración de renta almacenada en sessionStorage', {
        nit: data.declaracion.nit,
        ano: data.declaracion.ano_gravable
      })

      this.notifyListeners('renta', storedData)
    } catch (error) {
      console.error('❌ Error al guardar declaración de renta:', error)
    }
  }

  /**
   * Obtiene los datos de declaración de renta desde sessionStorage
   */
  getRentaDeclaration(): StoredRentaDeclaration | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.RENTA_DECLARATION)
      if (stored) {
        const data = JSON.parse(stored) as StoredRentaDeclaration
        console.log('📄 Declaración de renta cargada desde sessionStorage', {
          nit: data.declaracion.nit,
          ano: data.declaracion.ano_gravable,
          age: this.getDataAge(data.timestamp)
        })
        return data
      }
    } catch (error) {
      console.error('❌ Error al cargar declaración de renta:', error)
      sessionStorage.removeItem(STORAGE_KEYS.RENTA_DECLARATION)
    }
    return null
  }

  /**
   * Verifica si hay datos de declaración de renta disponibles
   */
  hasRentaDeclaration(): boolean {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.RENTA_DECLARATION)
      return stored !== null
    } catch {
      return false
    }
  }

  /**
   * Obtiene información resumida de la declaración de renta almacenada
   */
  getRentaDeclarationSummary(): { nit: string; razonSocial: string; ano: number; timestamp: number } | null {
    const data = this.getRentaDeclaration()
    if (!data) return null

    return {
      nit: data.declaracion.nit,
      razonSocial: data.declaracion.razon_social,
      ano: data.declaracion.ano_gravable,
      timestamp: data.timestamp
    }
  }

  /**
   * Limpia los datos de declaración de renta
   */
  clearRentaDeclaration(): void {
    console.log('🗑️ Limpiando declaración de renta almacenada')
    sessionStorage.removeItem(STORAGE_KEYS.RENTA_DECLARATION)
    this.notifyListeners('renta', null)
  }

  // ============================================
  // IVA DECLARATIONS METHODS
  // ============================================

  /**
   * Guarda los datos de declaraciones de IVA en sessionStorage
   */
  saveIvaDeclarations(declarations: IvaDeclarationData[]): void {
    try {
      const storedData: StoredIvaDeclarations = {
        declarations,
        timestamp: Date.now()
      }

      sessionStorage.setItem(STORAGE_KEYS.IVA_DECLARATIONS, JSON.stringify(storedData))
      console.log('✅ Declaraciones de IVA almacenadas en sessionStorage', {
        count: declarations.length,
        periods: declarations.map(d => d.datos_declarante.periodo)
      })

      this.notifyListeners('iva', storedData)
    } catch (error) {
      console.error('❌ Error al guardar declaraciones de IVA:', error)
    }
  }

  /**
   * Obtiene los datos de declaraciones de IVA desde sessionStorage
   */
  getIvaDeclarations(): StoredIvaDeclarations | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.IVA_DECLARATIONS)
      if (stored) {
        const data = JSON.parse(stored) as StoredIvaDeclarations
        console.log('📄 Declaraciones de IVA cargadas desde sessionStorage', {
          count: data.declarations.length,
          age: this.getDataAge(data.timestamp)
        })
        return data
      }
    } catch (error) {
      console.error('❌ Error al cargar declaraciones de IVA:', error)
      sessionStorage.removeItem(STORAGE_KEYS.IVA_DECLARATIONS)
    }
    return null
  }

  /**
   * Verifica si hay datos de declaraciones de IVA disponibles
   */
  hasIvaDeclarations(): boolean {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.IVA_DECLARATIONS)
      return stored !== null
    } catch {
      return false
    }
  }

  /**
   * Limpia los datos de declaraciones de IVA
   */
  clearIvaDeclarations(): void {
    console.log('🗑️ Limpiando declaraciones de IVA almacenadas')
    sessionStorage.removeItem(STORAGE_KEYS.IVA_DECLARATIONS)
    this.notifyListeners('iva', null)
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Limpia todos los datos almacenados
   */
  clearAll(): void {
    this.clearRentaDeclaration()
    this.clearIvaDeclarations()
  }

  /**
   * Agrega un listener para cambios en los datos almacenados
   */
  addListener(
    listener: (type: 'renta' | 'iva', data: StoredRentaDeclaration | StoredIvaDeclarations | null) => void
  ): () => void {
    this.listeners.push(listener)

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Notifica a todos los listeners sobre cambios
   */
  private notifyListeners(
    type: 'renta' | 'iva',
    data: StoredRentaDeclaration | StoredIvaDeclarations | null
  ): void {
    this.listeners.forEach(listener => {
      try {
        listener(type, data)
      } catch (error) {
        console.error('❌ Error en listener de declaración:', error)
      }
    })
  }

  /**
   * Calcula la edad de los datos en formato legible
   */
  private getDataAge(timestamp: number): string {
    const ageMs = Date.now() - timestamp
    const ageMinutes = Math.floor(ageMs / 60000)

    if (ageMinutes < 1) return 'hace menos de 1 minuto'
    if (ageMinutes < 60) return `hace ${ageMinutes} minutos`

    const ageHours = Math.floor(ageMinutes / 60)
    if (ageHours < 24) return `hace ${ageHours} horas`

    return `hace ${Math.floor(ageHours / 24)} días`
  }

  /**
   * Verifica si los datos son recientes (menos de 1 hora)
   */
  isDataFresh(timestamp: number, maxAgeMs: number = 3600000): boolean {
    return (Date.now() - timestamp) < maxAgeMs
  }
}

// Exportar instancia singleton
export const declarationStorageService = new DeclarationStorageService()
