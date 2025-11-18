/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  // Solo usar 'export' para build de producción
  output: isProduction ? 'export' : undefined,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: isProduction ? 'dist' : '.next',
  images: {
    unoptimized: true
  },
  // Headers para desarrollo local (permiten iframe embedding)
  async headers() {
    // En desarrollo, aplicar headers para permitir iframe
    if (!isProduction) {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block'
            },
            {
              key: 'Content-Security-Policy',
              value: "frame-ancestors 'self' https://www.louis-legal.com https://louis-legal.com http://localhost:* https://localhost:* https://auditoria-ejhr-assistant.vercel.app https://louisfrontendtest.vercel.app https://*.vercel.app"
            }
          ]
        }
      ]
    }
    // En producción, Vercel maneja los headers via vercel.json
    return []
  }
}

module.exports = nextConfig