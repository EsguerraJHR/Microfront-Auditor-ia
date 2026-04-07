/**
 * Feature Flags Configuration
 *
 * Configuración centralizada de features experimentales o en desarrollo.
 * Permite habilitar/deshabilitar funcionalidades sin modificar código.
 */

export const FEATURES = {
  /**
   * Usar Server-Sent Events (SSE) para mostrar progreso en tiempo real
   * durante el análisis comparativo de declaraciones.
   *
   * true: Usa endpoint /stream con actualizaciones de progreso
   * false: Usa endpoint original sin progreso (más rápido, sin overhead)
   */
  USE_SSE_PROGRESS: true,

  /**
   * Tiempo máximo de espera para la conexión SSE (en milisegundos)
   */
  SSE_TIMEOUT: 300000, // 5 minutos

  /**
   * Habilita la funcionalidad de validación de checklist de IVA
   */
  IVA_VALIDATION_ENABLED: true,

  /**
   * Si es true, requiere datos de declaración de renta para ejecutar la validación de IVA
   * Si es false, permite validación sin renta (algunas validaciones se omitirán)
   */
  IVA_VALIDATION_REQUIRE_RENTA: false,

  /**
   * URL directa al backend para SSE (bypass del API Gateway).
   * Si está definido, los endpoints de SSE usarán esta URL en lugar de NEXT_PUBLIC_API_URL.
   * Útil cuando el API Gateway no soporta streaming SSE.
   *
   * Ejemplo: 'http://localhost:8005'
   */
  SSE_DIRECT_URL: process.env.NEXT_PUBLIC_SSE_DIRECT_URL || null,
} as const;

export type FeatureFlags = typeof FEATURES;
