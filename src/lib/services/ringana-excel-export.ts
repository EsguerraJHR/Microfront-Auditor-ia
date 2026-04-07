import * as XLSX from 'xlsx'
import { RutDetails, DeteccionTipo, ExtractionResultWithClient } from '@/lib/api/rut-service'

// Interfaz extendida para incluir detección de tipo
export interface RutDetailsWithDetection extends RutDetails {
  deteccion_tipo?: DeteccionTipo | null
}

// Constante para el código de Ringana
export const RINGANA_CODIGO_EMPRESA = '17'

// Mapeo de códigos de responsabilidad DIAN a descripciones
export const RESPONSABILIDADES_DIAN: Record<string, string> = {
  // Códigos 01-10
  "01": "Aporte especial para la administración de justicia",
  "02": "Gravamen a los movimientos financieros",
  "03": "Impuesto al Patrimonio",
  "04": "Impuesto sobre la renta - régimen tributario especial",
  "05": "Impuesto sobre la renta - régimen ordinario",
  "06": "Ingresos y patrimonio",
  "07": "Retención en la fuente a título de renta",
  "08": "Retención timbre nacional",
  "09": "Retención en la fuente en el impuesto sobre las ventas",
  "10": "Obligado aduanero",
  // Códigos 11-23 (IVA y Facturación)
  "11": "Ventas régimen común",
  "12": "Ventas régimen simplificado",
  "13": "Gran contribuyente",
  "14": "Informante de exógena",
  "15": "Autorretenedor",
  "16": "Obligación de facturar por ingresos excluidos",
  "17": "Profesionales de compra y venta de divisas",
  "18": "Precios de Transferencia",
  "19": "Productor y/o exportador de bienes exentos",
  "20": "Obtención NIT",
  "21": "Declarar ingreso/salida de divisas",
  "22": "Obligado a cumplir deberes formales a nombre de terceros",
  "23": "Agente de retención en el impuesto sobre las ventas",
  // Códigos 26-42
  "26": "Declaración Informativa Individual Precios de transferencia",
  "32": "Impuesto Nacional a la Gasolina y al ACPM",
  "33": "Impuesto Nacional al consumo",
  "36": "Establecimiento Permanente",
  "39": "Proveedor de Servicios Tecnológicos PST",
  "41": "Declaración anual de activos en el exterior",
  "42": "Obligado a Llevar Contabilidad",
  // Códigos 45-53 (IVA y Facturación Electrónica)
  "45": "Autorretenedor de rendimientos financieros",
  "46": "IVA Prestadores de Servicios desde el Exterior",
  "47": "Régimen Simple de Tributación – SIMPLE",
  "48": "Impuesto sobre las ventas - IVA",
  "49": "No responsable de IVA",
  "50": "No responsable de Consumo restaurantes y bares",
  "51": "Agente retención impoconsumo de bienes inmuebles",
  "52": "Facturador electrónico",
  "53": "Persona Jurídica No Responsable de IVA",
  // Códigos 54-66 (Información y nuevos impuestos Ley 2277/2022)
  "54": "Intercambio Automático de Información CRS",
  "55": "Informante de Beneficiarios Finales",
  "56": "Impuesto al Carbono",
  "58": "Intercambio Automático de Información FATCA",
  "59": "Autorretención especial renta",
  "60": "Autorretención rendimientos financieros (Superfinanciera)",
  "61": "Autorretención comisiones (Superfinanciera)",
  "62": "Impuesto nacional sobre productos plásticos",
  "63": "Impuesto a las bebidas ultraprocesadas azucaradas",
  "64": "Impuesto a los productos comestibles ultraprocesados",
  "65": "Renta Presencia económica significativa (PES)",
  "66": "Intercambio Automático de Información DPI",
}

export class RinganaExcelExportService {

  /**
   * Formatea un código de responsabilidad con su descripción
   * @param codigo Código de responsabilidad (ej: "49")
   * @returns Formato "49 - No responsable de IVA" o solo el código si no existe descripción
   */
  private static formatResponsabilidad(codigo: string | null | undefined): string | null {
    if (!codigo) return null
    const codigoLimpio = codigo.toString().trim().padStart(2, '0')
    const descripcion = RESPONSABILIDADES_DIAN[codigoLimpio]
    return descripcion ? `${codigoLimpio} - ${descripcion}` : codigoLimpio
  }

