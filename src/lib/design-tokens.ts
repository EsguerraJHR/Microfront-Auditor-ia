// Louis Design System — Design Tokens
// Centralized component styles and animations for the Louis brand

export const componentStyles = {
  badge: {
    success: "bg-success-bg text-success-foreground border-transparent",
    warning: "bg-warning-bg text-warning-foreground border-transparent",
    error: "bg-error-bg text-error-foreground border-transparent",
    info: "bg-info-bg text-info-foreground border-transparent",
  },
  alert: {
    success: "bg-success-bg border-success-bg text-success-foreground",
    warning: "bg-warning-bg border-warning-bg text-warning-foreground",
    error: "bg-error-bg border-error-bg text-error-foreground",
    info: "bg-info-bg border-info-bg text-info-foreground",
  },
} as const

export const animations = {
  pageTransition: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: "easeOut" },
  },
  cardHover: {
    whileHover: { y: -2, boxShadow: "0 8px 30px rgba(23, 45, 95, 0.12)" },
    transition: { duration: 0.2, ease: "easeOut" },
  },
  staggerContainer: {
    initial: "initial",
    animate: "animate",
    variants: {
      initial: {},
      animate: { transition: { staggerChildren: 0.06 } },
    },
  },
  staggerItem: {
    variants: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    },
  },
  spring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
} as const
