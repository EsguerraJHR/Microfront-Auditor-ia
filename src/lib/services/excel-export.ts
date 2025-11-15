import * as XLSX from 'xlsx'
import { RutDetails } from '@/lib/api/rut-service'
import { ComparativeAnalysisResponse, VariationAnalysis } from '@/lib/api/comparative-analysis-service'

export interface ExcelExportData {
  rutDetails: RutDetails[]
}

export class ExcelExportService {
  // Mapeo de países a códigos de moneda
  private static CURRENCY_MAP: Record<string, string> = {
    'COLOMBIA': 'COP',
    'MEXICO': 'MXN',
    'ARGENTINA': 'ARS',
    'PERU': 'PEN',
    'CHILE': 'CLP',
    'ECUADOR': 'USD',
    'VENEZUELA': 'VES',
    'URUGUAY': 'UYU',
    'PARAGUAY': 'PYG',
    'BOLIVIA': 'BOB'
  }

  private static getCurrencyByCountry(pais: string): string {
    return this.CURRENCY_MAP[pais.toUpperCase()] || 'COP'
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

  private static createClientesData(rutDetails: RutDetails[], codigoEmpresa?: string): any[][] {
    console.log('createClientesData - codigoEmpresa received:', codigoEmpresa)

    // Headers para la hoja Clientes
    const headers = [
      'Compañía',
      'Código del cliente',
      'Razón social del cliente',
      'Moneda',
      'Condición de pago',
      'Tipo de cliente',
      'Contacto',
      'Dirección 1',
      'Dirección 2',
      'País',
      'Departamento',
      'Ciudad',
      'Teléfono',
      'Dirección de correo electrónico',
      'Fecha de ingreso AAAAMMDD',
      'Teléfono Celular'
    ]

    const data = [headers]

    rutDetails.forEach(rut => {
      // Buscar fecha de inicio de ejercicio del primer representante legal
      const fechaInicio = rut.representantes_legales.length > 0
        ? rut.representantes_legales[0].fecha_inicio_ejercicio || ''
        : ''

      const companiaValue = codigoEmpresa || '1'
      console.log('Row compania value:', companiaValue)

      const row = [
        companiaValue, // Compañía - usar codigo_empresa o valor predeterminado
        rut.nit, // Código del cliente
        rut.razon_social, // Razón social del cliente
        this.getCurrencyByCountry(rut.pais), // Moneda basada en país
        '', // Condición de pago - vacío
        '001', // Tipo de cliente - valor predeterminado
        '', // Contacto - vacío
        rut.direccion_principal, // Dirección 1
        '', // Dirección 2 - vacío
        '169', // País - valor predeterminado (Colombia)
        '11', // Departamento - valor predeterminado
        '001', // Ciudad - valor predeterminado
        rut.telefono_1, // Teléfono
        rut.correo_electronico, // Dirección de correo electrónico
        this.formatDate(fechaInicio), // Fecha de ingreso AAAAMMDD
        '' // Teléfono Celular - vacío
      ]

      data.push(row)
    })

    return data
  }

  private static async loadTemplateFile(): Promise<XLSX.WorkBook> {
    try {
      // Intentar cargar el archivo template
      const templatePath = 'C:\\Users\\ANDRES BAYONA\\Documents\\LOUIS FRONTEND\\bpo-business-process-outsourcing\\Formato clientes proveedores BPO.xlsx'

      // Para el navegador, necesitaremos copiar el template manualmente o crear uno básico
      // Por ahora, crearemos la estructura básica
      const wb = XLSX.utils.book_new()

      // Crear hojas vacías con los nombres correctos
      const sheetNames = ['Clientes', 'Proveedores', 'Config'] // Ajusta según las hojas del template

      sheetNames.forEach(name => {
        const ws = XLSX.utils.aoa_to_sheet([[]])
        XLSX.utils.book_append_sheet(wb, ws, name)
      })

      return wb
    } catch (error) {
      console.warn('No se pudo cargar el archivo template, creando estructura básica')
      const wb = XLSX.utils.book_new()

      // Crear hoja de Clientes vacía
      const ws = XLSX.utils.aoa_to_sheet([[]])
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes')

      return wb
    }
  }

  public static async exportToExcel(rutDetails: RutDetails[], codigoEmpresa?: string): Promise<void> {
    console.log('exportToExcel - codigoEmpresa parameter:', codigoEmpresa)

    try {
      // Cargar el template o crear workbook básico
      const workbook = await this.loadTemplateFile()

      // Crear datos para la hoja Clientes
      const clientesData = this.createClientesData(rutDetails, codigoEmpresa)

      // Crear la hoja de Clientes con los datos
      const clientesWorksheet = XLSX.utils.aoa_to_sheet(clientesData)

      // Aplicar estilos básicos a los headers
      const range = XLSX.utils.decode_range(clientesWorksheet['!ref'] || 'A1:P1')

      // Establecer ancho de columnas
      const colWidths = [
        { wch: 10 }, // Compañía
        { wch: 15 }, // Código del cliente
        { wch: 30 }, // Razón social del cliente
        { wch: 8 },  // Moneda
        { wch: 15 }, // Condición de pago
        { wch: 12 }, // Tipo de cliente
        { wch: 20 }, // Contacto
        { wch: 30 }, // Dirección 1
        { wch: 30 }, // Dirección 2
        { wch: 8 },  // País
        { wch: 12 }, // Departamento
        { wch: 8 },  // Ciudad
        { wch: 15 }, // Teléfono
        { wch: 25 }, // Email
        { wch: 12 }, // Fecha ingreso
        { wch: 15 }  // Teléfono Celular
      ]

      clientesWorksheet['!cols'] = colWidths

      // Reemplazar o agregar la hoja Clientes
      if (workbook.Sheets['Clientes']) {
        workbook.Sheets['Clientes'] = clientesWorksheet
      } else {
        XLSX.utils.book_append_sheet(workbook, clientesWorksheet, 'Clientes')
      }

      // Generar nombre de archivo con timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const fileName = `Gestion_Terceros_BPO_${timestamp}.xlsx`

      // Exportar el archivo
      XLSX.writeFile(workbook, fileName)

      return
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      throw new Error('Error al generar el archivo Excel')
    }
  }

  public static async exportClientesListos(rutDetails: RutDetails[]): Promise<void> {
    // Filtrar solo los registros en estado LISTO
    const rutosListos = rutDetails.filter(rut => rut.processing_state === 'LISTO')

    if (rutosListos.length === 0) {
      throw new Error('No hay registros en estado LISTO para exportar')
    }

    await this.exportToExcel(rutosListos)
  }

  // Función para formatear moneda
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Función para crear la hoja resumen ejecutivo
  private static createSummarySheet(data: ComparativeAnalysisResponse): any[][] {
    const summary = [
      ['ANÁLISIS COMPARATIVO DE DECLARACIONES DE RENTA'],
      [''],
      ['Información General'],
      ['NIT:', data.nit],
      ['Razón Social:', data.razon_social],
      ['Año Anterior:', data.previous_year],
      ['Año Actual:', data.current_year],
      ['Fecha de Análisis:', new Date(data.analysis_timestamp).toLocaleString('es-CO')],
      ['Estado:', data.message],
      [''],
      ['Resumen Ejecutivo'],
      ['Campo', 'Año Anterior', 'Año Actual', 'Variación Nominal', 'Variación %'],
      [
        'Patrimonio Bruto',
        this.formatCurrency(data.patrimonio_analysis.previous_value),
        this.formatCurrency(data.patrimonio_analysis.current_value),
        this.formatCurrency(data.patrimonio_analysis.nominal_variation),
        data.patrimonio_analysis.variation_percentage
      ],
      [
        'Total Ingresos Netos',
        this.formatCurrency(data.ingresos_analysis.previous_value),
        this.formatCurrency(data.ingresos_analysis.current_value),
        this.formatCurrency(data.ingresos_analysis.nominal_variation),
        data.ingresos_analysis.variation_percentage
      ],
      [
        'Total Costos y Gastos',
        this.formatCurrency(data.gastos_analysis.previous_value),
        this.formatCurrency(data.gastos_analysis.current_value),
        this.formatCurrency(data.gastos_analysis.nominal_variation),
        data.gastos_analysis.variation_percentage
      ],
      [
        'Renta Líquida',
        this.formatCurrency(data.renta_liquida_analysis.previous_value),
        this.formatCurrency(data.renta_liquida_analysis.current_value),
        this.formatCurrency(data.renta_liquida_analysis.nominal_variation),
        data.renta_liquida_analysis.variation_percentage
      ],
      [
        'Impuesto sobre Renta',
        this.formatCurrency(data.impuesto_analysis.previous_value),
        this.formatCurrency(data.impuesto_analysis.current_value),
        this.formatCurrency(data.impuesto_analysis.nominal_variation),
        data.impuesto_analysis.variation_percentage
      ]
    ]

    // Agregar estadísticas si están disponibles
    if (data.summary && Object.keys(data.summary).length > 0) {
      summary.push([''])
      summary.push(['Estadísticas Generales'])

      if (data.summary.total_fields_analyzed) {
        summary.push(['Total de campos analizados:', data.summary.total_fields_analyzed])
      }
      if (data.summary.fields_with_increases) {
        summary.push(['Campos con incremento:', data.summary.fields_with_increases])
      }
      if (data.summary.fields_with_decreases) {
        summary.push(['Campos con disminución:', data.summary.fields_with_decreases])
      }
      if (data.summary.fields_unchanged) {
        summary.push(['Campos sin cambio:', data.summary.fields_unchanged])
      }
    }

    // Agregar insights clave
    if (data.summary?.key_insights && Array.isArray(data.summary.key_insights)) {
      summary.push([''])
      summary.push(['Insights Clave'])
      data.summary.key_insights.forEach((insight: string) => {
        summary.push([insight])
      })
    }

    return summary
  }

  // Función para crear la hoja de análisis detallado
  private static createDetailedSheet(data: ComparativeAnalysisResponse): any[][] {
    const headers = [
      'Campo',
      'Línea',
      'Año Anterior',
      'Año Actual',
      'Variación Nominal',
      'Variación Relativa (%)',
      'Variación Porcentual'
    ]

    const detailData = [headers]

    data.all_variations.forEach((variation: VariationAnalysis) => {
      detailData.push([
        variation.field_name,
        variation.line_number,
        this.formatCurrency(variation.previous_value),
        this.formatCurrency(variation.current_value),
        this.formatCurrency(variation.nominal_variation),
        variation.relative_variation ? variation.relative_variation.toFixed(2) + '%' : 'N/A',
        variation.variation_percentage || 'N/A'
      ])
    })

    return detailData
  }

  // Función para crear hoja de cambios principales
  private static createMajorChangesSheet(data: ComparativeAnalysisResponse): any[][] {
    if (!data.summary?.major_changes || !Array.isArray(data.summary.major_changes)) {
      return [['No hay cambios principales disponibles']]
    }

    const headers = ['Campo', 'Variación', 'Impacto']
    const changesData = [headers]

    data.summary.major_changes.forEach((change: any) => {
      changesData.push([
        change.field,
        change.change,
        change.impact
      ])
    })

    return changesData
  }

  /**
   * Exporta análisis comparativo en formato Contexto.xlsx
   * Formato: Razón Social, NIT, Año, Tabla con análisis horizontal
   */
  public static async exportContextoFormat(data: ComparativeAnalysisResponse): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new()

      // Estructura del archivo Contexto.xlsx
      const contextoData: any[][] = []

      // Fila 1: Vacía
      contextoData.push(['', '', '', '', '', '', ''])

      // Fila 2: Razón Social
      contextoData.push(['', '', 'Razón Social', data.razon_social, '', '', ''])

      // Fila 3: NIT
      contextoData.push(['', '', 'Nit:', '', data.nit, '', ''])

      // Fila 4: Año
      contextoData.push(['', '', 'Año', data.current_year, '', '', ''])

      // Fila 5: Vacía
      contextoData.push(['', '', '', '', '', '', ''])

      // Fila 6: Vacía
      contextoData.push(['', '', '', '', '', '', ''])

      // Fila 7: Encabezados de años
      contextoData.push(['', '', '', '', `Año 2`, `Año 1`, ''])

      // Fila 8: Encabezados de columnas
      contextoData.push([
        '',
        '',
        'Partida',
        'Renglón',
        `Cifra Renta \nFY ${data.current_year}`,
        `Cifra Renta \nFY ${data.previous_year}`,
        'Variación nominal',
        'Variación relativa'
      ])

      // Agregar todas las variaciones
      data.all_variations.forEach((variation: VariationAnalysis) => {
        contextoData.push([
          '',
          '',
          variation.field_name,
          variation.line_number,
          variation.current_value,
          variation.previous_value,
          variation.nominal_variation,
          variation.relative_variation
        ])
      })

      // Crear worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(contextoData)

      // Configurar anchos de columna
      worksheet['!cols'] = [
        { wch: 2 },   // Columna A (vacía)
        { wch: 2 },   // Columna B (vacía)
        { wch: 30 },  // Columna C (Partida)
        { wch: 10 },  // Columna D (Renglón)
        { wch: 18 },  // Columna E (Año 2)
        { wch: 18 },  // Columna F (Año 1)
        { wch: 18 },  // Columna G (Variación nominal)
        { wch: 18 }   // Columna H (Variación relativa)
      ]

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contexto')

      // Generar nombre de archivo
      const timestamp = new Date().toISOString().slice(0, 10)
      const fileName = `Contexto_${data.razon_social.replace(/[^a-zA-Z0-9]/g, '_')}_${data.current_year}_${timestamp}.xlsx`

      // Exportar archivo
      XLSX.writeFile(workbook, fileName)

    } catch (error) {
      console.error('Error al exportar formato Contexto:', error)
      throw new Error('Error al generar el archivo Excel en formato Contexto')
    }
  }

  // Función principal para exportar análisis comparativo
  public static async exportComparativeAnalysis(data: ComparativeAnalysisResponse): Promise<void> {
    try {
      // Crear workbook
      const workbook = XLSX.utils.book_new()

      // Crear hoja de resumen ejecutivo
      const summaryData = this.createSummarySheet(data)
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData)

      // Configurar anchos de columna para resumen
      summaryWorksheet['!cols'] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 }
      ]

      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen Ejecutivo')

      // Crear hoja de análisis detallado
      const detailedData = this.createDetailedSheet(data)
      const detailedWorksheet = XLSX.utils.aoa_to_sheet(detailedData)

      // Configurar anchos de columna para detallado
      detailedWorksheet['!cols'] = [
        { wch: 25 },
        { wch: 8 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 }
      ]

      XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Análisis Detallado')

      // Crear hoja de cambios principales
      const changesData = this.createMajorChangesSheet(data)
      const changesWorksheet = XLSX.utils.aoa_to_sheet(changesData)

      // Configurar anchos de columna para cambios
      changesWorksheet['!cols'] = [
        { wch: 30 },
        { wch: 15 },
        { wch: 25 }
      ]

      XLSX.utils.book_append_sheet(workbook, changesWorksheet, 'Cambios Principales')

      // Generar nombre de archivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const fileName = `Analisis_Comparativo_${data.nit}_${data.previous_year}_vs_${data.current_year}_${timestamp}.xlsx`

      // Exportar archivo
      XLSX.writeFile(workbook, fileName)

    } catch (error) {
      console.error('Error al exportar análisis comparativo:', error)
      throw new Error('Error al generar el archivo Excel del análisis comparativo')
    }
  }
}