  // Mapeo de departamentos a códigos
  private static DEPARTAMENTO_MAP: Record<string, string> = {
    'AMAZONAS': '91',
    'ANTIOQUIA': '05',
    'ARAUCA': '81',
    'ATLANTICO': '08',
    'BOGOTA': '11',
    'BOGOTA D.C.': '11',
    'BOLIVAR': '13',
    'BOYACA': '15',
    'CALDAS': '17',
    'CAQUETA': '18',
    'CASANARE': '85',
    'CAUCA': '19',
    'CESAR': '20',
    'CHOCO': '27',
    'CORDOBA': '23',
    'CUNDINAMARCA': '25',
    'GUAINIA': '94',
    'GUAVIARE': '95',
    'HUILA': '41',
    'LA GUAJIRA': '44',
    'MAGDALENA': '47',
    'META': '50',
    'NARIÑO': '52',
    'NORTE DE SANTANDER': '54',
    'PUTUMAYO': '86',
    'QUINDIO': '63',
    'RISARALDA': '66',
    'SAN ANDRES': '88',
    'SANTANDER': '68',
    'SUCRE': '70',
    'TOLIMA': '73',
    'VALLE DEL CAUCA': '76',
    'VAUPES': '97',
    'VICHADA': '99'
  }

  private static getDepartamentoCodigo(departamento: string): string {
    if (!departamento) return '11' // Default Bogotá
    const normalizado = departamento.toUpperCase().trim()
    return this.DEPARTAMENTO_MAP[normalizado] || '11'
  }

  private static formatDate(dateString: string): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  private static formatDateNumeric(dateString: string): number {
    if (!dateString) return 0
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 0
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return parseInt(`${year}${month}${day}`)
  }

  private static getTodayFormatted(): number {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return parseInt(`${year}${month}${day}`)
  }

  // Parsear nombre completo en apellidos y nombres (para personas naturales)
  private static parseNombreCompleto(razonSocial: string): { apellido1: string; apellido2: string; nombres: string } {
    if (!razonSocial) return { apellido1: '', apellido2: '', nombres: '' }

    const partes = razonSocial.trim().split(/\s+/)

    if (partes.length === 1) {
      return { apellido1: partes[0], apellido2: '', nombres: '' }
    } else if (partes.length === 2) {
      return { apellido1: partes[0], apellido2: '', nombres: partes[1] }
    } else if (partes.length === 3) {
      return { apellido1: partes[0], apellido2: partes[1], nombres: partes[2] }
    } else {
      // 4 o más partes: primeras 2 son apellidos, resto son nombres
      return {
        apellido1: partes[0],
        apellido2: partes[1],
        nombres: partes.slice(2).join(' ')
      }
    }
  }

  // Determinar tipo de documento basado en el NIT
  private static getTipoDocumento(nit: string, tipoContribuyente: string): string {
    if (tipoContribuyente.toUpperCase().includes('JURIDIC')) {
      return 'N' // NIT para jurídicas
    }
    // Para naturales, si tiene 10+ dígitos probablemente es cédula
    if (nit.length >= 10) {
      return 'C' // Cédula
    }
    return 'C' // Default cédula para naturales
  }

  /**
   * Separar resultados por tipo de contribuyente
   */
  public static separarPorTipo(results: ExtractionResultWithClient[]): {
    naturales: ExtractionResultWithClient[]
    juridicas: ExtractionResultWithClient[]
  } {
    const naturales: ExtractionResultWithClient[] = []
    const juridicas: ExtractionResultWithClient[] = []

    results.forEach(result => {
      if (!result.success || !result.data) return

      const deteccion = result.data.deteccion_tipo

      if (deteccion) {
        // Si hay detección automática, usarla
        if (deteccion.tipo_contribuyente_detectado === 'NATURAL') {
          naturales.push(result)
        } else {
          juridicas.push(result)
        }
      } else {
        // Si no hay detección, inferir del tipo_contribuyente del RUT
        const tipoRut = result.data.rut_data.tipo_contribuyente?.toUpperCase() || ''
        if (tipoRut.includes('NATURAL') || tipoRut === '1') {
          naturales.push(result)
        } else {
          juridicas.push(result)
        }
      }
    })

    return { naturales, juridicas }
  }

