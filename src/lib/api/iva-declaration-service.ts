import { getAuthHeaders } from "@/lib/utils/api-helpers"

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005'}/api/v1/compliance`

// Types based on API response
export interface IvaDatosDeclarante {
  ano: number
  periodo: number
  numero_formulario: string
  nit: string
  dv: string
  primer_apellido: string | null
  segundo_apellido: string | null
  primer_nombre: string | null
  otros_nombres: string | null
  razon_social: string
  codigo_direccion_seccional: string
  codigo_actividad_economica: string | null
  periodicidad: string
  es_correccion: boolean | null
  formulario_anterior: string | null
}

export interface IvaIngresos {
  ingresos_gravados_5_porciento: number
  ingresos_gravados_tarifa_general: number
  aiu_operaciones_gravadas: number
  exportaciones_bienes: number
  exportaciones_servicios: number
  ventas_sociedades_comercializacion_int: number
  ventas_zonas_francas: number
  juegos_suerte_azar: number
  operaciones_exentas: number
  venta_cerveza: number
  venta_gaseosas_similares: number
  venta_licores_aperitivos_vinos: number
  operaciones_excluidas: number
  operaciones_no_gravadas: number
  total_ingresos_brutos: number
  devoluciones_ventas_anuladas: number
  total_ingresos_netos_periodo: number
}

export interface IvaImportaciones {
  importacion_bienes_5_porciento: number
  importacion_bienes_tarifa_general: number
  importacion_bienes_servicios_zf: number
  importacion_bienes_no_gravados: number
  importacion_bienes_excluidos_zf: number
}

export interface IvaComprasNacionales {
  compras_servicios: number
  compras_bienes_5_porciento: number
  compras_bienes_tarifa_general: number
  compras_servicios_5_porciento: number
  compras_servicios_tarifa_general: number
  compras_bienes_excluidos_exentos: number
  total_compras_importaciones_brutas: number
  devoluciones_compras_anuladas: number
  total_compras_netas_periodo: number
}

export interface IvaImpuestoGenerado {
  impuesto_generado_5_porciento: number
  impuesto_generado_tarifa_general: number
  impuesto_aiu_operaciones: number
  impuesto_juegos_suerte_azar: number
  impuesto_venta_cerveza: number
  impuesto_venta_gaseosas: number
  impuesto_venta_licores_5_porciento: number
  impuesto_retiro_inventario: number
  iva_recuperado_devoluciones_compras: number
  total_impuesto_generado: number
}

export interface IvaImpuestoDescontable {
  iva_importaciones_5_porciento: number
  iva_importaciones_tarifa_general: number
  iva_bienes_servicios_zf: number
  iva_compras_bienes_5_porciento: number
  iva_compras_bienes_tarifa_general: number
  iva_licores_aperitivos_vinos: number
  iva_servicios_5_porciento: number
  iva_servicios_tarifa_general: number
  descuento_iva_hidrocarburos: number
  total_impuesto_pagado_facturado: number
  iva_retenido_no_domiciliados: number
  iva_resultante_devoluciones_ventas: number
  ajuste_impuestos_descontables: number
  total_impuestos_descontables: number
}

export interface IvaLiquidacionPrivada {
  saldo_pagar_periodo_fiscal: number
  saldo_favor_periodo_fiscal: number
  saldo_favor_periodo_anterior: number
  retenciones_iva_practicaron: number
  saldo_pagar_impuesto: number
  sanciones: number
  total_saldo_pagar: number
  total_saldo_favor: number
  saldo_favor_devolucion_compensacion: number
  saldo_favor_devolver_imputar_sig: number
  saldo_favor_sin_derecho_imputar: number
  total_saldo_favor_imputar_sig: number
}

export interface IvaAnticiposRegimenSimple {
  anticipo_bimestre_1: number
  anticipo_bimestre_2: number
  anticipo_bimestre_3: number
  anticipo_bimestre_4: number
  anticipo_bimestre_5: number
  anticipo_bimestre_6: number
  total_anticipos_iva_simple: number
}

export interface IvaPagoFirmas {
  pago_total: number | null
  numero_identificacion_signatario: string | null
  dv_signatario: string | null
}

export interface IvaMetadatos {
  fecha_extraccion: string
  campos_extraidos: number
  campos_vacios: number
  confianza_extraccion: number | null
  file_hash: string
  processing_state: string
}

export interface IvaDeclarationData {
  datos_declarante: IvaDatosDeclarante
  ingresos: IvaIngresos
  importaciones: IvaImportaciones
  compras_nacionales: IvaComprasNacionales
  impuesto_generado: IvaImpuestoGenerado
  impuesto_descontable: IvaImpuestoDescontable
  liquidacion_privada: IvaLiquidacionPrivada
  anticipos_regimen_simple: IvaAnticiposRegimenSimple
  pago_firmas: IvaPagoFirmas
  metadatos: IvaMetadatos
}

export interface IvaExtractionResult {
  filename: string
  success: boolean
  data: IvaDeclarationData | null
  errors: string[] | null
}

export interface IvaExtractionResponse {
  success: boolean
  message: string
  total_files: number
  successful: number
  failed: number
  results: IvaExtractionResult[]
}

export const ivaDeclarationService = {
  async extractDeclarations(files: File[]): Promise<IvaExtractionResponse> {
    const formData = new FormData()

    files.forEach((file) => {
      formData.append('iva_files', file)
    })

    const headers = getAuthHeaders()
    // Remove Content-Type to let browser set it with boundary for multipart
    delete (headers as Record<string, string>)['Content-Type']

    const response = await fetch(`${BASE_URL}/extract/iva-declaration`, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!response.ok) {
      let errorMessage = `Error ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }
}

// Helper function to get period name
export function getPeriodName(periodo: number, periodicidad: string): string {
  if (periodicidad === 'Bimestral') {
    const bimestres = [
      'Enero - Febrero',
      'Marzo - Abril',
      'Mayo - Junio',
      'Julio - Agosto',
      'Septiembre - Octubre',
      'Noviembre - Diciembre'
    ]
    return bimestres[periodo - 1] || `Bimestre ${periodo}`
  } else if (periodicidad === 'Cuatrimestral') {
    const cuatrimestres = [
      'Enero - Abril',
      'Mayo - Agosto',
      'Septiembre - Diciembre'
    ]
    return cuatrimestres[periodo - 1] || `Cuatrimestre ${periodo}`
  }
  return `Periodo ${periodo}`
}
