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
} as const;

export type FeatureFlags = typeof FEATURES;