  /**
   * Exportar archivo JHR para personas naturales
   * Estructura: Inicial, Terceros, Clientes, Proveedores, Final
   */
  public static async exportPersonasNaturalesJHR(
    results: ExtractionResultWithClient[],
    tipoTercero: 'cliente' | 'proveedor'
  ): Promise<void> {
    const workbook = XLSX.utils.book_new()
    const fechaHoy = this.getTodayFormatted()

    // Hoja Inicial
    const inicialData = [['Compañía'], [17]]
    const inicialWs = XLSX.utils.aoa_to_sheet(inicialData)
    XLSX.utils.book_append_sheet(workbook, inicialWs, 'Inicial')

    // Hoja Terceros
    const tercerosHeaders = [
      'Compañía', 'Código del Tercero', 'Numero de documento de identificación del tercero',
      'Tipo de identificación C=CEDULA N=NIT P=PASAPORTE X=RUC  E=CEDULA EXTRANJERIA',
      'Tipo de tercero 1=NATURAL 2=JURIDICA', 'Razón social', 'Apellido 1', 'Apellido 2', 'Nombres',
      'Indicador de tercero cliente 0=No, 1=Si', 'Indicador de tercero proveedor 0=No, 1=Si',
      'Indicador de tercero empleado 0=No, 1=Si', 'Contacto', 'Dirección 1', 'Dirección 2',
      'País', 'Departamento', 'Ciudad', 'Teléfono', 'Dirección de correo electrónico',
      'Fecha nacimiento', 'Código actividad economica', 'Telefono celular'
    ]
    const tercerosData: any[][] = [tercerosHeaders]

    // Hoja Clientes
    const clientesHeaders = [
      'Compañía', 'Código del cliente', 'Razón social del cliente', 'Condición de pago',
      'Tipo de cliente', 'Contacto', 'Dirección 1', 'País', 'Departamento', 'Ciudad',
      'Teléfono', 'Dirección de correo electrónico', 'Fecha de ingreso AAAAMMDD', 'Telefono Celula'
    ]
    const clientesData: any[][] = [clientesHeaders]

    // Hoja Proveedores
    const proveedoresHeaders = [
      'Compañía', 'Código del proveedor', 'Descripción de la sucursal', 'Moneda',
      'Clase de proveedor', 'Condición de pago', 'Tipo de proveedor', 'Contacto',
      'Dirección 1', 'Dirección 2', 'País', 'Departamento', 'Ciudad', 'Teléfono',
      'Dirección de correo electrónico', 'Fecha de ingreso', 'Telefono Celular'
    ]
    const proveedoresData: any[][] = [proveedoresHeaders]

    results.forEach(result => {
      if (!result.success || !result.data) return
      const rut = result.data.rut_data
      const { apellido1, apellido2, nombres } = this.parseNombreCompleto(rut.razon_social)
      const depCodigo = this.getDepartamentoCodigo(rut.departamento)
      const tipoDoc = this.getTipoDocumento(rut.nit, rut.tipo_contribuyente)
      const esCliente = tipoTercero === 'cliente' ? 1 : 1 // Ambos son 1 según el ejemplo
      const esProveedor = tipoTercero === 'proveedor' ? 1 : 1

      // Fila Terceros
      tercerosData.push([
        17,                                    // Compañía
        rut.nit,                              // Código del Tercero
        parseInt(rut.nit) || rut.nit,         // Numero de documento
        tipoDoc,                              // Tipo de identificación
        1,                                    // Tipo de tercero (1=NATURAL)
        rut.razon_social,                     // Razón social
        apellido1,                            // Apellido 1
        apellido2,                            // Apellido 2
        nombres,                              // Nombres
        esCliente,                            // Indicador cliente
        esProveedor,                          // Indicador proveedor
        0,                                    // Indicador empleado
        rut.razon_social,                     // Contacto
        rut.direccion_principal,              // Dirección 1
        null,                                 // Dirección 2
        169,                                  // País (Colombia)
        depCodigo,                            // Departamento
        '001',                                // Ciudad
        parseInt(rut.telefono_1) || rut.telefono_1, // Teléfono
        rut.correo_electronico,               // Email
        fechaHoy,                             // Fecha nacimiento/ingreso
        rut.actividad_principal_codigo || '0010', // Código actividad
        parseInt(rut.telefono_1) || rut.telefono_1  // Celular
      ])

      // Fila Clientes
      clientesData.push([
        17,                                   // Compañía
        rut.nit,                             // Código del cliente
        rut.razon_social,                    // Razón social
        '001',                               // Condición de pago
        '001',                               // Tipo de cliente
        rut.razon_social,                    // Contacto
        rut.direccion_principal,             // Dirección 1
        169,                                 // País
        depCodigo,                           // Departamento
        '001',                               // Ciudad
        parseInt(rut.telefono_1) || rut.telefono_1, // Teléfono
        rut.correo_electronico,              // Email
        fechaHoy,                            // Fecha de ingreso
        null                                 // Teléfono Celular
      ])

      // Fila Proveedores
      proveedoresData.push([
        17,                                   // Compañía
        rut.nit,                             // Código del proveedor
        rut.razon_social,                    // Descripción de la sucursal
        'COP',                               // Moneda
        '001',                               // Clase de proveedor
        '001',                               // Condición de pago
        '0011',                              // Tipo de proveedor
        rut.razon_social,                    // Contacto
        rut.direccion_principal,             // Dirección 1
        null,                                // Dirección 2
        169,                                 // País
        depCodigo,                           // Departamento
        '001',                               // Ciudad
        parseInt(rut.telefono_1) || rut.telefono_1, // Teléfono
        rut.correo_electronico,              // Email
        fechaHoy,                            // Fecha de ingreso
        null                                 // Teléfono Celular
      ])
    })

    // Crear hojas
    const tercerosWs = XLSX.utils.aoa_to_sheet(tercerosData)
    XLSX.utils.book_append_sheet(workbook, tercerosWs, 'Terceros')

    const clientesWs = XLSX.utils.aoa_to_sheet(clientesData)
    XLSX.utils.book_append_sheet(workbook, clientesWs, 'Clientes')

    const proveedoresWs = XLSX.utils.aoa_to_sheet(proveedoresData)
    XLSX.utils.book_append_sheet(workbook, proveedoresWs, 'Proveedores')

    // Hoja Final
    const finalData = [['Compañía'], [17]]
    const finalWs = XLSX.utils.aoa_to_sheet(finalData)
    XLSX.utils.book_append_sheet(workbook, finalWs, 'Final')

    // Generar nombre de archivo
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `CLIENTES_PROVEEDORES_JHR_PersonasNaturales_${timestamp}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  /**
   * Exportar archivo PARTE INFORMATIVA RUT para personas naturales
   */
  public static async exportParteInformativaRUT(
    results: ExtractionResultWithClient[]
  ): Promise<void> {
    const workbook = XLSX.utils.book_new()

    const headers = [
      'CódRingana ', 'CódDoc', 'No.Documento- NIT ', 'Apellidos', 'Apellidos2', 'Nombres',
      'Dirección', 'Departamento', 'Ciudad', 'Correoelectrónico', 'Teléfono1', 'Teléfono2',
      'Actividad', 'CódResponsabilidad1', 'CódResponsabilidad2', 'CódResponsabilidad3',
      'CódResponsabilidad4', 'CódResponsabilidad5', 'CódResponsabilidad6',
      'FechaRUT', 'País', 'Departamento', 'Ciudad'
    ]

    const data: any[][] = [headers]

    results.forEach(result => {
      if (!result.success || !result.data) return
      const rut = result.data.rut_data
      const { apellido1, apellido2, nombres } = this.parseNombreCompleto(rut.razon_social)
      const depCodigo = this.getDepartamentoCodigo(rut.departamento)

      // Parsear responsabilidades con formato "código - descripción"
      const responsabilidades = rut.responsabilidades || []
      const resp1 = this.formatResponsabilidad(responsabilidades[0])
      const resp2 = this.formatResponsabilidad(responsabilidades[1])
      const resp3 = this.formatResponsabilidad(responsabilidades[2])
      const resp4 = this.formatResponsabilidad(responsabilidades[3])
      const resp5 = this.formatResponsabilidad(responsabilidades[4])
      const resp6 = this.formatResponsabilidad(responsabilidades[5])

      // Fecha del RUT (convertir a número Excel si es posible)
      let fechaRut: number | string = ''
      if (rut.fecha_generacion_pdf) {
        const date = new Date(rut.fecha_generacion_pdf)
        if (!isNaN(date.getTime())) {
          // Convertir a número de serie de Excel (días desde 1900-01-01)
          fechaRut = Math.floor((date.getTime() - new Date('1899-12-30').getTime()) / (24 * 60 * 60 * 1000))
        }
      }

      data.push([
        parseInt(rut.nit) || rut.nit,          // CódRingana
        13,                                      // CódDoc (13 = Cédula según el ejemplo)
        parseInt(rut.nit) || rut.nit,          // No.Documento- NIT
        apellido1 + (apellido2 ? ' ' + apellido2 : ''), // Apellidos
        null,                                    // Apellidos2
        nombres,                                 // Nombres
        rut.direccion_principal, // Dirección
        rut.departamento,                        // Departamento (nombre)
        rut.ciudad_municipio,                    // Ciudad (nombre)
        rut.correo_electronico,                  // Correoelectrónico
        parseInt(rut.telefono_1) || rut.telefono_1 || null, // Teléfono1
        null,                                    // Teléfono2
        parseInt(rut.actividad_principal_codigo) || rut.actividad_principal_codigo, // Actividad
        resp1,                                   // CódResponsabilidad1
        resp2,                                   // CódResponsabilidad2
        resp3,                                   // CódResponsabilidad3
        resp4,                                   // CódResponsabilidad4
        resp5,                                   // CódResponsabilidad5
        resp6,                                   // CódResponsabilidad6
        fechaRut,                                // FechaRUT
        169,                                     // País
        depCodigo,                               // Departamento (código)
        '001'                                    // Ciudad (código)
      ])
    })

    const worksheet = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoja1')

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `PARTE_INFORMATIVA_RUT_${timestamp}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  /**
   * Exportar archivo Formato clientes proveedores para personas jurídicas
   */
  public static async exportPersonasJuridicas(
    results: ExtractionResultWithClient[],
    tipoTercero: 'cliente' | 'proveedor'
  ): Promise<void> {
    const workbook = XLSX.utils.book_new()
    const fechaHoy = this.getTodayFormatted()

    // Hoja Inicial
    const inicialData = [['Compañía'], [17]]
    const inicialWs = XLSX.utils.aoa_to_sheet(inicialData)
    XLSX.utils.book_append_sheet(workbook, inicialWs, 'Inicial')

    // Hoja Terceros
    const tercerosHeaders = [
      'Compañía', 'Código del Tercero', 'Numero de documento de identificación del tercero',
      'Tipo de identificación C=CEDULA N=NIT P=PASAPORTE X=RUC  E=CEDULA EXTRANJERIA',
      'Tipo de tercero 1=NATURAL 2=JURIDICA', 'Razón social', 'Apellido 1', 'Apellido 2', 'Nombres',
      'Indicador de tercero cliente 0=No, 1=Si', 'Indicador de tercero proveedor 0=No, 1=Si',
      'Indicador de tercero empleado 0=No, 1=Si', 'Contacto', 'Dirección 1', 'Dirección 2',
      'País', 'Departamento', 'Ciudad', 'Teléfono', 'Dirección de correo electrónico',
      'Fecha nacimiento', 'Código actividad economica', 'Telefono celular'
    ]
    const tercerosData: any[][] = [tercerosHeaders]

    // Hoja Clientes
    const clientesHeaders = [
      'Compañía', 'Código del cliente', 'Razón social del cliente', 'Moneda',
      'Condición de pago', 'Tipo de cliente', 'Contacto', 'Dirección 1', 'Dirección 2',
      'País', 'Departamento', 'Ciudad', 'Teléfono', 'Dirección de correo electrónico',
      'Fecha de ingreso AAAAMMDD', 'Telefono Celula'
    ]
    const clientesData: any[][] = [clientesHeaders]

    // Hoja Proveedores
    const proveedoresHeaders = [
      'Compañía', 'Código del proveedor', 'Descripción de la sucursal', 'Moneda',
      'Clase de proveedor', 'Condición de pago', 'Tipo de proveedor', 'Contacto',
      'Dirección 1', 'Dirección 2', 'País', 'Departamento', 'Ciudad', 'Teléfono',
      'Dirección de correo electrónico', 'Fecha de ingreso', 'Telefono Celular'
    ]
    const proveedoresData: any[][] = [proveedoresHeaders]

    results.forEach(result => {
      if (!result.success || !result.data) return
      const rut = result.data.rut_data
      const depCodigo = this.getDepartamentoCodigo(rut.departamento)
      const esCliente = tipoTercero === 'cliente' ? 1 : 0
      const esProveedor = tipoTercero === 'proveedor' ? 1 : 0

      // Fila Terceros - Persona Jurídica
      tercerosData.push([
        17,                                    // Compañía
        rut.nit,                              // Código del Tercero
        parseInt(rut.nit) || rut.nit,         // Numero de documento
        'N',                                   // Tipo de identificación (N=NIT para jurídicas)
        2,                                     // Tipo de tercero (2=JURIDICA)
        rut.razon_social,                     // Razón social
        null,                                  // Apellido 1 (vacío para jurídicas)
        null,                                  // Apellido 2
        null,                                  // Nombres
        esCliente,                            // Indicador cliente
        esProveedor,                          // Indicador proveedor
        0,                                    // Indicador empleado
        rut.razon_social,                     // Contacto
        rut.direccion_principal,              // Dirección 1
        null,                                 // Dirección 2
        169,                                  // País (Colombia)
        depCodigo,                            // Departamento
        '001',                                // Ciudad
        parseInt(rut.telefono_1) || rut.telefono_1, // Teléfono
        rut.correo_electronico,               // Email
        fechaHoy,                             // Fecha
        rut.actividad_principal_codigo || '0010', // Código actividad
        parseInt(rut.telefono_1) || rut.telefono_1  // Celular
      ])

      // Fila Clientes - Persona Jurídica
      clientesData.push([
        17,                                   // Compañía
        rut.nit,                             // Código del cliente
        rut.razon_social,                    // Razón social
        'COP',                               // Moneda
        null,                                // Condición de pago
        '001',                               // Tipo de cliente
        null,                                // Contacto
        rut.direccion_principal,             // Dirección 1
        null,                                // Dirección 2
        169,                                 // País
        depCodigo,                           // Departamento
        '001',                               // Ciudad
        parseInt(rut.telefono_1) || rut.telefono_1, // Teléfono
        rut.correo_electronico,              // Email
        fechaHoy,                            // Fecha de ingreso
        null                                 // Teléfono Celular
      ])

      // Fila Proveedores - Persona Jurídica
      proveedoresData.push([
        17,                                   // Compañía
        rut.nit,                             // Código del proveedor
        rut.razon_social,                    // Descripción de la sucursal
        'COP',                               // Moneda
        '001',                               // Clase de proveedor
        '001',                               // Condición de pago
        '0011',                              // Tipo de proveedor
        null,                                // Contacto
        rut.direccion_principal,             // Dirección 1
        null,                                // Dirección 2
        169,                                 // País
        depCodigo,                           // Departamento
        '001',                               // Ciudad
        parseInt(rut.telefono_1) || rut.telefono_1, // Teléfono
        rut.correo_electronico,              // Email
        fechaHoy,                            // Fecha de ingreso
        null                                 // Teléfono Celular
      ])
    })

    // Crear hojas
    const tercerosWs = XLSX.utils.aoa_to_sheet(tercerosData)
    XLSX.utils.book_append_sheet(workbook, tercerosWs, 'Terceros')

    const clientesWs = XLSX.utils.aoa_to_sheet(clientesData)
    XLSX.utils.book_append_sheet(workbook, clientesWs, 'Clientes')

    const proveedoresWs = XLSX.utils.aoa_to_sheet(proveedoresData)
    XLSX.utils.book_append_sheet(workbook, proveedoresWs, 'Proveedores')

    // Hoja Final
    const finalData = [['Compañía'], [17]]
    const finalWs = XLSX.utils.aoa_to_sheet(finalData)
    XLSX.utils.book_append_sheet(workbook, finalWs, 'Final')

    // Generar nombre de archivo
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `Formato_clientes_proveedores_PersonasJuridicas_${timestamp}.xlsx`

    XLSX.writeFile(workbook, fileName)
  }

  /**
   * Función principal para exportar RUTs de Ringana
   * Separa automáticamente por tipo y genera los archivos correspondientes
   */
  public static async exportRingana(
    results: ExtractionResultWithClient[],
    tipoTercero: 'cliente' | 'proveedor'
  ): Promise<{ naturales: number; juridicas: number; archivos: string[] }> {
    const { naturales, juridicas } = this.separarPorTipo(results)
    const archivosGenerados: string[] = []

    // Exportar personas naturales (2 archivos)
    if (naturales.length > 0) {
      await this.exportPersonasNaturalesJHR(naturales, tipoTercero)
      archivosGenerados.push('CLIENTES_PROVEEDORES_JHR_PersonasNaturales.xlsx')

      await this.exportParteInformativaRUT(naturales)
      archivosGenerados.push('PARTE_INFORMATIVA_RUT.xlsx')
    }

    // Exportar personas jurídicas (1 archivo)
    if (juridicas.length > 0) {
      await this.exportPersonasJuridicas(juridicas, tipoTercero)
      archivosGenerados.push('Formato_clientes_proveedores_PersonasJuridicas.xlsx')
    }

    return {
      naturales: naturales.length,
      juridicas: juridicas.length,
      archivos: archivosGenerados
    }
  }
}
